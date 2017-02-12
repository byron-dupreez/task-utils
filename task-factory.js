'use strict';

/**
 * A Task factory class for creating executable tasks and both executable and non-executable sub-tasks that can be used
 * to track the state of tasks or operations. A task factory also generates wrapper `execute` functions for executable
 * tasks and sub-tasks.
 * @module task-utils/task-factory
 * @author Byron du Preez
 */

const strings = require('core-functions/strings');
const stringify = strings.stringify;

const errors = require('./errors');
const FrozenError = errors.FrozenError;
const FinalisedError = errors.FinalisedError;

const tries = require('core-functions/tries');
const Try = tries.Try;
// const Success = tries.Success;
const Failure = tries.Failure;
const Promises = require('core-functions/promises');

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
   * @param {BasicLogger|console|undefined} [logger] - an optional logger or logger-like object to use for logging (defaults to console if undefined)
   * @param {TaskFactoryOptions|undefined} [opts] - optional options to use to configure the behaviour of this factory
   */
  constructor(logger, opts) {
    Object.defineProperty(this, 'logger', {value: logger ? logger : console, enumerable: false});
    const returnSuccessOrFailure = opts && opts.returnSuccessOrFailure ? !!opts.returnSuccessOrFailure : false;
    Object.defineProperty(this, 'returnSuccessOrFailure', {value: returnSuccessOrFailure, enumerable: true});
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
    if (!slaveTasks.every(slaveTask => slaveTask instanceof Task && slaveTask.name === taskDef.name && slaveTask.definition === taskDef)) {
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
    if (taskLike instanceof Task) {
      return taskLike;
    }

    // Ensure that the given task-like object at least appears to be an actual task-like object
    if (!Task.isTaskLike(taskLike)) {
      throw new Error(`Cannot reconstruct all pseudo task and subTasks from a non-task-like object (${stringify(taskLike)})`);
    }
    // // Ensure at least have a name on the task-like object
    // if (!taskLike.name) {
    //   throw new Error(`Cannot reconstruct all pseudo task and subTasks from a nameless task-like object (${stringify(taskLike)})`);
    // }

    //const name = taskLike.name;
    const executable = !!taskLike.executable;

    if (!executable) {
      throw new Error(`Cannot reconstruct all pseudo task and subTasks from a non-root, non-executable task-like object (${stringify(taskLike)})`);
    }

    // Reconstruct all of the pseudo task and subTask definitions for the root task-like object
    const taskDef = TaskFactory.reconstructTaskDefsFromRootTaskLike(taskLike);

    // Reconstruct all of the pseudo task and subTasks using the reconstructed root task definition
    // ... perhaps should not bother with opts ... since these pseudo tasks are effectively un-executable anyway
    const task = this.createTask(taskDef, opts);

    /**
     * Recursively copies the taskLike's state, number of attempts, total number of attempts and last executed at date-
     * time to its corresponding task.
     * @param {TaskLike} taskLike - the task-like object from which to copy
     * @param {Task} task - the task to which to copy
     */
    function copyStateAttemptsAndLastExecutedAt(taskLike, task) {
      task._state = taskLike.state instanceof TaskState ? taskLike.state :
        TaskState.toTaskStateFromStateLike(taskLike.state);
      task._attempts = taskLike.attempts;
      task._totalAttempts = taskLike.totalAttempts;
      task._lastExecutedAt = taskLike.lastExecutedAt;

      // Recursively repeat this process for each of the taskLike's subTasks
      if (taskLike.subTasks && taskLike.subTasks.length > 0) {
        for (let i = 0; i < taskLike.subTasks.length; ++i) {
          const subTaskLike = taskLike.subTasks[i];
          const subTask = task.getSubTask(subTaskLike.name);
          copyStateAttemptsAndLastExecutedAt(subTaskLike, subTask);
        }
      }
    }

    // Finally recursively copy the taskLike's state, attempts and last executed at date-time to its corresponding task
    copyStateAttemptsAndLastExecutedAt(taskLike, task);
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
    if (taskLike instanceof Task) {
      return taskLike.definition;
    }
    // Ensure at least have a name on the task-like object
    if (!taskLike.name) {
      throw new Error(`Cannot reconstruct all pseudo task and sub-task definitions from a nameless task-like object (${stringify(taskLike)})`);
    }
    const name = taskLike.name;
    const executable = !!taskLike.executable;

    // Ensure that the reconstructed, top-level executable task has no parent
    if (!executable) {
      throw new Error(`Cannot reconstruct all pseudo task and sub-task definitions from a non-root, non-executable task-like object (${stringify(taskLike)})`);
    }

    function doNotExecute() {
      throw new Error(`Logic error - attempting to execute a placeholder execute method on a reconstructed, pseudo task (${name})`);
    }

    // Make up a task definition for this root, executable task-like object
    const taskDef = TaskDef.defineTask(name, doNotExecute);

    function defineSubTasks(taskLike, taskDef) {
      const subTasks = taskLike && taskLike.subTasks;
      if (subTasks && subTasks.length > 0) {
        for (let i = 0; i < subTasks.length; ++i) {
          const subTaskLike = subTasks[i];
          if (!subTaskLike.name) {
            throw new Error(`Cannot reconstruct pseudo sub-task definitions from a nameless sub-task-like object (${stringify(subTaskLike)})`);
          }
          const subTaskExecute = subTaskLike.executable ? doNotExecute : undefined;
          const subTaskDef = taskDef.defineSubTask(subTaskLike.name, subTaskExecute);
          defineSubTasks(subTaskLike, subTaskDef);
        }
      }
    }

    defineSubTasks(taskLike, taskDef);
    return taskDef;
  }

  /**
   * Creates a list of new tasks from the given list of active task definitions and then updates them with the relevant
   * information extracted from the given list of zero or more old task-like objects, which are the prior versions of the
   * tasks from the previous attempt (if any). Any and all old tasks that do NOT appear in the list of new active tasks
   * are recreated as abandoned tasks. Returns both the newly created and updated, active tasks and any no longer active,
   * abandoned tasks.
   *
   * @param {TaskDef[]} activeTaskDefs - a list of active task definitions from which to create the new tasks
   * @param {TaskLike[]|Task[]} priorVersions - a list of zero or more old task-like objects or tasks, which are the prior
   * versions of the active tasks from a previous attempt (if any)
   * @param {TaskOpts|undefined} [opts] - optional options to use to alter the behaviour of the newly created & updated Tasks
   * @returns {Array.<Task[]>} both the updated, newly created tasks and any abandoned tasks
   */
  createNewTasksUpdatedFromPriorVersions(activeTaskDefs, priorVersions, opts) {
    const activeTaskNames = activeTaskDefs.map(t => t.name);

    // Create a new list of tasks from the given active task definitions
    const newTasks = activeTaskDefs.map(taskDef => this.createTask(taskDef, opts));

    // Reconstruct a complete hierarchy of a pseudo top-level task and its sub-tasks (if any), which is an approximation
    // of the original hierarchy of root task and its sub-tasks, for EACH of the given old task-like objects
    const oldTasks = priorVersions.map(taskLike => this.reconstructTasksFromRootTaskLike(taskLike, opts));

    // Update each of the newly created tasks with the relevant information from the prior version of each of these tasks
    const oldTasksByName = new Map(oldTasks.map(t => [t.name, t]));

    const updatedNewTasks = newTasks.map(newTask => {
      // Update the new task with the old task's details (if any)
      const updatedTask = newTask.updateFromPriorVersion(oldTasksByName.get(newTask.name), opts);
      // Reset the updated task to clear out any previous incomplete (i.e. failed and timed out) states inherited from the old task
      updatedTask.reset();
      return updatedTask;
    });

    // Collect any and all old tasks, which no longer appear amongst the list of active new tasks, and create new abandoned task from them
    const inactiveOldTasks = oldTasks.filter(oldTask => activeTaskNames.indexOf(oldTask.name) === -1);

    const abandonedTasks = inactiveOldTasks.map(oldTask => {
      // Reconstruct a clean version of the old task, update it with the relevant details from the old task and then mark it as abandoned
      // ... perhaps should not bother with opts ... since these new tasks are being abandoned anyway
      const abandonedTask = this.createTask(oldTask.definition, opts);
      abandonedTask.updateFromPriorVersion(oldTask, opts);
      const reason = `Abandoned prior task (${oldTask.name}), since it is no longer one of the active tasks ${stringify(activeTaskNames)}`;
      abandonedTask.abandon(reason, undefined, true);
      return abandonedTask;
    });

    // Return both the updated new tasks and the abandoned tasks
    return [updatedNewTasks, abandonedTasks];
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
    const returnSuccessOrFailure = task.returnSuccessOrFailure !== undefined ?
      task.returnSuccessOrFailure : self.returnSuccessOrFailure;

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
     * @returns {*|Success|Failure} the value returned by the original execute function (if returnSuccessOrFailure is false); otherwise the value returned wrapped in a Success or the error thrown wrapped in a Failure
     * @throws {Error} an error if the execute function throws an error (only thrown if returnSuccessOrFailure is false; otherwise returned as a Failure)
     * @throws {FinalisedError} an error if this task is already fully finalised and should not have been re-executed (only thrown if returnSuccessOrFailure is false; otherwise returned as a Failure)
     * @throws {FrozenError} an error if this task is already frozen and can no longer be updated (only thrown if returnSuccessOrFailure is false; otherwise returned as a Failure)
     */
    function executeAndUpdateTask(args) {
      if (!task.isFullyFinalised()) {
        if (!task.isFrozen()) {
          // First "start" the task (but ONLY if it's in an unstarted state), which changes its state to started,
          // increments its number of attempts and updates its last executed at date-time, since the task is starting
          // to execute
          task.start(new Date(), false);

          // Execute the task's actual execute function
          const startTime = Date.now();
          const outcome = Try.try(() => execute.apply(task, arguments));
          self.logger.log('INFO', `Task (${task.name}) ${outcome.isFailure() ? 'failure' : 'success'} took ${Date.now() - startTime} ms`);

          if (outcome.isFailure()) {
            self.logger.error(`Execution of task (${task.name}) failed - ${stringify(task)}`, outcome.error.stack);
          }
          // Asynchronously update the task if necessary when every one of the outcome's promise(s) resolve
          self.updateTask(task, outcome);

          // NB: Return the outcome's returned value or rethrow its thrown error (unless returnSuccessOrFailure is true,
          // in which case return the outcome instead)
          return returnSuccessOrFailure ? outcome : outcome.get();

        } else {
          const errMsg = `Cannot execute a task (${task.name}) that is frozen in state (${task.state}) - ${stringify(task)}`;
          self.logger.error(errMsg);
          const frozenError = new FrozenError(errMsg);
          if (returnSuccessOrFailure) return new Failure(frozenError);
          throw frozenError;
        }
      } else {
        const errMsg = `Cannot execute a fully finalised task (${task.name}) in state (${task.state}) - ${stringify(task)}`;
        self.logger.error(errMsg);
        const finalisedError = new FinalisedError(errMsg);
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
   */
  updateTask(task, outcome) {
    // Create a "done" promise that will only resolve after the synchronous or asynchronous outcome is resolved and ...
    const executionDonePromise = Promises.every(this.extractPotentialPromises(outcome));
    // ... after the task's state is updated (if necessary)
    const donePromise = executionDonePromise.then(
      promiseOutcomes => {
        // Find the first Failure (if any) out of the execution outcome and the promise's outcomes
        const firstFailure = outcome.isFailure() ? outcome : promiseOutcomes.find(o => o.isFailure());
        if (firstFailure === undefined) {
          // No promises were rejected, so if this task is still in a started (or unstarted) state after its execute
          // function completed successfully and after every one of its outcome's promise(s) resolved successfully, then
          // complete the task
          this.completeTaskIfNecessary(task, outcome.value);
        } else {
          // At least one of the promise(s) was rejected, so fail the task, but ONLY if its not already rejected or failed
          this.failTaskIfNecessary(task, firstFailure.error);
        }
        return promiseOutcomes;
      },
      err => {
        this.logger.error(`Waiting for every promise to resolve should NOT have failed for task (${task.name}) - ${stringify(task)}`, err.stack);
        this.failTaskIfNecessary(task, err);
        throw err;
      }
    );

    // Attach the execution outcome and done promise to the task, for subsequent use if needed
    task.executed(outcome, donePromise);
  }

  //noinspection JSMethodCanBeStatic
  /**
   * Extracts a list of potential promises from the given outcome by returning the outcome's array value or by putting
   * its non-array value into a new array (if the outcome is a Success); otherwise by putting a rejected promise with
   * the outcome's error into a new array (if the outcome is a Failure). This function assumes that an asynchronous
   * outcome is any outcome with a value that is either a single promise or an array of promises.
   *
   * Override this function if you need a different definition of an asynchronous outcome.
   *
   * @param {Success|Failure} outcome - the outcome from which to extract a list of potential promises
   * @returns {[*]} a list of potential promises
   */
  extractPotentialPromises(outcome) {
    return outcome.isSuccess() ? Array.isArray(outcome.value) ? outcome.value : [outcome.value] :
      [Promise.reject(outcome.error)];
  }

  /**
   * Changes the given task's state to Completed and updates its result (if not already defined) with the given result,
   * but ONLY if the task is still in a Started (or, just in case, an Unstarted) state. Override this function to alter
   * the definition of necessary.
   * @param {Task} task - the task to complete
   * @param {*} result - the result of successful invocation of the task's original execute function
   */
  completeTaskIfNecessary(task, result) {
    // If this task is still in an unstarted state after its execute function completed successfully, then help it along
    if (task.started || task.unstarted) { //} && (task.subTasks.length <= 0 || task.subTasks.every(t => t.isFullyFinalised()))) {
      if (task.unstarted) {
        this.logger.log('WARN', `Task (${task.name}) should have been started already, but it's still in state (${task.state}) - ${stringify(task)}`)
      }
      // If the task is already frozen, then its too late to change its state
      if (!task.isFrozen()) {
        // Complete the task
        task.complete(result, false);
      } else {
        this.logger.log('WARN', `Task (${task.name}) is frozen in state (${task.state}) and cannot be updated to Completed`);
      }
    }
  }

  /**
   * Sets the given task's state to Failed with the error encountered, but ONLY if the task is not already in a rejected
   * or timed-out or failed state. Override this function to alter the definition of necessary.
   * @param {Task} task - the task to update
   * @param {Error} error - the error encountered during execution of the task's original execute function
   */
  failTaskIfNecessary(task, error) {
    // If this task is not already rejected or failed, then fail it
    if (!task.rejected && !task.failed && !task.timedOut) {
      // If the task is already frozen, then its too late to change its state
      if (!task.isFrozen()) {
        const wasCompleted = task.completed;
        const beforeState = task.state;

        //Fail the task with the given error
        task.fail(error);

        if (wasCompleted) {
          this.logger.log('WARN', `Failed completed task (${task.name}) in state (${stringify(beforeState.name)}) due to subsequent error (${stringify(error)})`, error.stack);
        }
      } else {
        this.logger.log('WARN', `Task (${task.name}) is frozen in state (${task.state}) and cannot be updated to Failed with error (${stringify(error)})`, error.stack);
      }
    } else {
      if (task.rejected || task.timedOut || error !== task.error) {
        this.logger.log('WARN', `Ignoring attempt to fail ${task.rejected ? 'rejected' : task.timedOut ? 'timed out' : 'previously failed'} task (${task.name}) in state (${task.state}) with error (${task.error}) - ignoring new error`, error.stack);
      }
    }
  }

}

// Export this TaskFactory "class"
module.exports = TaskFactory;

