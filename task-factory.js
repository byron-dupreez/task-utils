'use strict';

/**
 * A Task factory class for creating executable tasks and both executable and non-executable sub-tasks that can be used
 * to track the state of tasks or operations. A task factory also generates wrapper `execute` functions for executable
 * tasks and sub-tasks.
 * @module task-utils/task-factory
 * @author Byron du Preez
 */

const isInstanceOf = require('core-functions/objects').isInstanceOf;

const strings = require('core-functions/strings');
const stringify = strings.stringify;

const core = require('./core');
const ReturnMode = core.ReturnMode;
const FrozenError = core.FrozenError;
const FinalisedError = core.FinalisedError;

const tries = require('core-functions/tries');
const Try = tries.Try;
const Failure = tries.Failure;

const Promises = require('core-functions/promises');
// const CancelledError = Promises.CancelledError;

const Task = require('./tasks');
const TaskDef = require('./task-defs');
const states = require('./task-states');
const TaskState = states.TaskState;

//======================================================================================================================
// TaskFactory "class"
//======================================================================================================================

/**
 * A factory for creating tasks and for generating `execute` methods for created tasks, which wrap & supplement the
 * behaviour of the tasks' definitions' original `execute` functions.
 * This class provides a way to override the default task execution functionality if necessary.
 */
class TaskFactory {

  /**
   * Constructs a new task factory.
   * @param {TaskFactorySettings|undefined} [settings] - optional settings to use to configure the behaviour of this factory
   * @param {TaskFactoryOptions|undefined} [options] - optional options to use to configure the behaviour of this factory
   */
  constructor(settings, options) {
    // Configure the logger to use
    const logger = settings && settings.logger ? settings.logger : console;
    Object.defineProperty(this, 'logger', {value: logger, enumerable: false});

    // Default to NORMAL mode if returnMode is undefined
    let returnMode = options && options.returnMode ? options.returnMode : ReturnMode.NORMAL;
    if (!ReturnMode.isValid(returnMode)) {
      logger.warn(`Ignoring invalid opts.returnMode (${returnMode}) - defaulting TaskFactory's returnMode to NORMAL`);
      returnMode = ReturnMode.NORMAL;
    }
    Object.defineProperty(this, 'returnMode', {value: returnMode, enumerable: true});

    // Default to simplifying outcomes while flattening each `execute` result to a `donePromise` if donePromiseFlattenOpts is undefined
    const flattenOpts = (options && options.donePromiseFlattenOpts) || Promises.defaultFlattenOpts.simplifyOutcomes;
    Object.defineProperty(this, 'donePromiseFlattenOpts', {value: flattenOpts, enumerable: true});

    // Set the optional default describeItem function (if any provided)
    const describeItem = settings && typeof settings.describeItem === 'function' ? settings.describeItem : undefined;
    if (describeItem) Object.defineProperty(this, 'describeItem', {value: describeItem, enumerable: false});
  }

  /**
   * Creates a new task with all of its subtasks (if any) from the given task definition and all of its sub-task
   * definitions recursively (if any)
   * @param {TaskDef} taskDef - the definition of the task (and subtasks) to be created
   * @param {TaskOpts|undefined} [opts] - optional options to use to alter the behaviour of this Task
   * @returns {Task} a new task with all of its subtasks (if applicable)
   */
  createTask(taskDef, opts) {
    return new Task(taskDef, undefined, this, opts);
  }

  /**
   * Creates a new master task with all of its subtasks (if any) from the given task definition and all of its sub-task
   * definitions recursively (if any) and sets its slave tasks to the given slaveTasks and its number of attempts to the
   * minimum of its slave task's number of attempts.
   *
   * A master task is a the task that is actually executed in place of its slave tasks and its state changes and attempt
   * increments will be applied to its slave tasks as well.
   *
   * @param {TaskDef} taskDef - the definition of the master task (and subtasks) to be created
   * @param {Task[]} slaveTasks - the slave tasks to this master task
   * @param {TaskOpts|undefined} [opts] - optional options to use to alter the behaviour of this master Task
   * @returns {Task} a new task with all of its subtasks (if applicable)
   */
  createMasterTask(taskDef, slaveTasks, opts) {
    if (!slaveTasks || slaveTasks.length <= 0) {
      throw new Error(`Cannot create a master task (${taskDef.name}) without slave tasks`);
    }
    if (!slaveTasks.every(slaveTask => isInstanceOf(slaveTask, Task) && slaveTask.name === taskDef.name && slaveTask.definition === taskDef)) {
      throw new Error(`Cannot create a master task (${taskDef.name}) with mismatched slave tasks (${stringify(slaveTasks.map(t => t.name))})`);
    }
    // Create the master task
    const masterTask = new Task(taskDef, undefined, this, opts);
    // Set the master task's slave tasks to the given ones recursively and set its attempts to the least of its slave tasks attempts
    masterTask.setSlaveTasks(slaveTasks);

    return masterTask;
  }

  /**
   * Attempts to reconstruct a complete hierarchy of pseudo task and subTasks from the given root, executable task-like
   * object that is an approximation of the original hierarchy of root task and subTasks. The primary issue with the
   * generated pseudo root task and any generated "executable" pseudo sub-tasks is that they do NOT have any usable
   * `execute` functions.
   *
   * Note that if the given taskLike "mistakenly" happens to already be a Task, then it is simply returned instead.
   *
   * @param {TaskLike|Task} taskLike - a task-like object (or Task), which must be a root, executable task-like object
   * @param {TaskOpts|undefined} [opts] - optional options to use to alter the behaviour of the reconstructed Tasks
   * @returns {Task} an approximation of the original task (including any and all of its subTasks recursively)
   */
  reconstructTasksFromRootTaskLike(taskLike, opts) {
    // Nothing in, nothing out
    if (!taskLike) {
      return undefined;
    }
    // If the given taskLike is already a Task then nothing to be done and just return it
    if (isInstanceOf(taskLike, Task)) {
      return taskLike;
    }

    // Ensure that the given task-like object at least appears to be an actual task-like object
    if (!Task.isTaskLike(taskLike)) {
      throw new Error(`Cannot reconstruct all pseudo task and subTasks from a non-task-like object (${stringify(taskLike)})`);
    }

    if (TaskFactory.isTaskLikeManaged(taskLike)) {
      throw new Error(`Cannot reconstruct all pseudo task and subTasks from a non-root, non-executable, managed task-like object (${stringify(taskLike)})`);
    }

    // Reconstruct all of the pseudo task and subTask definitions for the root task-like object
    const taskDef = TaskFactory.reconstructTaskDefsFromRootTaskLike(taskLike);

    // Reconstruct all of the pseudo task and subTasks using the reconstructed root task definition
    // ... perhaps should not bother with opts ... since these pseudo tasks are effectively un-executable anyway
    const task = this.createTask(taskDef, opts);

    /**
     * Recursively copies the taskLike's state, number of attempts, total number of attempts and began time & took ms to
     * its corresponding task.
     * @param {TaskLike} taskLike - the task-like object from which to copy
     * @param {Task} task - the task to which to copy
     */
    function copyStateAttemptsAndExecutionTimes(taskLike, task) {
      task._state = isInstanceOf(taskLike.state, TaskState) ? taskLike.state :
        TaskState.toTaskStateFromStateLike(taskLike.state);
      task._attempts = taskLike.attempts;
      task._totalAttempts = taskLike.total || taskLike.totalAttempts || 0;
      task._began = taskLike.began;
      task._took = taskLike.took;
      task._ended = taskLike.ended ? taskLike.ended : Task.calculateEnded(task._began, task._took);

      // Recursively repeat this process for each of the taskLike's subTasks
      if (taskLike.subTasks && taskLike.subTasks.length > 0) {
        for (let i = 0; i < taskLike.subTasks.length; ++i) {
          const subTaskLike = taskLike.subTasks[i];
          const subTask = task.getSubTask(subTaskLike.name);
          copyStateAttemptsAndExecutionTimes(subTaskLike, subTask);
        }
      }
    }

    // Finally recursively copy the taskLike's state, attempts and last executed at date-time to its corresponding task
    copyStateAttemptsAndExecutionTimes(taskLike, task);
    return task;
  }

  /**
   * Attempts to reconstruct a complete hierarchy of pseudo task and sub-task definitions from the given root, executable
   * task-like object (or Task), which is an approximation of the original hierarchy of root task and sub-task definitions
   * from which the original task was created. The primary issue with the generated pseudo root task definition is that it
   * does NOT have a usable execute function.
   *
   * Note that if the given taskLike happens to already be a Task, then its definition is simply returned instead.
   *
   * @param {TaskLike|Task} taskLike - a task-like object (or Task), which must be a root, executable task-like object
   * @param {TaskOpts|undefined} [opts] - optional options to use to alter the behaviour of any & all newly reconstructed task definitions & sub-task definitions
   * @returns {TaskDef} an approximation of the original task definition (including any and all of its sub-task definitions
   * recursively)
   */
  static reconstructTaskDefsFromRootTaskLike(taskLike, opts) {
    // Nothing in, nothing out
    if (!taskLike) {
      return undefined;
    }
    // If the given taskLike is already a Task then nothing to be done and just return its definition
    if (isInstanceOf(taskLike, Task)) {
      return taskLike.definition;
    }
    // Ensure at least have a name on the task-like object
    if (!taskLike.name) {
      throw new Error(`Cannot reconstruct all pseudo task and sub-task definitions from a nameless task-like object (${stringify(taskLike)})`);
    }
    const name = taskLike.name;

    // Ensure that the reconstructed, top-level executable task has no parent
    if (TaskFactory.isTaskLikeManaged(taskLike)) {
      throw new Error(`Cannot reconstruct all pseudo task and sub-task definitions from a non-root, non-executable, managed task-like object (${stringify(taskLike)})`);
    }

    function generatePlaceholderFunction(name) {
      function doNotExecute() {
        throw new Error(`Logic error - attempting to execute a placeholder execute method on a reconstructed, pseudo task (${name})`);
      }

      // Mark the `doNotExecute` function as a placeholder!
      Object.defineProperty(doNotExecute, 'placeholder', {value: true}); // NOT enumerable/writable/configurable

      return doNotExecute;
    }

    // Make up a task definition for this root, executable task-like object
    const taskDef = TaskDef.defineTask(name, generatePlaceholderFunction(name));
    taskDef.unusable = true;

    function defineSubTasks(taskLike, taskDef) {
      const subTasks = taskLike && taskLike.subTasks;
      if (subTasks && subTasks.length > 0) {
        for (let i = 0; i < subTasks.length; ++i) {
          const subTaskLike = subTasks[i];
          if (!subTaskLike.name) {
            throw new Error(`Cannot reconstruct pseudo sub-task definitions from a nameless sub-task-like object (${stringify(subTaskLike)})`);
          }
          const subTaskExecute = !TaskFactory.isTaskLikeManaged(subTaskLike) ?
            generatePlaceholderFunction(subTaskLike.name) : undefined;
          const subTaskDef = taskDef.defineSubTask(subTaskLike.name, subTaskExecute);
          subTaskDef.unusable = true;
          defineSubTasks(subTaskLike, subTaskDef);
        }
      }
    }

    defineSubTasks(taskLike, taskDef);
    return taskDef;
  }

  static isTaskLikeManaged(taskLike) {
    return taskLike.hasOwnProperty('managed') ? !!taskLike.managed :
      taskLike.hasOwnProperty('executable') ? !taskLike.executable : false; // assume NOT managed, if NOT defined
  }

  /**
   * Creates a list of new active tasks from either the given list of active task definitions (if `opts.onlyRecreateExisting`
   * is false) or from the list of active task definitions that have prior versions (if `opts.onlyRecreateExisting` is
   * true) and then updates them with the relevant state information extracted from the given list of zero or more old
   * task-like objects, which are the prior versions of the tasks from the previous attempt (if any). Any and all old
   * tasks with definitions that do NOT appear in the given list of active task definitions are recreated and partially
   * restored as new unusable tasks, which do NOT have usable `execute` functions and which are EITHER old tasks that
   * must be ignored and/or abandoned (e.g. a developer redefined the active task definitions) OR "dynamic" tasks that
   * were created on the fly during a previous attempt and that will most likely need to be re-attempted again. Returns
   * a list containing the list of active tasks and the list of inactive unusable tasks.
   * @param {TaskDef[]} activeTaskDefs - a list of active task definitions from which to create the new tasks
   * @param {TaskLike[]|Task[]} priorVersions - a list of zero or more old task-like objects or tasks, which are the prior
   * versions of the active tasks from a previous attempt (if any)
   * @param {ReviveTasksOpts|undefined} [opts] - optional options to use to influence which tasks get created and how they get created during task revival/re-incarnation
   * @returns {[Task[], Task[]]} a list of active tasks and a list of inactive, unusable tasks
   */
  reincarnateTasks(activeTaskDefs, priorVersions, opts) {
    const onlyRecreateExisting = opts && opts.onlyRecreateExisting;

    // Reconstruct a complete hierarchy of a pseudo top-level task and its sub-tasks (if any), which is an approximation
    // of the original hierarchy of root task and its sub-tasks, for EACH of the given old task-like objects
    const oldTasks = priorVersions.map(taskLike => this.reconstructTasksFromRootTaskLike(taskLike, opts));

    // Update each of the newly created tasks with the relevant information from the prior version of each of these tasks
    const oldTasksByName = new Map(oldTasks.map(t => [t.name, t]));

    // Determine which of the active task definitions to use to create the new tasks
    const taskDefsToUse = onlyRecreateExisting ? activeTaskDefs.filter(t => oldTasksByName.has(t.name)) : activeTaskDefs;

    const activeTaskNames = activeTaskDefs.map(t => t.name);

    // Create a new list of tasks from the given active task definitions
    const newTasks = taskDefsToUse.map(taskDef => this.createTask(taskDef, opts));

    const activeTasks = newTasks.map(newTask => {
      // Update the new task with the old task's details (if any)
      const updatedTask = newTask.updateFromPriorVersion(oldTasksByName.get(newTask.name), opts);
      // Reset the updated task to clear out any previous incomplete (i.e. failed and timed out) states inherited from the old task
      updatedTask.reset();
      return updatedTask;
    });

    // Collect any and all old tasks, which no longer appear amongst the list of active new tasks, and recreate them as
    // unusable tasks that will have to be either replaced with usable versions during or ignored after processing
    const unusableOldTasks = oldTasks.filter(oldTask => activeTaskNames.indexOf(oldTask.name) === -1);

    const unusableTasks = unusableOldTasks.map(oldTask => {
      // Reconstruct a clean unusable version of the old task & update it with the relevant details from the old task
      const unusableTask = this.createTask(oldTask.definition, opts);
      unusableTask.updateFromPriorVersion(oldTask, opts);
      // console.warn(`Created an ${unusableTask.unusable ? 'unusable' : 'usable'} copy of prior ${oldTask.unusable ? 'unusable' : 'usable'} task (${oldTask.name}), since it is not a predefined active task`);

      // Reset the updated task to clear out any previous incomplete (i.e. failed and timed out) states inherited from the old task
      unusableTask.reset();

      return unusableTask;
    });

    // Return both the updated active tasks and the updated inactive, unusable tasks
    return [activeTasks, unusableTasks];
  }

  /**
   * Generates and returns an execute function for the given `task` and its given original `execute` function, which
   * wraps the original execute function and supplements and alters its execution behaviour as follows:
   * - If the task is already fully finalised or frozen, then logs and throws an appropriate error; otherwise:
   *   - First starts the task, which changes its state to Started & increments the number of attempts on the task
   *   - Next executes the task's actual, original execute function and then:
   *     - Updates the task with the execution outcome and a "done" promise, which will asynchronously:
   *       - EITHER change the task's state to Completed & its result to the value returned if the execute function
   *         completed successfully and if every one of the outcome's promises resolved successfully and if the task is
   *         still in a Started (or Unstarted) state;
   *       - OR change the task's state to Failed with the error encountered if the execute function threw an exception
   *         or if any one of the outcome's promises rejected and ONLY if the task is not already in a rejected or
   *         timed out or failed state.
   * @param {Task} task - the task to be executed
   * @param {Function} execute - the task's original execute function (provided by its task definition)
   * @returns {Function} a wrapper execute function, which will invoke the task's original execute function
   * @throws {Error} an error if the task or its execute function is invalid
   */
  generateExecute(task, execute) {
    const self = this;
    const returnMode = task.returnMode ? task.returnMode : self.returnMode;
    const returnPromise = returnMode === ReturnMode.PROMISE;
    const returnSuccessOrFailure = returnMode === ReturnMode.SUCCESS_OR_FAILURE;

    // Ensure we have an executable task
    if (!task || !task.executable) { // only does a surface check to avoid circular dependency on tasks module
      const errMsg = `Cannot generate an execute function for an undefined or non-executable task - task (${stringify(task)})`;
      self.logger.error(errMsg);
      throw new Error(errMsg);
    }
    // Ensure we have a valid execute function
    if (typeof execute !== "function") {
      const errMsg = `Cannot generate a wrapper execute function for an execute "function" that is NOT a function - task (${stringify(task)}), execute ${stringify(execute)}`;
      self.logger.error(errMsg);
      throw new Error(errMsg);
    }

    /**
     * Executes this task's original execute function (and returns its result or rethrows its error) if the task is not
     * already fully finalised and not already frozen and then updates the task with the execution outcome and a
     * generated "done" promise, which will asynchronously update the task's state if necessary when the outcome is
     * completely resolved. For further details see `generateExecute` description above.
     * @this {Task} the task that is being executed
     * @param {...*} args - any and all arguments, which were passed to this task's `execute` method (i.e. to this function) and that will be passed as is to the task's definition's original `execute` function
     * @returns {*|(Success|Failure)|Promise} the value returned by the original execute function (if returnMode is NORMAL);
     * otherwise the value returned wrapped in a Success or the error thrown wrapped in a Failure (if returnMode is SUCCESS_OR_FAILURE);
     * otherwise the value returned wrapped in a resolved Promise or the error thrown wrapped in a rejected Promise (if returnMode is PROMISE)
     * @throws {Error} an error if the execute function throws an error (only thrown if returnMode is NORMAL)
     * @throws {FinalisedError} an error if this task is already fully finalised and should not have been re-executed (only thrown if returnMode is NORMAL; otherwise returned as a Failure or rejected Promise)
     * @throws {FrozenError} an error if this task is already frozen and can no longer be updated (only thrown if returnMode is NORMAL; otherwise returned as a Failure or rejected Promise)
     */
    function executeAndUpdateTask(args) {
      const executeArguments = arguments;

      /**
       * Resolves a short, current description of the item/target/subject for logging purposes from the arguments
       * originally passed to the `execute` function.
       * @returns {string} a short, current description of the item or an empty string
       */
      function describeItem() {
        return describeTaskItem(task, self, executeArguments);
      }

      if (!task.isFullyFinalised()) {
        if (!task.isFrozen()) {
          // First "start" the task (but ONLY if it's in an unstarted state), which changes its state to started,
          // increments its number of attempts and updates its last executed at date-time, since the task is starting
          // to execute
          const startTime = new Date();
          task.start(startTime, false);

          // Execute the task's actual execute function and wrap its result or error in a Success or Failure
          const outcome = Try.try(() => execute.apply(task, arguments));

          if (outcome.isFailure()) {
            self.logger.error(`${describeItem()}${task.name} execution failed (1)`, outcome.error);
          }

          // Convert Success or Failure into a Promise
          const promise = outcome.toPromise();

          // Asynchronously update the task if necessary when every one of the outcome's promise(s) resolve
          self.updateTask(task, outcome, promise, startTime.getTime(), describeItem);

          if (returnPromise) {
            return promise;
          }

          // NB: Return the outcome's returned value or rethrow its thrown error (unless returnMode is SUCCESS_OR_FAILURE,
          // in which case return the Success or Failure outcome instead)
          return returnSuccessOrFailure ? outcome : outcome.get();

        } else {
          const errMsg = `${describeItem()}${task.name} is frozen in state (${task.state}) & cannot be executed`;
          self.logger.log('WARN', errMsg);
          const frozenError = new FrozenError(errMsg);
          if (returnPromise) return Promise.reject(frozenError);
          if (returnSuccessOrFailure) return new Failure(frozenError);
          throw frozenError;
        }
      } else {
        const errMsg = `${describeItem()}${task.name} is fully finalised in state (${task.state}) & cannot be executed`;
        self.logger.error(errMsg);
        const finalisedError = new FinalisedError(errMsg);
        if (returnPromise) return Promise.reject(finalisedError);
        if (returnSuccessOrFailure) return new Failure(finalisedError);
        throw finalisedError;
      }
    }

    return executeAndUpdateTask;
  }

  /**
   * Updates the given task with the given execution outcome and with a "done" promise, which will only resolve when
   * the synchronous or asynchronous outcome is resolved and the task's state is then updated if necessary based on the
   * outcome. An asynchronous outcome is considered to be any outcome with a value that is either a single promise or an
   * array of promises, which can be changed by overriding the `extractPotentialPromises` method, and it is only deemed
   * to be resolved ("done") when every one of these promises resolve.
   * Precondition: !task.isFrozen()
   * @param {Task} task - the task to be updated
   * @param {Success|Failure} outcome - the success or failure outcome of the given task's execution
   * @param {Promise} promise - the outcome converted to a promise
   * @param {number} startTimeInMs - the time in milliseconds (since epoch) at which the task was started
   * @param {function(): string} [describeItem] - a function to use to derive a short, current description of the item that was passed to the task's execute function for logging purposes
   */
  updateTask(task, outcome, promise, startTimeInMs, describeItem) {
    const self = this;
    // Create a "done" promise that will only resolve after the synchronous or asynchronous outcome is fully resolved and ...
    const executionDonePromise = Promises.flatten(promise, undefined, self.donePromiseFlattenOpts, self.logger);

    // ... after the task's state is updated (if necessary)
    const donePromise = executionDonePromise.then(
      result => {
        // Set the ended at time
        const endTime = new Date();
        task.endedAt(endTime, false, false);

        // Find the first Failure (if any) out of the promise's result(s)
        const firstFailure = Try.findFailure(result);

        if (firstFailure === undefined) {
          // No promises were rejected, so if this task is still in a started (or unstarted) state after its execute
          // function completed successfully and after every one of its outcome's promise(s) resolved successfully, then
          // complete the task
          self.completeTaskIfNecessary(task, result, describeItem);
        } else {
          // At least one of the promise(s) was rejected, so fail the task, but ONLY if its not already rejected or failed
          self.failTaskIfNecessary(task, firstFailure.error, describeItem);
        }

        if (self.logger.traceEnabled) {
          // Convert zero, single or multiple valued result into an appropriate array of results for logging purposes
          const results = Array.isArray(result) ? result : result ? [result] : [];
          self.logger.log('TRACE', `${describeItem()}${task.name} is done - state (${task.state}) - ${results.length > 0 ? Try.describeSuccessAndFailureCounts(results) : 'success'} took ${endTime.getTime() - startTimeInMs} ms`);
        }

        return result;
      },
      err => {
        // Set the ended at time
        const endTime = new Date();
        task.endedAt(endTime, false, false);

        if (err !== outcome.error) {
          self.logger.error(`${describeItem()}${task.name} execution failed (2)`, err);
        }

        self.failTaskIfNecessary(task, err, describeItem);

        if (self.logger.traceEnabled) {
          self.logger.log('TRACE', `${describeItem()}${task.name} is done - state (${task.state}) - failure took ${endTime.getTime() - startTimeInMs} ms - ${err}`);
        }
        throw err;
      }
    );

    Promises.ignoreUnhandledRejection(donePromise, self.logger);

    // Attach the execution outcome and done promise to the task, for subsequent use if needed
    task.executed(outcome, donePromise);
  }

  /**
   * Changes the given task's state to Completed and updates its result (if not already defined) with the given result,
   * but ONLY if the task is still in a Started (or, just in case, an Unstarted) state. Override this function to alter
   * the definition of necessary.
   * @param {Task} task - the task to complete
   * @param {*} result - the result of successful invocation of the task's original execute function
   * @param {function(): string} describeItem - a function to use to derive a short, current description of the item that was passed to the task's execute function for logging purposes
   */
  completeTaskIfNecessary(task, result, describeItem) {
    // If this task is still in an unstarted state after its execute function completed successfully, then help it along
    if (task.started || task.unstarted) { //} && (task.subTasks.length <= 0 || task.subTasks.every(t => t.isFullyFinalised()))) {
      if (task.unstarted) {
        this.logger.log('WARN', `${describeItem()}${task.name} should have been started already, but it's still in state (${task.state}) - ${JSON.stringify(task)}`)
      }
      // If the task is already frozen, then its too late to change its state
      if (!task.isFrozen()) {
        // Complete the task
        task.complete(result, {overrideTimedOut: false}, false);
      } else {
        this.logger.log('WARN', `${describeItem()}${task.name} is frozen in state (${task.state}) & cannot be updated to Completed`);
      }
    }
  }

  /**
   * Sets the given task's state to Failed with the error encountered, but ONLY if the task is not already in a rejected
   * or timed-out or failed state. Override this function to alter the definition of necessary.
   * @param {Task} task - the task to update
   * @param {Error} error - the error encountered during execution of the task's original execute function
   * @param {function(): string} describeItem - a function to use to derive a short, current description of the item that was passed to the task's execute function for logging purposes
   */
  failTaskIfNecessary(task, error, describeItem) {
    // If this task is not already rejected or failed, then fail it
    if (!task.rejected && !task.failed && !task.timedOut) {
      // If the task is already frozen, then its too late to change its state
      if (!task.isFrozen()) {
        const wasCompleted = task.completed;
        const beforeState = task.state;

        //Fail the task with the given error
        task.fail(error);

        if (wasCompleted) {
          this.logger.log('WARN', `Failed ${describeItem()}completed ${task.name} in state (${stringify(beforeState.name)}) due to subsequent error (new state (${task.state}))`, error);
        }
      } else {
        this.logger.log('WARN', `${describeItem()}${task.name} is frozen in state (${task.state}) & cannot be updated to Failed with error:`, error);
      }
    } else {
      if (error !== task.error) {
        this.logger.log('WARN', `Ignored attempt to fail ${describeItem()}${task.rejected ? 'rejected' : task.timedOut ? 'timed out' : 'previously failed'} ${task.name} in state (${task.state}) with error (${task.error}) - ignored new error`, error);
      }
    }
  }

}

// Export this TaskFactory "class"
module.exports = TaskFactory;

function describeTaskItem(task, taskFactory, executeArguments) {
  const taskDef = task.definition;
  const describe = taskDef && taskDef.describeItem ? taskDef.describeItem : taskFactory.describeItem;
  const itemDesc = describe ? Try.try(() => describe.apply(taskFactory, executeArguments)).recover(err => {
    taskFactory.logger.error(`Failed to derive an item description using ${describe.name} from ${executeArguments.length} arguments during execution of task (${task.name})`, err);
    return '';
  }).get() : '';
  return itemDesc ? itemDesc + ' ' : '';
}