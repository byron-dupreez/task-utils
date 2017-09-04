'use strict';

/**
 * A TaskState class and its subclasses with static utilities for defining the state of a task or operation.
 * @module task-utils/task-states
 * @author Byron du Preez
 */
exports._ = '_'; //IDE workaround

const core = require('./core');
const StateType = core.StateType;
exports.StateType = core.StateType; // Enum for the types of states supported - re-exported for convenience

/**
 * The names of the task states that have fixed names.
 * @namespace {TaskStateNames} names
 */
const names = {
  // Standard names
  Unstarted: 'Unstarted',
  Started: 'Started',
  Completed: 'Completed',
  Succeeded: 'Succeeded',
  TimedOut: 'TimedOut',
  Failed: 'Failed',
  Rejected: 'Rejected',
  Discarded: 'Discarded',
  Abandoned: 'Abandoned',

  // Arbitrary names for use with FailedState and/or RejectedState
  Skipped: 'Skipped',
  LogicFlawed: 'LogicFlawed',
  FATAL: 'FATAL',
};
exports.names = names;

/**
 * TaskState - The base class for a state of a task or operation.
 * @extends {Object}
 * @property {string} name - the name of this state
 * @property {StateType} kind - the type of this state
 * @property {string|undefined} [error] - an optional error with which a task was failed, timed out or rejected
 * @property {string|undefined} [reason] - an optional reason given for rejecting a task
 */
class TaskState {
  /**
   * Constructs a TaskState.
   * @param {string} name - the name of this state
   * @param {StateType} kind - the type/kind of this state
   * @param {Error|string|undefined} [error] - an optional error
   * @param {string|undefined} [reason] - an optional reason given for rejecting this task
   */
  constructor(name, kind, error, reason) {
    // Create each property as read-only (writable: false and configurable: false are defaults)
    Object.defineProperty(this, 'name', {value: name, enumerable: true});
    Object.defineProperty(this, 'kind', {value: kind, enumerable: true});

    // Convert the given error (if any) into a string (to facilitate serialization to and from JSON)
    const errorMessage = typeof error === 'string' ? error : error instanceof String ? error.valueOf() :
      error ? error.toString() : undefined;

    Object.defineProperty(this, 'error', {value: errorMessage, enumerable: true});
    Object.defineProperty(this, 'reason', {value: reason, enumerable: true});
  }

  // ===================================================================================================================
  // State accessors
  // ===================================================================================================================

  /**
   * Returns true if this state is an unstarted state (i.e. NOT completed, NOT timed out, NOT rejected, has no error and
   * its name is not names.Started); false otherwise
   * @returns {boolean} true if unstarted; false otherwise
   */
  get unstarted() {
    return this.kind === StateType.UNSTARTED;
  }

  /**
   * Returns true if this state is a started state (i.e. NOT completed, NOT timed out, NOT rejected, has no error and
   * its name is names.Started); false otherwise
   * @returns {boolean} true if started; false otherwise
   */
  get started() {
    return this.kind === StateType.STARTED;
  }

  /**
   * Returns true if this state is a completed state; false otherwise.
   * @return {boolean} true if has timed out; false otherwise.
   */
  get completed() {
    return this.kind === StateType.COMPLETED;
  }

  /**
   * Returns true if this state is a failed state (i.e. NOT completed, NOT timed out, NOT rejected, but has an error);
   * false otherwise.
   * @return {boolean} true if failed; false otherwise.
   */
  get failed() {
    return this.kind === StateType.FAILED;
  }

  /**
   * Returns true if this state is a timed out state (i.e. timed out, not completed and not rejected); false otherwise.
   * @return {boolean} true if timed out; false otherwise.
   */
  get timedOut() {
    return this.kind === StateType.TIMED_OUT;
  }

  /**
   * Returns true if this state is a rejected state; false otherwise.
   * @return {boolean} true if rejected; false otherwise.
   */
  get rejected() {
    return this.kind === StateType.REJECTED;
  }

  // ===================================================================================================================
  // Accessors for derived state
  // ===================================================================================================================

  /**
   * Returns true if this state is an incomplete state (i.e. not completed and not rejected); false otherwise
   * @returns {boolean} true if incomplete; false otherwise
   */
  get incomplete() {
    return this.kind !== StateType.COMPLETED && this.kind !== StateType.REJECTED;
  }

  /**
   * Returns true if this state is a finalised state (i.e. either completed or rejected); false otherwise
   * @returns {boolean} true if a finalised state; false otherwise
   */
  get finalised() {
    return this.kind === StateType.COMPLETED || this.kind === StateType.REJECTED;
  }

  /**
   * Returns true if this state is an instance of Rejected; false otherwise
   * @returns {boolean} true if instance of Rejected; false otherwise
   */
  isRejected() {
    return this instanceof Rejected;
  }

  /**
   * Returns true if this state is an instance of Abandoned; false otherwise
   * @returns {boolean} true if instance of Abandoned; false otherwise
   */
  isAbandoned() {
    return this instanceof Abandoned;
  }

  /**
   * Returns true if this state is an instance of Discarded; false otherwise
   * @returns {boolean} true if instance of Discarded; false otherwise
   */
  isDiscarded() {
    return this instanceof Discarded;
  }

  toString() {
    return this.constructor.name !== this.name ? `${this.constructor.name}: ${this.name}` : this.constructor.name;
  }
}

// TaskState superclass constructor
exports.TaskState = TaskState;


/**
 * A TaskState subclass for an initial unstarted state of a task or operation whose fate has not been decided yet.
 * @extends TaskState
 */
class Unstarted extends TaskState {
  /** Constructs an Unstarted task state */
  constructor() {
    super(names.Unstarted, StateType.UNSTARTED, undefined, undefined);
  }
}

exports.Unstarted = Unstarted; // rather use instances.Unstarted singleton

/**
 * A TaskState subclass for a "transient" started state of a task or operation whose execution has been started, but not
 * yet completed.
 * @extends TaskState
 */
class Started extends TaskState {
  /** Constructs a Started task state */
  constructor() {
    super(names.Started, StateType.STARTED, undefined, undefined);
  }
}

exports.Started = Started; // rather use instances.Started singleton

/**
 * A TaskState subclass and superclass for all completed states of a task or operation. CompletedState states are all
 * marked as completed (and NOT timed out and NOT rejected) with no errors and no rejection reasons.
 * @extends TaskState
 */
class CompletedState extends TaskState {
  /**
   * Constructs a CompletedState task state
   * @param {string} name - the name of the state
   */
  constructor(name) {
    super(name, StateType.COMPLETED, undefined, undefined);
  }
}

exports.CompletedState = CompletedState;

/**
 * A TaskState subclass and superclass for all timed out states of a task or operation. TimedOutState states are all
 * marked as timedOut (and NOT completed, and NOT rejected) with optional errors and no rejection reasons. They indicate
 * that a task timed out, that the timeout was not an unretryable error and that the task should be reattempted again later.
 * @extends TaskState
 */
class TimedOutState extends TaskState {
  /**
   * Constructs a TimedOutState task state
   * @param {string} name - the name of this state
   * @param {Error|string|undefined} [error] - an optional error that occurred that triggered this TimedOutState state
   */
  constructor(name, error) {
    super(name, StateType.TIMED_OUT, error, undefined);
  }
}

exports.TimedOutState = TimedOutState;

/**
 * A TaskState subclass and superclass for all failed states of a task or operation. FailedState states are all marked
 * as NOT completed, NOT timed out and NOT rejected with the error encountered. They indicate that a task failed, that
 * the failure was not an unretryable error and that the task should be reattempted again later.
 * @extends TaskState
 */
class FailedState extends TaskState {
  /**
   * Constructs a FailedState task state
   * @param {string} name - the name of this state
   * @param {Error|string} error - the error encountered
   */
  constructor(name, error) {
    super(name, StateType.FAILED, error, undefined);
  }
}

exports.FailedState = FailedState;

/**
 * A TaskState subclass and superclass for all rejected states of a task or operation. RejectedState states are all
 * marked as rejected (and NOT completed and NOT timed out) with a reason and an optional error. They indicate that a
 * task was rejected during execution for some reason (or some unretryable failure) and cannot be reattempted.
 * @extends TaskState
 */
class RejectedState extends TaskState {
  /**
   * Constructs a RejectedState task state
   * @param {string} name - the name of this state
   * @param {string} reason - the reason for rejecting a task
   * @param {Error|string|undefined} [error] - an optional error
   */
  constructor(name, reason, error) {
    super(name, StateType.REJECTED, error, reason);
  }
}

exports.RejectedState = RejectedState;

/**
 * A CompletedState subclass with a state and name of 'Completed'. Completed states are all marked as completed (and NOT
 * timed out and NOT rejected) with no errors and no rejection reasons.
 * @extends CompletedState
 */
class Completed extends CompletedState {
  /** Constructs a Completed task state */
  constructor() {
    super(names.Completed);
  }
}

exports.Completed = Completed; // rather use instances.Completed singleton

/**
 * A CompletedState subclass with a state and name of 'Succeeded'. Succeeded states are all marked as completed (and NOT
 * timed out and NOT rejected) with no errors and no rejection reasons.
 * @extends CompletedState
 */
class Succeeded extends CompletedState {
  /** Constructs a Succeeded task state */
  constructor() {
    super(names.Succeeded);
  }
}

exports.Succeeded = Succeeded; // rather use instances.Succeeded singleton

/**
 * A TimedOutState subclass with a state and name of 'TimedOut'. TimedOut states are all marked as timedOut (and NOT
 * completed and NOT rejected) with an optional error that occurred. As with its TimedOutState super-state, this state
 * indicates that a task timed out, that the timeout is not an unretryable error and that the task should be reattempted
 * again later.
 * @extends TimedOutState
 */
class TimedOut extends TimedOutState {
  /**
   * Constructs a TimedOut task state
   * @param {Error|string|undefined} [error] - an optional error that occurred that triggered this TimedOut state
   */
  constructor(error) {
    super(names.TimedOut, error);
  }
}

exports.TimedOut = TimedOut;

/**
 * A FailedState subclass with a state and name of 'Failed'. Failed states are all marked as NOT completed, NOT timed
 * out and NOT rejected with the error that occurred. As with its FailedState super-state, this state indicates that a
 * task failed, but that the failure was not an unretryable error and that the task should be reattempted again later.
 * @extends FailedState
 */
class Failed extends FailedState {
  /**
   * Constructs a Failed task state
   * @param {Error|string} error - the error that occurred that triggered this Failed state
   */
  constructor(error) {
    super(names.Failed, error);
  }
}

exports.Failed = Failed;

/**
 * A RejectedState subclass with a state of 'Rejected'. Rejected states are all marked as rejected (and NOT completed
 * and NOT timed out) with a reason and an optional error. As with its RejectedState super-state, this state indicates
 * that a task was rejected during execution for some reason (or some unretryable failure) and cannot be reattempted.
 *
 * For example: a task may not be able to start or run to completion due to invalid input data and thus would never be
 * able to achieve a successful completed state, so the only recourse left is to flag it as rejected with a rejection
 * reason and optional error.
 *
 * @extends RejectedState
 */
class Rejected extends RejectedState {
  /**
   * Constructs a Rejected task state
   * @param {string} reason - the reason for rejecting a task
   * @param {Error|string|undefined} [error] - an optional error encountered that triggered this Rejected state
   */
  constructor(reason, error) {
    super(names.Rejected, reason, error);
  }
}

exports.Rejected = Rejected;

/**
 * A RejectedState subclass with a state & name of 'Discarded'. Discarded states are all marked as rejected (and NOT
 * completed and NOT timed out) with a reason and an optional error. This state indicates that a task had to be
 * discarded for some reason and cannot be reattempted.
 *
 * For example: A task that is unable to complete successfully within the maximum allowed number of attempts, is
 * discarded by flagging it as rejected with an appropriate reason and optional error.
 *
 * @extends RejectedState
 */
class Discarded extends RejectedState {
  /**
   * Constructs a Discarded task state
   * @param {string} reason - the reason for rejecting this task
   * @param {Error|string|undefined} [error] - an optional error encountered that triggered this Discarded state
   */
  constructor(reason, error) {
    super(names.Discarded, reason, error);
  }
}

exports.Discarded = Discarded;

/**
 * A RejectedState subclass with a state & name of 'Abandoned'. Abandoned states are all marked as rejected (and NOT
 * completed and NOT timed out) with a reason and an optional error. This state indicates that a task was abandoned for
 * some reason.
 *
 * For example: A task may no longer need to be run after developer changes to the list of task definitions for a
 * particular process cause previous tasks to no longer appear in the new list of tasks to be completed. These orphaned
 * tasks can NEVER be completed in such a scenario and hence have to flagged as rejected with an appropriate rejection
 * reason and optional error.
 *
 * @extends RejectedState
 */
class Abandoned extends RejectedState {
  /**
   * Constructs an Abandoned task state
   * @param {string} reason - the reason for rejecting this task
   * @param {Error|string|undefined} [error] - an optional error encountered that triggered this Abandoned state
   */
  constructor(reason, error) {
    super(names.Abandoned, reason, error);
  }
}

exports.Abandoned = Abandoned;

/**
 * The singleton task state instances.
 * @namespace
 * @property {Unstarted} Unstarted - the singleton Unstarted instance
 * @property {Started} Started - the singleton Started instance
 * @property {Completed} Completed - the singleton Completed instance
 * @property {Succeeded} Succeeded - the singleton Succeeded instance
 */
const instances = {
  Unstarted: new Unstarted(),
  Started: new Started(),
  Completed: new Completed(),
  Succeeded: new Succeeded()
};
Object.freeze(instances);
exports.instances = instances;

// Install the names, instances constants & State enum as static properties on TaskState
Object.defineProperty(TaskState, 'names', {value: names});
Object.defineProperty(TaskState, 'instances', {value: instances});
// Enum for the types of states supported - re-exported for convenience
Object.defineProperty(TaskState, 'StateType', {value: StateType});

/**
 * Constructs an appropriate `TaskState` instance from the given legacy state-like properties: `name`; `completed`;
 * `timedOut`; optional `error`; `rejected`; and optional `reason`.
 *
 * @param {string} name - the name of the task state
 * @param {boolean} completed - whether or not to consider a task with this state as completed or not
 * @param {boolean} timedOut - whether or not to consider a task with this state as timed out or not
 * @param {Error|string|undefined} [error] - an optional error
 * @param {boolean} rejected - whether or not to consider a task with this state as rejected/abandoned/discarded or not
 * @param {string|undefined} [reason] - an optional reason given for rejecting this task
 * @return {AnyTaskState} the appropriate TaskState instance created
 */
function fromLegacyStateLikeProperties(name, completed, timedOut, error, rejected, reason) {
  if (!completed && !timedOut && !error && !rejected && !reason) {
    return name === names.Started ? instances.Started : instances.Unstarted;
  }
  if (completed && !timedOut && !error && !rejected && !reason) {
    return name === names.Completed ? instances.Completed :
      name === names.Succeeded ? instances.Succeeded : new CompletedState(name);
  }
  if (!completed && timedOut && !rejected && !reason) { // error is optional
    return name === names.TimedOut ? new TimedOut(error) : new TimedOutState(name, error);
  }
  if (!completed && !timedOut && error && !rejected && !reason) {
    return name === names.Failed ? new Failed(error) : new FailedState(name, error);
  }
  if (!completed && !timedOut && rejected) { // reason could be empty and error is optional
    return name === names.Rejected ? new Rejected(reason, error) :
      name === names.Discarded ? new Discarded(reason, error) :
        name === names.Abandoned ? new Abandoned(reason, error) : new RejectedState(name, reason, error);
  }

  // Translate the given rejected, timedOut, error & completed arguments into an appropriate state to use
  //noinspection JSUnusedLocalSymbols
  const state = rejected ? StateType.REJECTED : timedOut ? StateType.TIMED_OUT : error ? StateType.FAILED :
    completed ? StateType.COMPLETED : StateType.UNSTARTED;

  return new TaskState(name, state, error, reason);
}

// Install it as a static method too
if (!TaskState.fromLegacyStateLikeProperties) TaskState.fromLegacyStateLikeProperties = fromLegacyStateLikeProperties;

/**
 * Constructs an appropriate `TaskState` instance from the given new state-like properties: `name`; `state`; optional
 * `error`; and optional `reason`.
 *
 * @param {string} name - the name of the task state
 * @param {StateType} state - the underlying state of the task state
 * @param {Error|string|undefined} [error] - an optional error with which the task failed
 * @param {string|undefined} [reason] - an optional reason given for rejecting the task
 * @return {AnyTaskState} the appropriate TaskState instance created
 */
function fromStateLikeProperties(name, state, error, reason) {
  if (state) {
    switch (state) {
      case StateType.UNSTARTED:
        return instances.Unstarted;

      case StateType.STARTED:
        return instances.Started;

      case StateType.COMPLETED:
        return name === names.Completed ? instances.Completed :
          name === names.Succeeded ? instances.Succeeded : new CompletedState(name);

      case StateType.FAILED:
        return name === names.Failed ? new Failed(error) : new FailedState(name, error);

      case StateType.TIMED_OUT:
        return name === names.TimedOut ? new TimedOut(error) : new TimedOutState(name, error);

      case StateType.REJECTED:
        return name === names.Rejected ? new Rejected(reason, error) :
          name === names.Discarded ? new Discarded(reason, error) :
            name === names.Abandoned ? new Abandoned(reason, error) :
              new RejectedState(name, reason, error);

      default:
        throw new Error(`Unexpected state (${state}) for task state-like with name: ${name}, error: ${error} & reason: ${reason}`);
    }
  }
  return undefined;
}

// Install it as a static method too
if (!TaskState.fromStateLikeProperties) TaskState.fromStateLikeProperties = fromStateLikeProperties;

/**
 * Converts the given state-like object back into an appropriate TaskState.
 * @param {TaskStateLike|LegacyTaskStateLike|undefined} stateLike - an optional state-like object to convert
 * @returns {AnyTaskState|undefined} an appropriate TaskState for the given state-like object (if defined); otherwise
 * undefined
 */
function toTaskStateFromStateLike(stateLike) {
  return stateLike ?
    stateLike.hasOwnProperty('kind') ?
      fromStateLikeProperties(stateLike.name, stateLike.kind, stateLike.error, stateLike.reason) :
      stateLike.hasOwnProperty('completed') || stateLike.hasOwnProperty('rejected') || stateLike.hasOwnProperty('timedOut') ?
        fromLegacyStateLikeProperties(stateLike.name, stateLike.completed, stateLike.timedOut, stateLike.error, stateLike.rejected, stateLike.reason) :
        undefined :
    undefined;
}

// Install it as a static method too
if (!TaskState.toTaskStateFromStateLike) TaskState.toTaskStateFromStateLike = toTaskStateFromStateLike;

/**
 * Compares state `a` with state `b` and returns a negative number if `a` is "less advanced" than `b`; zero if `a` is as
 * advanced as `b`; or a positive number if `a` is "more advanced" than `b`.
 * @param {TaskState} a - first state to compare
 * @param {TaskState} b - second state to compare
 * @returns {number} a negative number if `a` is "less advanced" than `b`; zero if `a` is as advanced as `b`; or a
 * positive number if `a` is "more advanced" than `b`
 */
function compareStates(a, b) {
  return StateType.compareStateTypes(a ? a.kind : undefined, b ? b.kind : undefined);
}

// Install it as a static method too
if (!TaskState.compareStates) TaskState.compareStates = compareStates;