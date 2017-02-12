'use strict';

const TaskDef = require('./task-defs');
const TaskFactory = require('./task-factory');
const Task = require('./tasks');
const isTaskLike = Task.isTaskLike;
const errors = require('./errors');
const states = require('./task-states');
const Objects = require('core-functions/objects');
const Strings = require('core-functions/strings');
const stringify = Strings.stringify;
const Booleans = require('core-functions/booleans');
const isTrueOrFalse = Booleans.isTrueOrFalse;
const tries = require('core-functions/tries');
const Try = tries.Try;
const Failure = tries.Failure;

/**
 * Utilities for accessing and managing tasks and sub-tasks stored in a "tasks-by-name" map object and for constructing
 * and configuring a task factory on a context.
 * @module task-utils/task-utils
 * @author Byron du Preez
 */
module.exports = {
  // Functions to get tasks from and set tasks into tasks by name maps
  getTask: getTask,
  getSubTask: getSubTask,
  getTasks: getTasks,
  getTasksAndSubTasks: getTasksAndSubTasks,
  setTask: setTask,
  // Function to replace task-likes in a tasks by name map with new tasks updated from the old task-likes
  replaceTasksWithNewTasksUpdatedFromOld: replaceTasksWithNewTasksUpdatedFromOld,
  // Task factory configuration
  isTaskFactoryConfigured: isTaskFactoryConfigured,
  configureTaskFactory: configureTaskFactory,
  constructTaskFactory: constructTaskFactory,
  getDefaultTaskFactoryOpts: getDefaultTaskFactoryOpts,

  // To simplify usage and reduce the number of explicit imports required

  // 1. Re-export errors for convenience
  TimeoutError: errors.TimeoutError,
  FrozenError: errors.FrozenError,
  FinalisedError: errors.FinalisedError,

  // 2. Re-export TaskState class and all of its subclasses and TimeoutError class from task-states.js module

  // TaskState constructors
  TaskState: states.TaskState,

  // TaskState direct subclasses
  Unstarted: states.Unstarted, // rather use instances.Unstarted singleton
  Started: states.Started, // rather use instances.Started singleton
  CompletedState: states.CompletedState,
  TimedOutState: states.TimedOutState,
  FailedState: states.FailedState,
  RejectedState: states.RejectedState,

  // CompletedState subclasses
  Completed: states.Completed, // rather use instances.Completed singleton
  Succeeded: states.Succeeded, // rather use instances.Succeeded singleton

  // TimedOutState subclasses
  TimedOut: states.TimedOut,

  // FailedState subclasses
  Failed: states.Failed,

  // RejectedState subclasses
  Rejected: states.Rejected,
  Discarded: states.Discarded,
  Abandoned: states.Abandoned,

  // 3. Re-export TaskDef class from task-defs.js module
  TaskDef: TaskDef,

  // 4. Re-export TaskFactory class from task-factory.js module
  TaskFactory: TaskFactory,

  // 5. Re-export Task class from tasks.js module
  Task: Task
};

/**
 * Gets the named task from the given tasksByName "map" object (or Map); otherwise returns undefined.
 * @param {Object|Map} tasksByName - the tasksByName "map" object (or Map) from which to get the named task
 * @param {string} taskName - the name of the task to get
 * @return {Task|TaskLike|undefined|*} the task or task-like object (ideally) or any value found; otherwise undefined
 */
function getTask(tasksByName, taskName) {
  return tasksByName instanceof Map ? tasksByName.get(taskName) : tasksByName ? tasksByName[taskName] : undefined;
}

/**
 * Gets the named sub-task of the named task from the given tasksByName "map" object (or Map); otherwise returns
 * undefined.
 *
 * If subTaskName contains an array of names, then these names are used to recurse down through the named task's
 * hierarchy of sub-tasks to locate the sub-task. For example, given taskName 'Task 1' and subTaskName(s) of
 * ['Sub-task 1.3', 'Sub-task 1.3.2', 'Sub-task 1.3.2.4'] this would effectively execute:
 * `getTask(source, 'Task 1').getSubTask('Sub-task 1.3').getSubTask('Sub-task 1.3.2').getSubTask('Sub-task 1.3.2.4');`
 *
 * @param {Object|Map} tasksByName - the tasksByName "map" object (or Map) from which to get the named task
 * @param {string} taskName - the name of the task property from which to get the value
 * @param {string|string[]} subTaskName - the name (or names) of the sub-task on the named task
 * @return {Task|TaskLike|undefined} the sub-task or sub-task-like object; otherwise undefined (if none)
 */
function getSubTask(tasksByName, taskName, subTaskName) {
  let subTask = undefined;
  let task = tasksByName instanceof Map ? tasksByName.get(taskName) : tasksByName ? tasksByName[taskName] : undefined;
  const subTaskNames = Array.isArray(subTaskName) ? subTaskName : [subTaskName];
  for (let i = 0; i < subTaskNames.length; ++i) {
    const name = subTaskNames[i];
    if (task instanceof Task) {
      subTask = task.getSubTask(name);
    } else if (task && task.subTasks) {
      subTask = task.subTasks.find(st => st.name === name);
    } else {
      return undefined;
    }
    task = subTask;
  }
  return subTask;
}

/**
 * Finds and returns all of the tasks (i.e. Task or Task-like objects) registered by their names as properties (or keys)
 * on the given tasksByName object (or Map).
 * @param {Object|Map} tasksByName - the tasksByName object (or Map)
 * @returns {Task[]|TaskLike[]} the list of Tasks and/or Task-like objects found
 */
function getTasks(tasksByName) {
  const tasks = [];
  if (tasksByName instanceof Map) {
    // tasksByName is a Map
    tasksByName.forEach((task, taskName) => {
      if (isTaskLike(task, taskName)) {
        tasks.push(task);
      }
    });
  } else if (tasksByName && typeof tasksByName === 'object') {
    // tasksByName is a "dictionary"/"map" object
    const taskNames = Object.getOwnPropertyNames(tasksByName);
    for (let i = 0; i < taskNames.length; ++i) {
      const taskName = taskNames[i];
      const task = tasksByName[taskName];
      if (Task.isTaskLike(task, taskName)) {
        tasks.push(task);
      }
    }
  }
  return tasks;
}

/**
 * Finds and returns all of the tasks (i.e. Task or Task-like objects) registered by their names as properties (or keys)
 * on the given tasksByName object (or Map) and also all of their sub-tasks recursively.
 * @param {Object|Map} tasksByName - the tasksByName object (or Map)
 * @returns {Task[]|TaskLike[]} the list of Tasks and/or Task-like objects found and all of their sub-tasks recursively
 */
function getTasksAndSubTasks(tasksByName) {
  // First get all of the tasks on the given tasksByName map
  const tasks = getTasks(tasksByName);

  const allTasksAndSubTasks = [];

  // Collect all tasks and all of their subtasks recursively
  tasks.forEach(task => Task.forEachTaskLike(task, t => allTasksAndSubTasks.push(t)));

  return allTasksAndSubTasks;
}

/**
 * Puts the given task into the given tasksByName "map" object (or Map) using the given taskName as the key.
 * @param {Object|Map} tasksByName - the tasksByName "map" object (or Map) on which to set the task
 * @param {string} taskName - the name of the task to use as the key into the map
 * @param {Task} task - the task to set
 * @return {Object|Map} the given tasksByName "map object (or Map)
 */
function setTask(tasksByName, taskName, task) {
  tasksByName instanceof Map ? tasksByName.set(taskName, task) : tasksByName[taskName] = task;
  return tasksByName;
}

/**
 * Replaces all of the old tasks in the given tasksByName "map" object with new tasks created from the given list of
 * active task definitions and updates these new tasks with the status-related information of the old tasks or task-
 * like objects, which are the prior versions of the tasks from a previous attempt (if any). Any and all old tasks that
 * do NOT appear in the list of new active tasks are also recreated and added to the given tasksByName as abandoned
 * tasks. Finally, returns both the newly created and updated, active tasks and any no longer active, abandoned tasks
 * that were all added to the given tasksByName.
 *
 * @param {Object|Map} tasksByName - the tasksByName "map" object (or Map) on which to replace its old tasks or task-likes
 * @param {TaskDef[]} activeTaskDefs - a list of active task definitions from which to create the new tasks
 * @param {TaskFactory} taskFactory - the task factory to use to create the replacement tasks
 * @param {TaskOpts|undefined} [opts] - optional options to use to alter the behaviour of all newly created Tasks
 * @returns {Array.<Task[]>} both the updated, newly created tasks and any abandoned tasks
 */
function replaceTasksWithNewTasksUpdatedFromOld(tasksByName, activeTaskDefs, taskFactory, opts) {
  // Fetch any and all of the existing previous version tasks from the given tasksByName map
  const priorTasks = getTasks(tasksByName);

  // Create new tasks from the given active task definitions and update them with the info from the previous tasks
  const newTasksAndAbandonedTasks = taskFactory.createNewTasksUpdatedFromPriorVersions(activeTaskDefs, priorTasks, opts);
  const newTasks = newTasksAndAbandonedTasks[0];
  const abandonedTasks = newTasksAndAbandonedTasks[1];
  const allTasks = newTasks.concat(abandonedTasks);

  // Replace all of the existing tasks on the given tasksByName map with the new and abandoned tasks
  allTasks.forEach(task => setTask(tasksByName, task.name, task));

  return newTasksAndAbandonedTasks;
}

/**
 * Returns true if a valid TaskFactory instance is already configured on the given context object; false otherwise.
 * @param {TaskFactoryAware|Object} context - the context to check
 * @returns {boolean} true if the context is configured with a valid TaskFactory; false otherwise
 */
function isTaskFactoryConfigured(context) {
  return context.taskFactory instanceof TaskFactory;
}

/**
 * Constructs a new task factory using the given optional settings and with the given logger and optional factory opts
 * and then configures the given context object with the new task factory, but ONLY if the given context does NOT
 * already have a valid task factory.
 * @param {TaskFactoryAware|Object} context - the context onto which to configure a task factory
 * @param {TaskFactorySettings|undefined} [settings] - optional settings to use to construct the task factory
 * @param {BasicLogger|console|undefined} [logger] - the logger with which to construct the task factory (defaults to console if undefined)
 * @param {TaskFactoryOptions|undefined} [factoryOpts] - optional factory opts with which to construct the task factory
 * @returns {TaskFactoryAware} the given context configured with a task factory
 */
function configureTaskFactory(context, settings, logger, factoryOpts) {
  // Check if a task factory is already configured on the context
  if (isTaskFactoryConfigured(context)) {
    return context;
  }
  // Resolve the task factory opts to be used
  const opts = factoryOpts && typeof factoryOpts === 'object' ? Objects.copy(factoryOpts, {deep: true}) : {};
  Objects.merge(getDefaultTaskFactoryOpts(), opts);

  // Resolve the `createTaskFactory` function to use (if configured)
  const createTaskFactory = settings && typeof settings === 'object' && settings.createTaskFactory ?
    settings.createTaskFactory : undefined;

  context.taskFactory = constructTaskFactory(createTaskFactory, logger, opts);

  return context;
}

/** Loads the local default options & merges them with the static default options */
function getDefaultTaskFactoryOpts() {
  const defaultOptions = Objects.copy(require('./default-factory-opts.json'), {deep: true});
  // Remove any non-boolean defaultOptions.returnSuccessOrFailure
  if (!isTrueOrFalse(defaultOptions.returnSuccessOrFailure)) {
    delete defaultOptions.returnSuccessOrFailure;
  }
  return Objects.merge({returnSuccessOrFailure: false}, defaultOptions);
}

/**
 * Constructs a new task factory with the given logger and factory opts using either the given `createTaskFactory`
 * function (if defined) or the default TaskFactory constructor (if not).
 * @param {CreateTaskFactory|undefined} [createTaskFactory] - an optional function to use to create a new task factory
 * @param {BasicLogger|console|undefined} [logger] - the logger with which to construct the task factory (defaults to console if undefined)
 * @param {TaskFactoryOptions|undefined} [opts] - optional opts with which to construct the task factory
 * @returns {TaskFactory} a new TaskFactory instance
 * @throws {Error} if the given createTaskFactory function is defined, but is not a function or does not create a valid
 * TaskFactory or if it throws an error
 */
function constructTaskFactory(createTaskFactory, logger, opts) {
  if (!logger) logger = console;
  if (createTaskFactory) {
    // Ensure that `createTaskFactory` is a function
    if (typeof createTaskFactory !== "function") {
      const errMsg = `Failed to construct a task factory, since createTaskFactory (${stringify(createTaskFactory)}) is NOT a function `;
      logger.error(errMsg);
      throw new Error(errMsg);
    }
    // Attempt to create a task factory using the given `createTaskFactory` function
    const outcome = Try.try(() => createTaskFactory(logger, opts)).map(
      taskFactory => {
        // Ensure that the `createTaskFactory` function actually returned a valid TaskFactory instance
        if (!(taskFactory instanceof TaskFactory)) {
          const errMsg = `Failed to construct a task factory, since ${stringify(createTaskFactory)} did NOT create an instance of TaskFactory - unexpected result: ${stringify(taskFactory)}`;
          logger.error(errMsg);
          return new Failure(new Error(errMsg)); // throw new Error(errMsg);
        }
        logger.log('INFO', `Constructed a ${taskFactory.constructor.name} task factory using ${stringify(createTaskFactory)}`);
        return taskFactory;
      },
      err => {
        const errMsg = `Failed to construct a task factory, since ${stringify(createTaskFactory)} failed`;
        logger.error(errMsg, err.stack);
        return new Failure(err); // throw err;
      }
    );
    return outcome.get();
  }
  logger.log('INFO', `Constructed a TaskFactory task factory using the default TaskFactory constructor`);
  return new TaskFactory(logger, opts);
}