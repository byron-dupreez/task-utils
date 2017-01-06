'use strict';

/**
 * A Task class with static utilities for creating executable tasks and both executable and non-executable sub-tasks
 * that can be used to track the state of tasks or operations.
 * @module task-utils/tasks
 * @author Byron du Preez
 */
module.exports = {
  FOR_TESTING_ONLY: {
    ensureAllTasksDistinct: ensureAllTasksDistinct,
    reconstructTaskDefsFromRootTaskLike: reconstructTaskDefsFromRootTaskLike
  }
};

const states = require('./task-states');
const TaskState = states.TaskState;

const taskDefs = require('./task-defs');
const TaskDef = taskDefs.TaskDef;

const Strings = require('core-functions/strings');
const isNotBlank = Strings.isNotBlank;
const stringify = Strings.stringify;

/*const Promises =*/
require('core-functions/promises');
//const isPromise = Promises.isPromise;

const Arrays = require('core-functions/arrays');
const isDistinct = Arrays.isDistinct;

//======================================================================================================================
// Task "class"
//======================================================================================================================

/**
 * A task or operation, which can be either an executable task, an executable sub-task or a non-executable, internal
 * sub-task based on the task definition from which it is constructed.
 *
 * An executable sub-task is a task that must be explicitly executed from within its parent task's execute function and
 * must partially or entirely manage its own state within its own execute function.
 *
 * A non-executable, internal sub-task is a task that must be manually executed and must have its state managed entirely
 * within its parent task's execute function and is ONLY used to enable tracking of its state.
 */
class Task {
  /**
   * Constructs a task, which can be either an executable task or a non-executable, internal sub-task based on the
   * given task definition and optional parent task. If parent is specified then this new task is assumed to be a
   * sub-task of the given parent task and the given taskDef must be a non-executable, internal sub-task definition
   *
   * @param {TaskDef} taskDef - the definition of this task
   * @param {Task|null|undefined} [parent] - an optional parent task
   * @throws {Error} an error if the requested task is invalid
   */
  constructor(taskDef, parent) {
    // Validate the given task definition
    // -----------------------------------------------------------------------------------------------------------------
    // Ensure the given task definition is valid
    if (!(taskDef instanceof TaskDef)) {
      throw new Error(`Cannot create a task without a valid task definition (${stringify(taskDef)})`);
    }

    const taskName = taskDef.name;

    // Validate the given parent
    // -----------------------------------------------------------------------------------------------------------------
    if (parent) {
      // Creating a non-executable, internal sub-task, so:
      // Ensure that the parent task is a valid task
      if (!(parent instanceof Task)) {
        throw new Error(`Cannot create a sub-task with an invalid super-task (${stringify(parent)})`);
      }
      // Ensure that execute (if defined) is actually executable (i.e. a valid function)
      if (taskDef.execute !== undefined && typeof taskDef.execute !== 'function') {
        throw new Error(`Cannot create an executable sub-task definition (${taskName}) with an invalid execute function`);
      }
      // Ensure the parent's sub-task names will still be distinct if we include this new sub-task's name
      if (!areSubTaskNamesDistinct(parent, taskName)) {
        throw new Error(`Cannot add a sub-task (${taskName}) with a duplicate name to super-task (${parent.name}) with existing sub-tasks ${Strings.stringify(parent.subTasks.map(t => t.name))}`);
      }
    } else {
      // Creating an executable, top-level task, so:
      // Ensure that a top-level task (without a parent) does have an execute function, since a non-executable, top-
      // level task would be useless
      if (!taskDef.isExecutable()) {
        throw new Error(`Cannot create a top-level task (${taskName}) from a definition that is NOT executable`);
      }
      // Ensure that task definition's execute function (if defined) is actually executable (i.e. a valid function)
      if (typeof taskDef.execute !== 'function') {
        throw new Error(`Cannot create a top-level task (${taskName}) from a definition with an invalid execute function`);
      }
    }

    // Finalise the new task's parent and execute function
    const taskParent = parent ? parent : undefined;
    const taskExecute = taskDef.execute;
    const executable = !!taskExecute;
    const self = this;

    // Finally create each property (other than subTasks & subTasksByName) as read-only (writable: false and
    // configurable: false are defaults)
    // -----------------------------------------------------------------------------------------------------------------
    Object.defineProperty(this, 'name', {value: taskName, enumerable: true});
    Object.defineProperty(this, 'definition', {value: taskDef, enumerable: false});
    Object.defineProperty(this, 'executable', {value: executable, enumerable: true});
    // Create a new task execute function from the task and its execute function using the configured factory function
    Object.defineProperty(this, 'execute', {
      value: executable ? Task.taskExecuteFactory(self, taskExecute) : undefined,
      enumerable: false
    });

    // Define a subTasks property for this task's subTasks (if any)
    // -----------------------------------------------------------------------------------------------------------------
    // NB Even though not ideal, we MUST define subTasks and subTasksByName properties before creating and adding any
    // subTasks, since the construction of a sub-task needs the parent's subTasks property to already exist
    const subTasks = [];
    Object.defineProperty(this, '_subTasks', {value: subTasks, enumerable: true});

    // Define a subTasksByName property, which will be a map of each of the task's subTasks keyed by their names for
    // convenient look up by name
    // -----------------------------------------------------------------------------------------------------------------
    const subTasksByName = new Map();
    Object.defineProperty(this, '_subTasksByName', {value: subTasksByName, enumerable: false});

    // Create each of this task's subTasks (if any), which will also result in them being added to subTasks and mapped
    // into subTasksByName
    // -----------------------------------------------------------------------------------------------------------------
    taskDef.subTaskDefs.forEach(subTaskDef => new Task(subTaskDef, this));

    // Final validation of task hierarchy
    // -----------------------------------------------------------------------------------------------------------------
    if (taskParent) {
      // Ensure that the proposed combined hierarchy to be formed from this new task and its parent will still be valid
      // and will ONLY contain distinct tasks
      // NB: Must check this after adding subTasks, but before setting parent!
      ensureAllTasksDistinct(taskParent, this);
    }

    // Link this new task to its parent (if any)
    // -----------------------------------------------------------------------------------------------------------------
    Object.defineProperty(this, 'parent', {value: taskParent, enumerable: false});
    if (taskParent) {
      // Ensure that the parent task contains this new task as a subTask
      taskParent._subTasks.push(this);
      taskParent._subTasksByName.set(taskName, this);
    }

    // Set the task's initial state, attempts and result
    this._state = TaskState.UNSTARTED;
    this._attempts = 0;
    this._lastExecutedAt = '';

    // The task's optional result must NOT be enumerable, since the result may end up being an object that references
    // this task, which would create a circular dependency
    Object.defineProperty(this, '_result', {value: undefined, writable: true, enumerable: false});

    // The task's optional error must NOT be enumerable, since an error is not JSON serializable
    Object.defineProperty(this, '_error', {value: undefined, writable: true, enumerable: false});

    Object.defineProperty(this, '_slaveTasks', {value: [], writable: true, enumerable: false});

    Object.defineProperty(this, '_frozen', {value: false, writable: true, enumerable: false});
  }

  /** The state of this task */
  get subTasks() {
    return this._subTasks;
  }

  /** The slave tasks of this master task or an empty list of not a master task */
  get slaveTasks() {
    return this._slaveTasks;
  }

  /** The state of this task */
  get state() {
    return this._state;
  }

  /** The number of attempts at this task */
  get attempts() {
    return this._attempts;
  }

  /** The ISO date-time at which this task was last executed (or undefined if never executed) */
  get lastExecutedAt() {
    return this._lastExecutedAt;
  }

  /** The result of this task (if executed successfully) */
  get result() {
    return this._result;
  }

  /** The actual error encountered during execution of this task (if failed, timed out or rejected); otherwise undefined */
  get error() {
    return this._error;
  }

  /**
   * Customized toJSON method, which is used by {@linkcode JSON.stringify} to output the internal _state, _attempts and
   * _lastExecuteAt properties without their underscores.
   */
  toJSON() {
    return {
      name: this.name,
      executable: this.executable,
      state: this._state,
      attempts: this._attempts,
      lastExecutedAt: this._lastExecutedAt,
      subTasks: this._subTasks
    };
  }

  /**
   * Returns true if this task is a super-task, i.e. if it has any sub-tasks; false otherwise.
   * @returns {boolean} true if super-task; false otherwise
   */
  isSuperTask() {
    return this._subTasks.length > 0;
  }

  /**
   * Returns true if this task is a root or top-level task, i.e. a task that is not a sub-task itself and that is at the
   * root/top of its task hierarchy; false otherwise
   * @returns {boolean} true if root task; false otherwise
   */
  isRootTask() {
    return !this.parent;
  }

  /**
   * Returns true if this task is a sub-task, i.e. if it it belongs to a super-task; false otherwise.
   * @returns {boolean} true if sub-task; false otherwise
   */
  isSubTask() {
    return !!this.parent;
  }

  /**
   * Returns the sub-task with the given name if it exists on this task; otherwise returns undefined.
   * @param {string} subTaskName - the name of the sub-task to retrieve
   * @returns {Task|undefined} the named sub-task if it exists; otherwise undefined
   */
  getSubTask(subTaskName) {
    return this._subTasksByName.get(subTaskName);
  }

  /**
   * Returns the existing sub-task with the given name if it exists on this task; otherwise creates and adds a new
   * sub-task with the given name and optional execute function to this task and returns it.
   * @param {string} subTaskName - the name of the sub-task to retrieve or add
   * @param {Function|undefined} [execute] - the optional function to be executed when the sub-task is executed
   * @returns {Task} the named sub-task if it exists; otherwise a new sub-task
   */
  getOrAddSubTask(subTaskName, execute) {
    const subTask = this._subTasksByName.get(subTaskName);
    if (subTask) {
      return subTask;
    }
    const subTaskDef = this.definition.defineSubTask(subTaskName, execute);
    return new Task(subTaskDef, this);
  }

  /**
   * Returns true if this is an executable task; false otherwise
   * @returns {boolean} true if executable; false otherwise
   */
  isExecutable() {
    return this.executable;
  }

  /**
   * Returns true if this is a non-executable (i.e. internal) task; false otherwise
   * @returns {boolean} true if non-executable; false otherwise
   */
  isNotExecutable() {
    return !this.executable;
  }

  /**
   * Returns true if this is an internal (i.e. non-executable) task; false otherwise
   * @alias {@linkcode isNotExecutable}
   * @returns {boolean} true if internal; false otherwise
   */
  isInternal() {
    return !this.executable;
  }

  /**
   * Returns true if this task is unstarted (i.e. in an unstarted state that is not completed, not rejected and has no
   * error); false otherwise
   * @returns {boolean} true if unstarted; false otherwise
   */
  get unstarted() {
    return this._state.unstarted;
  }

  /**
   * Returns true if this task is incomplete (i.e. in an incomplete state that is not completed and not rejected); false
   * otherwise
   * @returns {boolean} true if incomplete; false otherwise
   */
  get incomplete() {
    return this._state.incomplete;
  }

  /**
   * Returns true if this task is successfully completed (i.e. in any of the completed states); false otherwise
   * @returns {boolean} true if completed; false otherwise
   */
  get completed() {
    return this._state.completed;
  }

  /**
   * Returns true if this task is timed out (i.e. in any of the timeout states); false otherwise
   * @returns {boolean} true if timed out; false otherwise
   */
  get timedOut() {
    return this._state.timedOut;
  }

  /**
   * Returns true if this task is rejected (i.e. in any of the rejected states); false otherwise
   * @returns {boolean} true if rejected; false otherwise
   */
  get rejected() {
    return this._state.rejected;
  }

  /**
   * Returns true if this task has failed (i.e. in any of the failed states); false otherwise
   * @returns {boolean} true if failed; false otherwise
   */
  get failed() {
    return this._state.failed;
  }

  /**
   * Returns true if this task is finalised (i.e. in a final state, either completed or rejected); false otherwise
   * @returns {boolean} true if finalised; false otherwise
   */
  get finalised() {
    return this._state.finalised;
  }

  /**
   * Returns true if this task and all of its subTasks recursively are finalised (i.e. in a final state, either
   * completed or rejected); false otherwise
   * @returns {boolean} true if totally finalised; false otherwise
   */
  isFullyFinalised() {
    return this.finalised && this._subTasks.every(subTask => subTask.isFullyFinalised());
  }

  /**
   * Returns true if this task is in a Rejected state; false otherwise
   * @returns {boolean} true if in a Rejected state; false otherwise
   */
  isRejected() {
    return this._state.isRejected();
  }

  /**
   * Returns true if this task is in an Abandoned state; false otherwise
   * @returns {boolean} true if in an Abandoned state; false otherwise
   */
  isAbandoned() {
    return this._state.isAbandoned();
  }

  /**
   * Returns true if this task is in a Discarded state; false otherwise
   * @returns {boolean} true if in a Discarded state; false otherwise
   */
  isDiscarded() {
    return this._state.isDiscarded();
  }

  /**
   * Resets this task's state back to Unstarted and its result back to undefined (if it's in an incomplete state or if
   * it's a completed, root super-task with incomplete sub-tasks) and also recursively resets any and all of its
   * subTasks's states back to Unstarted and results back to undefined (if they are still incomplete).
   */
  reset() {
    if (this.incomplete || (this.completed && this.isRootTask() && this.isSuperTask() && !this.isFullyFinalised())) {
      this._state = TaskState.UNSTARTED;
      this._result = undefined;
      this._error = undefined;
    }
    this._subTasks.forEach(subTask => subTask.reset());

    // If this is a master task then ripple the state change to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.reset());
    }
  }

  /**
   * Updates this task's last executed at date-time to the given executed at date-time. If recursively is true, then
   * also applies the update to each of this task' sub-tasks recursively.
   * @param {Date|string} executedAt - the ISO date-time at which this task was executed
   * @param {boolean|undefined} [recursively] - whether to also apply the update to sub-tasks recursively or not
   */
  updateLastExecutedAt(executedAt, recursively) {
    const lastExecutedAt = executedAt instanceof Date ? executedAt.toISOString() : executedAt;
    if (this.incomplete) {
      this._lastExecutedAt = lastExecutedAt;
    }

    // If recursively, then also apply the update to each of this task's sub-tasks
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.updateLastExecutedAt(lastExecutedAt, recursively));
    }

    // If this is a master task then ripple the update to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.updateLastExecutedAt(lastExecutedAt, recursively));
    }
  }

  /**
   * Increments the number of attempts at this task, but ONLY if the task is in an incomplete (non-finalised) state!
   * If recursively is true, then also applies the increment to each of this task' sub-tasks recursively.
   * @param {boolean|undefined} [recursively] - whether to also apply the increment to sub-tasks recursively or not
   */
  incrementAttempts(recursively) {
    if (this.incomplete) {
      this._attempts = this._attempts + 1;
    }
    // If recursively, then also apply the increment to each of this task's sub-tasks
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.incrementAttempts(recursively));
    }

    // If this is a master task then ripple the increment attempts to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.incrementAttempts(recursively));
    }
  }

  /**
   * A convenience method that increments the number of attempts at this task (but ONLY if the task is in an incomplete
   * (non-finalised) state) and updates this task's last executed at date-time to the given executed at date-time.
   * If recursively is true, then also applies the increment and update to each of this task' sub-tasks recursively.
   * .
   * @param {Date|string} executedAt - the ISO date-time at which this task was executed
   * @param {boolean|undefined} [recursively] - whether to also apply the increment and update to sub-tasks recursively or not
   */
  start(executedAt, recursively) {
    this.incrementAttempts(recursively);
    this.updateLastExecutedAt(executedAt, recursively);
  }

  /**
   * Executes the given callback function on this task and then recursively on all of its sub-tasks.
   * @param {Function} callback - a callback function
   */
  forEach(callback) {
    callback(this);
    this._subTasks.forEach(t => t.forEach(callback));
  }

  /**
   * Completes this task with a Completed state and the given optional result, but ONLY if the task is still incomplete
   * and EITHER NOT timed out OR overrideTimedOut is true. If recursively is true, then also completes any and all of
   * its subTasks recursively.
   *
   * @param {*} [result] - the optional result to store on the task
   * @param {boolean|undefined} [overrideTimedOut] - whether this complete is allowed to override an existing timedOut state or not
   * @param {boolean|undefined} [recursively] - whether or not to recursively complete all of this task's sub-tasks as well
   */
  complete(result, overrideTimedOut, recursively) {
    if (this.incomplete && (overrideTimedOut || !this.timedOut)) {
      this._state = TaskState.COMPLETED;
      this._result = result;
      this._error = undefined;
    }
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.complete(result, overrideTimedOut, recursively));
    }
    // If this is a master task then ripple the state change and result to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.complete(result, overrideTimedOut, recursively));
    }
  }

  /**
   * Completes this task with a Succeeded state and the given optional result, but ONLY if the task is still incomplete
   * and EITHER NOT timed out OR overrideTimedOut is true. If recursively is true, then also succeeds any and all of its
   * subTasks recursively.
   *
   * @param {*} [result] - the optional result to store on the task
   * @param {boolean|undefined} [overrideTimedOut] - whether this complete is allowed to override an existing timedOut state or not
   * @param {boolean|undefined} [recursively] - whether or not to recursively succeed all of this task's sub-tasks as well
   */
  succeed(result, overrideTimedOut, recursively) {
    if (this.incomplete && (overrideTimedOut || !this.timedOut)) {
      this._state = TaskState.SUCCEEDED;
      this._result = result;
      this._error = undefined;
    }
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.succeed(result, overrideTimedOut, recursively));
    }
    // If this is a master task then ripple the state change and result to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.succeed(result, overrideTimedOut, recursively));
    }
  }

  /**
   * Completes this this task with a completed state with the given state name and the given optional result, but ONLY
   * if the task is still incomplete and EITHER NOT timed out OR overrideTimedOut is true. If recursively is true, then
   * also completes any and all of its subTasks recursively.
   *
   * @param {string} stateName - the name of the complete state
   * @param {*} [result] - the optional result to store on the task
   * @param {boolean|undefined} [overrideTimedOut] - whether this complete is allowed to override an existing timedOut state or not
   * @param {boolean|undefined} [recursively] - whether or not to recursively complete all of this task's sub-tasks as well
   */
  completeAs(stateName, result, overrideTimedOut, recursively) {
    if (this.incomplete && (overrideTimedOut || !this.timedOut)) {
      this._state = stateName === TaskState.COMPLETED_NAME ? TaskState.COMPLETED :
        stateName === TaskState.SUCCEEDED_NAME ? TaskState.SUCCEEDED : new states.CompletedState(stateName);
      this._result = result;
      this._error = undefined;
    }
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.completeAs(stateName, result, overrideTimedOut, recursively));
    }
    // If this is a master task then ripple the state change and result to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.completeAs(stateName, result, overrideTimedOut, recursively));
    }
  }

  /**
   * Times out this task with a TimedOut state with the given error, but ONLY if the task is NOT already timed out,
   * rejected or failed and EITHER NOT completed OR overrideCompleted is true. If recursively is true, then also times
   * out any and all of its subTasks recursively.
   *
   * @param {Error|undefined} [error] - the optional error that triggered this timed out state
   * @param {boolean|undefined} [overrideCompleted] - whether this timeout is allowed to override an existing completed state or not
   * @param {boolean|undefined} [recursively] - whether or not to recursively timeout all of this task's sub-tasks as well
   */
  timeout(error, overrideCompleted, recursively) {
    if ((overrideCompleted || !this.completed) && !this.timedOut && !this.rejected && !this.failed) {
      this._state = new states.TimedOut(error);
      this._result = undefined;
      this._error = error;
    }
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.timeout(error, overrideCompleted, recursively));
    }
    // If this is a master task then ripple the state change to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.timeout(error, overrideCompleted, recursively));
    }
  }

  /**
   * Times out this task with a timed out state with the given name and optional error, but ONLY if the task is NOT
   * already timed out, rejected or failed and EITHER NOT completed OR overrideCompleted is true. If recursively is true,
   * then also times out any and all of its subTasks recursively.
   *
   * @param {string} stateName - the name of the timed out state
   * @param {Error|undefined} [error] - the optional error that triggered this timed out state
   * @param {boolean|undefined} [overrideCompleted] - whether this timeout is allowed to override an existing completed state or not
   * @param {boolean|undefined} [recursively] - whether or not to recursively timeout all of this task's sub-tasks as well
   */
  timeoutAs(stateName, error, overrideCompleted, recursively) {
    if ((overrideCompleted || !this.completed) && !this.timedOut && !this.rejected && !this.failed) {
      this._state = stateName === TaskState.TIMED_OUT_NAME ? new states.TimedOut(error) :
        new states.TimedOutState(stateName, error);
      this._result = undefined;
      this._error = error;
    }
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.timeoutAs(stateName, error, overrideCompleted, recursively));
    }
    // If this is a master task then ripple the state change to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.timeoutAs(stateName, error, overrideCompleted, recursively));
    }
  }

  /**
   * Fails this task with a Failed state with the given error and also fails any and all of its subTasks recursively (if
   * recursively is true).
   *
   * Note that failures are allowed to override a completed state, but NOT a timed out, rejected or existing failed state.
   *
   * @param {Error} error - the error that triggered the failed state
   * @param {boolean|undefined} [recursively] - whether or not to recursively fail all of this task's sub-tasks as well
   */
  fail(error, recursively) {
    if (!error) {
      throw new Error(`Cannot change task (${this.name}) state to failed without an error`);
    }
    if (!this.timedOut && !this.rejected && !this.failed) {
      this._state = new states.Failed(error);
      this._result = undefined;
      this._error = error;
    }
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.fail(error, recursively));
    }
    // If this is a master task then ripple the state change to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.fail(error, recursively));
    }
  }

  /**
   * Fails this task with a failed state with the given state name and error and also fails any and all of its subTasks
   * recursively (if recursively is true).
   *
   * Note that failures are allowed to override a completed state, but NOT a timed out, rejected or existing failed state.
   *
   * @param {string} stateName - the name of the failed state
   * @param {Error} error - the error that triggered the failed state
   * @param {boolean|undefined} [recursively] - whether or not to recursively fail all of this task's sub-tasks as well
   */
  failAs(stateName, error, recursively) {
    if (!error) {
      throw new Error(`Cannot change task (${this.name}) state to failed without an error`);
    }
    if (!this.timedOut && !this.rejected && !this.failed) {
      this._state = stateName === TaskState.FAILED_NAME ? new states.Failed(error) :
        new states.FailedState(stateName, error);
      this._result = undefined;
      this._error = error;
    }
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.failAs(stateName, error, recursively));
    }
    // If this is a master task then ripple the state change to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.failAs(stateName, error, recursively));
    }
  }

  /**
   * Rejects this task with a Rejected state with the given reason and optional error (if it is not already finalised)
   * and also rejects any and all of its subTasks recursively that are not already finalised (if recursively is true).
   * @param {string} reason - the reason this task is being rejected
   * @param {Error|undefined} [error] - an optional error that triggered this
   * @param {boolean|undefined} [recursively] - whether or not to recursively reject all of this task's sub-tasks as well
   */
  reject(reason, error, recursively) {
    if (this.incomplete) {
      this._state = new states.Rejected(reason, error);
      this._result = undefined;
      this._error = error;
    }
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.reject(reason, error, recursively));
    }
    // If this is a master task then ripple the state change to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.reject(reason, error, recursively));
    }
  }

  /**
   * Rejects this task with a Discarded state with the given reason and optional error (if it is not already finalised)
   * and also discards any and all of its subTasks recursively that are not already finalised (if recursively is true).
   * @param {string} reason - the reason this task is being discarded
   * @param {Error|undefined} [error] - an optional error that triggered this
   * @param {boolean|undefined} [recursively] - whether or not to recursively discard all of this task's sub-tasks as well
   */
  discard(reason, error, recursively) {
    if (this.incomplete) {
      this._state = new states.Discarded(reason, error);
      this._result = undefined;
      this._error = error;
    }
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.discard(reason, error, recursively));
    }
    // If this is a master task then ripple the state change to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.discard(reason, error, recursively));
    }
  }

  /**
   * Rejects this task with an Abandoned state with the given reason and optional error (if it is not already finalised)
   * and also abandons any and all of its subTasks recursively that are not already finalised (if recursively is true).
   * @param {string} reason - the reason this task is being abandoned
   * @param {Error|undefined} [error] - an optional error that triggered this
   * @param {boolean|undefined} [recursively] - whether or not to recursively abandon all of this task's sub-tasks as well
   */
  abandon(reason, error, recursively) {
    if (this.incomplete) {
      this._state = new states.Abandoned(reason, error);
      this._result = undefined;
      this._error = error;
    }
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.abandon(reason, error, recursively));
    }
    // If this is a master task then ripple the state change to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.abandon(reason, error, recursively));
    }
  }

  /**
   * Rejects this task with a rejected state with the given state name, reason and optional error (if it is not already
   * finalised) and also rejects any and all of its subTasks recursively that are not already finalised (if recursively
   * is true).
   * @param {string} stateName - the name of the rejected state
   * @param {string} reason - the reason this task is being rejected
   * @param {Error|undefined} [error] - an optional error that triggered this
   * @param {boolean|undefined} [recursively] - whether or not to recursively reject all of this task's sub-tasks as well
   */
  rejectAs(stateName, reason, error, recursively) {
    if (this.incomplete) {
      this._state = stateName === TaskState.REJECTED_NAME ? new states.Rejected(reason, error) :
        stateName === TaskState.DISCARDED_NAME ? new states.Discarded(reason, error) :
          stateName === TaskState.ABANDONED_NAME ? new states.Abandoned(reason, error) :
            new states.RejectedState(stateName, reason, error);
      this._result = undefined;
      this._error = error;
    }
    if (recursively) {
      this._subTasks.forEach(subTask => subTask.rejectAs(stateName, reason, error, recursively));
    }
    // If this is a master task then ripple the state change to each of its slave tasks
    if (this.isMasterTask()) {
      this._slaveTasks.forEach(slaveTask => slaveTask.rejectAs(stateName, reason, error, recursively));
    }
  }

  /**
   * Updates this task's status, attempts and result with that of the given prior version of this task (if any).
   *
   * NB: Use {@linkcode reconstructAllTasksFromRoot} to convert prior versions that are task-like objects, but not
   * tasks, back into tasks before using this method.
   *
   * @param {Task|undefined} oldTask - a task, which must be the prior version of this task (or undefined)
   * @returns {Task} this task (updated with its prior version's state, attempts and result)
   */
  updateFromPriorVersion(oldTask) {
    if (!oldTask) {
      return this;
    }
    if (!(oldTask instanceof Task)) {
      throw new Error(`Cannot update task (${stringify(this)}) from a non-task, prior version (${stringify(oldTask)})`);
    }
    if (oldTask.name !== this.name) {
      throw new Error(`Cannot update task (${stringify(this)}) from mismatched prior version (${stringify(oldTask)})`);
    }

    if (oldTask._state) {
      // Set this task's state to the old task's state
      this._state = oldTask._state;

      // Set this task's result to the old task's result, but ONLY if the old state was completed; otherwise to undefined
      this._result = oldTask._state.completed ? oldTask._result : undefined;

      // Set this task's error to the old task's error, but ONLY if the old state was rejected; otherwise to undefined
      this._error = oldTask._state.rejected ? oldTask._error : undefined;
    }

    // Add the old task's number of attempts (if defined) to this task's number of attempts
    if (oldTask._attempts) {
      this._attempts += oldTask._attempts;
    }

    // Copy the old task's last executed at date-time (if defined) to this task
    if (oldTask._lastExecutedAt) {
      this._lastExecutedAt = oldTask._lastExecutedAt;
    }

    // Recursively update the corresponding subTask for each of the old task's subTasks
    if (oldTask._subTasks && oldTask._subTasks.length > 0) {
      const oldSubTasks = oldTask._subTasks;
      for (let i = 0; i < oldSubTasks.length; ++i) {
        const oldSubTask = oldSubTasks[i];
        const subTask = this.getSubTask(oldSubTask.name); //subTasks.find(t => t.name === oldSubTask.name);
        if (subTask) {
          // Found the corresponding subTask for the old subTask, so recursively update its details
          subTask.updateFromPriorVersion(oldSubTask);
        } else {
          // SubTasks have changed and no longer include this old subTask!
          const reason = `Abandoned prior sub-task (${oldSubTask.name}), since it is no longer an active sub-task of task (${this.name}) with subTasks ${stringify(this._subTasks.map(t => t.name))}`;
          console.warn(reason);
          // Create a copy of the missing sub task, update it and then mark it as abandoned
          const newSubTask = new Task(oldSubTask.definition, this);
          newSubTask.updateFromPriorVersion(oldSubTask);
          newSubTask.abandon(reason, undefined, true);
        }
      }
    }
    return this;
  }

  /**
   * Returns true if this task is a master task with slave tasks; false otherwise.
   * @returns {boolean} true if master task; false otherwise
   */
  isMasterTask() {
    return this._slaveTasks.length > 0;
  }

  /**
   * Sets this master task's and its corresponding sub-tasks' slave tasks to the given slave tasks and their sub-tasks
   * recursively and sets the master task's and its sub-tasks': attempts to the least of their respective slave tasks'
   * attempts; and last executed at date-times to the most recent of their respective slave tasks' last executed at
   * date-times.
   * @param {Task[]} slaveTasks - the slave tasks of this master task
   * @returns {Task} this task
   */
  setSlaveTasks(slaveTasks) {
    const slaves = slaveTasks ? slaveTasks : [];
    // Set this master task's slave tasks to the given ones
    this._slaveTasks = slaves;

    // Set this master task's number of attempts to the minimum of all of its slave task's numbers of attempts
    // Set this master task's last executed at date-time to the maximum of all of its slave task's last executed at date-times
    for (let i = 0; i < slaves.length; ++i) {
      const slaveTaskAttempts = slaves[i]._attempts;
      this._attempts = i == 0 ? slaveTaskAttempts : Math.min(this._attempts, slaveTaskAttempts);

      const slaveTaskLastExecutedAt = slaves[i]._lastExecutedAt;
      this._lastExecutedAt = i == 0 ? slaveTaskLastExecutedAt :
        slaveTaskLastExecutedAt > this._lastExecutedAt ? slaveTaskLastExecutedAt : this._lastExecutedAt;
    }

    // Recursively do the same for each of this master task's sub-tasks
    for (let j = 0; j < this._subTasks.length; ++j) {
      const masterSubTask = this._subTasks[j];
      const slaveSubTasks = slaves.map(t => t.getSubTask(masterSubTask.name)).filter(s => !!s);
      masterSubTask.setSlaveTasks(slaveSubTasks);
    }
    return this;
  }

  /**
   * Freezes this task and all of its sub-tasks to prevent any further changes.
   */
  freeze() {
    if (!this._frozen) {
      // Recursively freeze each of this task's sub-tasks
      this._subTasks.forEach(subTask => subTask.freeze());

      // If this is a master task then freeze each of its slave tasks
      if (this.isMasterTask()) {
        this._slaveTasks.forEach(slaveTask => slaveTask.freeze());
      }

      // Freeze this task
      this._frozen = true;
      Object.freeze(this);
    }
    return this;
  }

  /**
   * Returns true if this task has been frozen; false otherwise.
   * @returns {boolean} true if frozen; otherwise false
   */
  isFrozen() {
    return this._frozen;
  }

}

// Export the Task "class" / constructor function as well
module.exports.Task = Task;

//======================================================================================================================
// Static Task methods
//======================================================================================================================

/**
 * Creates a new task with all of its subtasks (if any) from the given task definition and all of its sub-task
 * definitions recursively (if any)
 * @param {TaskDef} taskDef - the definition of the task (and subtasks) to be created
 * @returns {Task} a new task with all of its subtasks (if applicable)
 */
function createTask(taskDef) {
  return new Task(taskDef, undefined);
}

// Add createTask function as a static method on Task (for convenience)
if (!Task.createTask) {
  Task.createTask = createTask;
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
 * @returns {Task} a new task with all of its subtasks (if applicable)
 */
function createMasterTask(taskDef, slaveTasks) {
  if (!slaveTasks || slaveTasks.length <= 0) {
    throw new Error(`Cannot create a master task (${taskDef.name}) without slave tasks`);
  }
  if (!slaveTasks.every(slaveTask => slaveTask instanceof Task && slaveTask.name === taskDef.name && slaveTask.definition === taskDef)) {
    throw new Error(`Cannot create a master task (${taskDef.name}) with mismatched slave tasks (${stringify(slaveTasks.map(t => t.name))})`);
  }
  // Create the master task
  const masterTask = new Task(taskDef, undefined);
  // Set the master task's slave tasks to the given ones recursively and set its attempts to the least of its slave tasks attempts
  masterTask.setSlaveTasks(slaveTasks);

  return masterTask;
}

// Add createTask function as a static method on Task (for convenience)
if (!Task.createMasterTask) {
  Task.createMasterTask = createMasterTask;
}

/**
 * Returns true if the given "task" object is either an instance of Task or is a Task-like object; false otherwise. An
 * object is deemed to be Task-like if it has a non-blank name property; a boolean executable property; and an array
 * subTasks property; and additionally, if taskName is specified, its name matches the given taskName.
 *
 * @param {*} task - the "task" object to check
 * @param {string|undefined} [taskName] - an optional task name to match against the "task" object's name - if omitted,
 * the "task" object's name can be any non-blank value
 * @returns {*|boolean}
 */
function isTaskLike(task, taskName) {
  return task instanceof Task || (task && typeof task === 'object' && isNotBlank(task.name) && (task.executable === true
    || task.executable === false) && Array.isArray(task.subTasks) && (!taskName || task.name === taskName));
}

// Add isTaskLike function as a static method on Task (for convenience)
if (!Task.isTaskLike) {
  Task.isTaskLike = isTaskLike;
}

/**
 * Collects all of the given task-like objects (or Tasks) and also all of their sub-tasks recursively.
 * @param {TaskLike[]|Task[]} taskLikes - the given list of task-like objects (or Tasks)
 * @returns {TaskLike[]|Task[]} the list of task-like objects (or Tasks) found and all of their sub-tasks recursively
 */
function getTasksAndSubTasks(taskLikes) {
  const allTasksAndSubTasks = [];

  // Collect all tasks and all of their subtasks recursively
  taskLikes.forEach(task => forEach(task, t => allTasksAndSubTasks.push(t)));

  return allTasksAndSubTasks;
}
// Add isTaskLike function as a static method on Task (for convenience)
if (!Task.getTasksAndSubTasks) {
  Task.getTasksAndSubTasks = getTasksAndSubTasks;
}

/**
 * Executes the given callback function on the given task-like object (or Task) and then recursively on all of its sub-tasks.
 * @param {TaskLike|Task} taskLike - a task-like object (or Task)
 * @param {Function} callback - a callback function
 */
function forEach(taskLike, callback) {
  callback(taskLike);
  taskLike.subTasks.forEach(t => forEach(t, callback));
}
// Add isTaskLike function as a static method on Task (for convenience)
if (!Task.forEach) {
  Task.forEach = forEach;
}


/**
 * Cautiously attempts to get the root task for the given task by traversing up its task hierarchy using the parent
 * links, until it finds the root (i.e. a parent task with no parent). During this traversal, if any task is recursively
 * found to be a parent of itself, an error will be thrown.
 *
 * @param {Task} task - any task in the task hierarchy from which to start
 * @throws {Error} if any task is recursively a parent of itself
 * @returns {Task} the root task
 */
function getRootTask(task) {
  if (!task || !(task instanceof Object)) {
    return undefined;
  }

  function loop(task, history) {
    const parent = task.parent;
    if (!parent) {
      return task;
    }
    if (history.indexOf(task) !== -1) {
      // We have an infinite loop, since a previously visited task is recursively a parent of itself!
      throw new Error(`Task hierarchy is not a valid Directed Acyclic Graph, since task (${task.name}) is recursively a parent of itself!`)
    }
    history.push(task);
    return loop(parent, history);
  }

  return loop(task, []);
}

// Add getRootTask function as a static method on Task (for convenience)
if (!Task.getRootTask) {
  Task.getRootTask = getRootTask;
}


/**
 * Attempts to reconstruct a complete hierarchy of pseudo task and subTasks from the given root, executable task-like
 * object that is an approximation of the original hierarchy of root task and subTasks. The primary issue with the
 * generated pseudo root task is that it does NOT have a usable execute function.
 *
 * Note that if the given taskLike happens to already be a Task, then it is simply returned instead.
 *
 * @param {TaskLike|Task} taskLike - a task-like object (or Task), which must be a root, executable task-like object
 * @returns {Task} an approximation of the original task (including any and all of its subTasks recursively)
 */
function reconstructTasksFromRootTaskLike(taskLike) {
  // Nothing in, nothing out
  if (!taskLike) {
    return undefined;
  }
  // If the given taskLike is already a Task then nothing to be done and just return it
  if (taskLike instanceof Task) {
    return taskLike;
  }

  // Ensure that the given task-like object appears to be an actual task-like object
  if (!isTaskLike(taskLike)) {
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
  const taskDef = reconstructTaskDefsFromRootTaskLike(taskLike);

  // Reconstruct all of the pseudo task and subTasks using the reconstructed root task definition
  const task = new Task(taskDef, undefined);

  /** Recursively copies the taskLike's state, number of attempts and last executed at to its corresponding task. */
  function copyStateAttemptsAndLastExecutedAt(taskLike, task) {
    task._state = taskLike.state instanceof TaskState ? taskLike.state :
      TaskState.toTaskStateFromStateLike(taskLike.state);
    task._attempts = taskLike.attempts;
    task._lastExecutedAt = taskLike.lastExecutedAt;
    //task._result = undefined; // a TaskLike has NO result (since it is explicitly NOT enumerable and also NOT included in the toJSON method)

    // Recursively repeat this process for each of the taskLike's subTasks
    if (taskLike.subTasks && taskLike.subTasks.length > 0) {
      for (let i = 0; i < taskLike.subTasks.length; ++i) {
        const subTaskLike = taskLike.subTasks[i];
        const subTask = task.getSubTask(subTaskLike.name);
        copyStateAttemptsAndLastExecutedAt(subTaskLike, subTask);
      }
    }
  }

  // Finally recursively copy the taskLike's state, attempts and result to its corresponding task
  copyStateAttemptsAndLastExecutedAt(taskLike, task);
  return task;
}

// Add reconstructTasksFromRootTaskLike function as a static method on Task (for convenience)
if (!Task.reconstructTasksFromRootTaskLike) {
  Task.reconstructTasksFromRootTaskLike = reconstructTasksFromRootTaskLike;
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
 * @returns {Array.<Task[]>} both the updated, newly created tasks and any abandoned tasks
 */
function createNewTasksUpdatedFromPriorVersions(activeTaskDefs, priorVersions) {
  const activeTaskNames = activeTaskDefs.map(t => t.name);

  // Create a new list of tasks from the given active task definitions
  const newTasks = activeTaskDefs.map(taskDef => Task.createTask(taskDef));

  // Reconstruct a complete hierarchy of a pseudo top-level task and its sub-tasks (if any), which is an approximation
  // of the original hierarchy of root task and its sub-tasks, for EACH of the given old task-like objects
  const oldTasks = priorVersions.map(taskLike => reconstructTasksFromRootTaskLike(taskLike));

  // Update each of the newly created tasks with the relevant information from the prior version of each of these tasks
  const oldTasksByName = new Map(oldTasks.map(t => [t.name, t]));

  const updatedNewTasks = newTasks.map(newTask => {
    // Update the new task with the old task's details (if any)
    const updatedTask = newTask.updateFromPriorVersion(oldTasksByName.get(newTask.name));
    // Reset the updated task to clear out any previous incomplete (i.e. failed and timed out) states inherited from the old task
    updatedTask.reset();
    return updatedTask;
  });

  // Collect any and all old tasks, which no longer appear amongst the list of active new tasks, and create new abandoned task from them
  const inactiveOldTasks = oldTasks.filter(oldTask => activeTaskNames.indexOf(oldTask.name) === -1);

  const abandonedTasks = inactiveOldTasks.map(oldTask => {
    // Reconstruct a clean version of the old task, update it with the relevant details from the old task and then mark it as abandoned
    const abandonedTask = Task.createTask(oldTask.definition);
    abandonedTask.updateFromPriorVersion(oldTask);
    const reason = `Abandoned prior task (${oldTask.name}), since it is no longer one of the active tasks ${stringify(activeTaskNames)}`;
    abandonedTask.abandon(reason, undefined, true);
    return abandonedTask;
  });

  // Return both the updated new tasks and the abandoned tasks
  return [updatedNewTasks, abandonedTasks];
}

// Add createNewTasksUpdatedFromPriorVersions function as a static method on Task (for convenience)
if (!Task.createNewTasksUpdatedFromPriorVersions) {
  Task.createNewTasksUpdatedFromPriorVersions = createNewTasksUpdatedFromPriorVersions;
}

//======================================================================================================================
// Internal functions
//======================================================================================================================

/**
 * Returns true if the proposed sub-task names together with the given parent task's sub-task names are all
 * still distinct; otherwise returns false.
 * @param parent
 * @param {string|string[]} proposedSubTaskNames - the name (or names) of the proposed sub-task(s) to be checked
 */
function areSubTaskNamesDistinct(parent, proposedSubTaskNames) {
  const oldNames = parent ? parent._subTasks.map(t => t.name) : [];
  const newNames = oldNames.concat(proposedSubTaskNames);
  return isDistinct(newNames);
}

// * @param {TaskDef|undefined} parent - an optional parent task definition, to which the reconstructed, pseudo task
// * definition should be added as a subTask definition.
/**
 * Attempts to reconstruct a complete hierarchy of pseudo task and sub-task definitions from the given root, executable
 * task-like object (or Task), which is an approximation of the original hierarchy of root task and sub-task definitions
 * from which the original task was created. The primary issue with the generated pseudo root task definition is that it
 * does NOT have a usable execute function.
 *
 * Note that if the given taskLike happens to already be a Task, then its definition is simply returned instead.
 *
 * @param {TaskLike|Task} taskLike - a task-like object (or Task), which must be a root, executable task-like object
 * @returns {TaskDef} an approximation of the original task definition (including any and all of its sub-task definitions
 * recursively)
 */
function reconstructTaskDefsFromRootTaskLike(taskLike) {
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
 * Ensures that the task hierarchies of both the given proposed task and of the given parent task (if any) are both
 * valid and could be safely combined into a single valid hierarchy; and, if not, throws an error.
 *
 * A valid hierarchy must only contain distinct tasks (i.e. every task can only appear once in its hierarchy). This
 * requirement ensures that a hierarchy is a Directed Acyclic Graph and avoids infinite loops.
 *
 * NB: The proposed task MUST NOT be linked to the given parent BEFORE calling this function (otherwise this function
 * will always throw an error) and MUST only be subsequently linked to the given parent if this function does NOT throw
 * an error.
 *
 * @param {Task|undefined} [parent] - an optional parent task (or sub-task) (if any), which identifies the first
 * hierarchy to check and to which the proposed task is intended to be linked
 * @param {Task|undefined} proposedTask - a optional proposed task, which identifies the second hierarchy to check
 * @throws {Error} if any task appears more than once in either hierarchy or in the proposed combination of both
 * hierarchies
 */
function ensureAllTasksDistinct(parent, proposedTask) {
  // First find the root of the parent's task hierarchy
  const parentRoot = parent ? getRootTask(parent) : undefined;
  // Next find the root of the proposed task's task hierarchy
  const proposedTaskRoot = proposedTask ? getRootTask(proposedTask) : undefined;

  function loop(task, history) {
    if (!task) {
      return;
    }
    // Ensure that this task does not appear more than once in the hierarchy
    if (history.indexOf(task) !== -1) {
      // We have a problem with this task hierarchy, since a previously visited task appears more than once in the hierarchy!
      throw new Error(`Task hierarchy is not a valid Directed Acyclic Graph, since task (${task.name}) appears more than once in the hierarchy!`)
    }
    // Remember that we have seen this one
    history.push(task);

    // Now check all of its subTasks recursively too
    const subTasks = task._subTasks;
    for (let i = 0; i < subTasks.length; ++i) {
      loop(subTasks[i], history);
    }
  }

  const history = [];

  // Next loop from the parent's root down through all of its subTasks recursively, ensuring that there is no duplication
  // of any task in the parent's hierarchy
  loop(parentRoot, history);

  // Finally loop from the proposed task's root down through all of its subTasks recursively, ensuring that there is no
  // duplication of any task in either hierarchy
  loop(proposedTaskRoot, history);
}

//======================================================================================================================
// Task execute factory function and default task execute factory functions
//======================================================================================================================

/**
 * A default task execute factory function that on invocation will return a task execute function that wraps the given
 * task's original execute function and supplements and alters its execution behaviour as follows:
 * - If the task is already fully finalised, then does nothing (other than logging a warning); otherwise:
 *   - First increments the number of attempts on the task (and recursively on all of its sub-tasks).
 *   - Next executes the task's actual, original execute function on the task and then based on the outcome:
 *     - If the execute function completes successfully, updates the task's result with the result obtained and also
 *       sets its state to Succeeded, but ONLY if the task is still in an Unstarted state.
 *     - If the execute function throws an exception or returns a rejected promise, sets its state to Failed with the
 *       error encountered, but ONLY if the task is not already in a rejected or failed state.
 *
 * @param {Task} task - the task to be executed
 * @param {Function} execute - the task's original execute function (provided by its task definition)
 * @returns {Function} a wrapper execute function, which will invoke the task's original execute function
 */
function defaultTaskExecuteFactory(task, execute) {
  function executeAndUpdateState() {
    if (!task.isFullyFinalised()) {
      // First increment the number of attempts and update the last executed at date-time on this task, since its starting to execute
      task.start(new Date(), false);

      // Then execute the actual execute function
      try {
        // Execute the task's function
        const result = execute.apply(task, arguments);

        // If this task is still in an unstarted state after its execute function completes then complete it

        // If the result is a promise or array of promises, reduce it to a single promise
        const promise = Promise.isArrayOfPromises(result) ? Promise.all(result) :
          Promise.isPromise(result) ? result : undefined;

        if (promise) {
          return promise
            .then(
              result => {
                Task.completeTaskIfStillUnstarted(task, result, console);
                return result;
              },
              err => {
                Task.failTaskIfNotRejectedNorFailed(task, err, console);
                return Promise.reject(err);
              }
            );
        } else {
          // Simple non-promise result
          Task.completeTaskIfStillUnstarted(task, result, console);
          return result;
        }
      } catch (err) {
        Task.failTaskIfNotRejectedNorFailed(task, err, console);
        throw err;
      }
    } else {
      console.warn(`Attempted to execute a fully finalised task (${task.name}) - ${stringify(task)}`);
      return task.completed ? task.result : undefined;
    }
  }

  return executeAndUpdateState;
}
if (!Task.defaultTaskExecuteFactory) {
  Task.defaultTaskExecuteFactory = defaultTaskExecuteFactory;
}


/**
 * Set the task execute factory, if undefined, to the default task execute factory.
 */
if (!Task.taskExecuteFactory) {
  Task.taskExecuteFactory = defaultTaskExecuteFactory;
}

/**
 * Updates the given task's result (if not already defined) with the given result and also sets its state to Succeeded,
 * but ONLY if the task is still in an Unstarted state AND if it either has no subtasks or if all of its subtasks are
 * fully finalised.
 * @param {Task} task - the task to update
 * @param {*} result - the result of successful invocation of the task's original execute function
 * @param {console|{warn:Function,error:Function}} logger - the logger to use for logging errors and warnings
 */
function completeTaskIfStillUnstarted(task, result, logger) {
  // If this task is still in an unstarted state after its execute function completed successfully, then help it along
  if (task.unstarted) { //} && (task.subTasks.length <= 0 || task.subTasks.every(t => t.isFullyFinalised()))) {
    // If the task is already frozen, then its too late to change its state
    if (task.isFrozen()) {
      logger.warn(`Task (${task.name}) is frozen in state (${stringify(task.state)}) and cannot be updated to Succeeded`);
      return;
    }
    try {
      // Attempt to complete the task
      task.complete(result, false);

    } catch (err) {
      if (err instanceof TypeError && err.message.indexOf(`Cannot assign to read only property '_state'`) !== -1) {
        // The task has been frozen and can no longer be updated
        logger.warn(`Task (${task.name}) is frozen in state (${stringify(task.state)}) and cannot be updated to Succeeded`);
      } else {
        logger.error(`Failed to change task (${task.name}) state from (${stringify(task.state)}) to Succeeded due to unexpected error (${err})`, err.stack);
      }
    }
  }
}
if (!Task.completeTaskIfStillUnstarted) {
  Task.completeTaskIfStillUnstarted = completeTaskIfStillUnstarted;
}

/**
 * Sets the given task's state to Failed with the error encountered, but ONLY if the task is not in a rejected state and
 * not already in a failed state.
 * @param {Task} task - the task to update
 * @param {Error} error - the error encountered during execution of the task's original execute function
 * @param {console|{warn:Function,error:Function}} logger - the logger to use for logging errors and warnings
 */
function failTaskIfNotRejectedNorFailed(task, error, logger) {
  // If this task is not already rejected or failed, then fail it
  if (!task.rejected && !task.failed) {
    // If the task is already frozen, then its too late to change its state
    if (task.isFrozen()) {
      logger.warn(`Task (${task.name}) is frozen in state (${stringify(task.state)}) and cannot be updated to Failed with error (${stringify(error)})`, error.stack);
      return;
    }
    try {
      const wasCompleted = task.completed;
      const beforeState = task.state;

      // Attempt to fail the task with the given error
      task.fail(error);

      if (wasCompleted) {
        logger.warn(`Failed completed task (${task.name}) in state (${stringify(beforeState)}) due to subsequent error (${stringify(error)})`, error.stack);
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.indexOf(`Cannot assign to read only property '_state'`) !== -1) {
        // The task has been frozen and can no longer be updated
        logger.warn(`Task (${task.name}) is frozen in state (${stringify(task.state)}) and cannot be updated to Failed with error (${stringify(error)})`, error.stack);
      } else {
        logger.error(`Failed to change task (${task.name}) state from (${stringify(task.state)}) to Failed with error (${stringify(error)}) due to unexpected error (${stringify(err)})`, err.stack, error.stack);
      }
    }
  } else {
    logger.warn(`Ignoring attempt to fail ${task.rejected ? 'rejected' : 'previously failed'} task (${task.name}) in state (${stringify(task.state)}) - ignoring new error (${stringify(error)})`, error.stack);
  }
}
if (!Task.failTaskIfNotRejectedNorFailed) {
  Task.failTaskIfNotRejectedNorFailed = failTaskIfNotRejectedNorFailed;
}
