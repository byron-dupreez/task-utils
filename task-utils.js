'use strict';

const states = require('./task-states');

const taskDefs = require('./task-defs');

const Tasks = require('./tasks');
const Task = Tasks.Task;
const isTaskLike = Task.isTaskLike;

/**
 * Utilities for accessing and managing tasks and sub-tasks stored in a "tasks-by-name" map object.
 * @module task-utils/task-utils
 * @author Byron du Preez
 */
module.exports = {
  getTask: getTask,
  getSubTask: getSubTask,
  getTasks: getTasks,
  getTasksAndSubTasks: getTasksAndSubTasks,
  setTask: setTask,
  replaceTasksWithNewTasksUpdatedFromOld: replaceTasksWithNewTasksUpdatedFromOld,

  // To simplify usage and reduce the number of explicit imports required
  // 1. Re-export TaskState class and all of its subclasses and TimeoutError class from task-states.js module

  // TimeoutError constructor
  TimeoutError: states.TimeoutError,

  // TaskState constructors
  TaskState: states.TaskState,

  // TaskState direct subclasses
  Unstarted: states.Unstarted, // rather use UNSTARTED singleton
  CompletedState: states.CompletedState,
  TimedOutState: states.TimedOutState,
  FailedState: states.FailedState,
  RejectedState: states.RejectedState,

  // CompletedState subclasses
  Completed: states.Completed, // rather use COMPLETED singleton
  Succeeded: states.Succeeded, // rather use SUCCEEDED singleton

  // TimedOutState subclasses
  TimedOut: states.TimedOut,

  // FailedState subclasses
  Failed: states.Failed,

  // RejectedState subclasses
  Rejected: states.Rejected,
  Discarded: states.Discarded,
  Abandoned: states.Abandoned,

  // 2. Re-export TaskDef class from task-defs.js module
  TaskDef: taskDefs.TaskDef,

  // 3. Re-export Task class from tasks.js module
  Task: Tasks.Task
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
  tasks.forEach(task => forEach(task, t => allTasksAndSubTasks.push(t)));

  return allTasksAndSubTasks;
}

function forEach(task, callback) {
  callback(task);
  task.subTasks.forEach(t => forEach(t, callback));
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
 * @param {Object|Map} tasksByName - the tasksByName "map" object (or Map) on which to replace its tasks
 * @param {TaskDef[]} activeTaskDefs - a list of active task definitions from which to create the new tasks
 * @returns {Array.<Task[]>} both the updated, newly created tasks and any abandoned tasks
 */
function replaceTasksWithNewTasksUpdatedFromOld(tasksByName, activeTaskDefs) {
  // Fetch any and all of the existing previous version tasks from the given tasksByName map
  const priorTasks = getTasks(tasksByName);

  // Create new tasks from the given active task definitions and update them with the info from the previous tasks
  const newTasksAndAbandonedTasks = Task.createNewTasksUpdatedFromPriorVersions(activeTaskDefs, priorTasks);
  const newTasks = newTasksAndAbandonedTasks[0];
  const abandonedTasks = newTasksAndAbandonedTasks[1];
  const allTasks = newTasks.concat(abandonedTasks);

  // Replace all of the existing tasks on the given tasksByName map with the new and abandoned tasks
  allTasks.forEach(task => setTask(tasksByName, task.name, task));

  return newTasksAndAbandonedTasks;
}

// function setTask(target, taskName, task) {
//   let oldTask = undefined;
//   if (target instanceof Map) {
//     oldTask = target.get(taskName);
//     target.set(taskName, task);
//   } else if (target && typeof target === 'object') {
//     oldTask = target[taskName];
//     target[taskName] = task;
//   }
//   return oldTask;
// }
