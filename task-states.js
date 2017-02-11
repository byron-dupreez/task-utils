'use strict';

const errors = require('./errors');

/**
 * A TaskState class and its subclasses with static utilities for defining the state of a task or operation.
 * @module task-utils/task-states
 * @author Byron du Preez
 */

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

/**
 * TaskState - The base class for a state of a task or operation.
 * @extends {Object}
 * @property {string} name - the name of the state
 * @property {boolean} completed - whether to consider a task with this state as completed or not
 * @property {boolean} timedOut - whether to consider a task with this state as timed out (or failed due to a timeout) or not
 * @property {string|undefined} [error] - an optional error with which a task was failed, timed out or rejected
 * @property {boolean} rejected - whether to consider a task with this state as rejected/abandoned/discarded or not
 * @property {string|undefined} [reason] - an optional reason given for rejecting a task
 */
class TaskState {
  /**
   * Constructs a TaskState.
   * @param {string} name - the name of the state
   * @param {boolean|Boolean} completed - whether to consider a task with this state as completed or not
   * @param {boolean|Boolean} timedOut - whether to consider a task with this state as timed out (or failed due to a timeout) or not
   * @param {Error|string|undefined} [error] - an optional error
   * @param {boolean|Boolean} rejected - whether to consider a task with this state as rejected/abandoned/discarded or not
   * @param {string|undefined} [reason] - an optional reason given for rejecting this task
   */
  constructor(name, completed, timedOut, error, rejected, reason) {
    // Create each property as read-only (writable: false and configurable: false are defaults)
    Object.defineProperty(this, '_name', {value: name, enumerable: true});
    Object.defineProperty(this, '_completed', {value: !!completed, enumerable: true}); // !! deals with being given a non-boolean completed
    Object.defineProperty(this, '_timedOut', {value: !!timedOut, enumerable: true}); // !! deals with being given a non-boolean

    // Convert the given error (if any) into a string (to facilitate serialization to and from JSON)
    const errorMessage = typeof error === 'string' ? error : error instanceof String ? error.valueOf() :
        error ? error.toString() : undefined;

    Object.defineProperty(this, '_error', {value: errorMessage, enumerable: true});
    Object.defineProperty(this, '_rejected', {value: !!rejected, enumerable: true}); // !! deals with being given a non-boolean
    Object.defineProperty(this, '_reason', {value: reason, enumerable: true});
  }

  /**
   * Customized toJSON method, which is used by {@linkcode JSON.stringify} to output the internal _name, _completed,
   * _timedOut, _error, _rejected and _reason properties without their underscores.
   */
  toJSON() {
    return {
      name: this._name,
      completed: this._completed,
      timedOut: this._timedOut,
      error: this._error,
      rejected: this._rejected,
      reason: this._reason
    };
  }

  // ===================================================================================================================
  // State accessors
  // ===================================================================================================================

  /**
   * Returns the name of this state.
   * @return {string} the name of this state.
   */
  get name() {
    return this._name;
  }

  /**
   * Returns true if this state is a completed state; false otherwise.
   * @return {boolean} true if has timed out; false otherwise.
   */
  get completed() {
    return this._completed;
  }

  /**
   * Returns true if this state is a timed out state (i.e. timed out, not completed and not rejected); false otherwise.
   * @return {boolean} true if timed out; false otherwise.
   */
  get timedOut() {
    return this._timedOut;
  }

  /**
   * Returns the error encountered when this state is a failed or timed out state; otherwise undefined.
   * @return {string|undefined} the error encountered; otherwise undefined.
   */
  get error() {
    return this._error;
  }

  /**
   * Returns true if this state is a rejected state; false otherwise.
   * @return {boolean} true if rejected; false otherwise.
   */
  get rejected() {
    return this._rejected;
  }

  /**
   * Returns the reason for rejection if this state is a rejected state; otherwise undefined.
   * @return {string|undefined} the reason for rejection; otherwise undefined.
   */
  get reason() {
    return this._reason;
  }

  // ===================================================================================================================
  // Accessors for derived state
  // ===================================================================================================================

  /**
   * Returns true if this state is an unstarted state (i.e. NOT completed, NOT timed out, NOT rejected, has no error and
   * its name is not names.Started); false otherwise
   * @returns {boolean} true if unstarted; false otherwise
   */
  get unstarted() {
    return !this._completed && !this._timedOut && !this._error && !this._rejected && this._name !== names.Started;
  }

  /**
   * Returns true if this state is a started state (i.e. NOT completed, NOT timed out, NOT rejected, has no error and
   * its name is names.Started); false otherwise
   * @returns {boolean} true if started; false otherwise
   */
  get started() {
    return !this._completed && !this._timedOut && !this._error && !this._rejected && this._name === names.Started;
  }

  /**
   * Returns true if this state is an incomplete state (i.e. not completed and not rejected); false otherwise
   * @returns {boolean} true if incomplete; false otherwise
   */
  get incomplete() {
    return !this._completed && !this._rejected;
  }

  /**
   * Returns true if this state is a failed state (i.e. NOT completed, NOT timed out, NOT rejected, but has an error);
   * false otherwise.
   * @return {boolean} true if failed; false otherwise.
   */
  get failed() {
    return !this._completed && !this._timedOut && !this._rejected && !!this._error;
  }

  /**
   * Returns true if this state is a finalised state (i.e. either completed or rejected); false otherwise
   * @returns {boolean} true if a finalised state; false otherwise
   */
  get finalised() {
    return this._completed || this._rejected;
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

/**
 * A TaskState subclass for an initial unstarted state of a task or operation whose fate has not been decided yet.
 * @extends TaskState
 */
class Unstarted extends TaskState {
  /** Constructs an Unstarted task state */
  constructor() {
    super(names.Unstarted, false, false, undefined, false, undefined);
  }
}

/**
 * A TaskState subclass for a "transient" started state of a task or operation whose execution has been started, but not
 * yet completed.
 * @extends TaskState
 */
class Started extends TaskState {
  /** Constructs a Started task state */
  constructor() {
    super(names.Started, false, false, undefined, false, undefined);
  }
}

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
    super(name, true, false, undefined, false, undefined);
  }
}

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
    super(name, false, true, error, false, undefined);
  }
}

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
    super(name, false, false, error, false, undefined);
  }
}

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
    super(name, false, false, error, true, reason);
  }
}

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

// Install the names & instances constants as static properties on TaskState
Object.defineProperty(TaskState, 'names', {value: names});
Object.defineProperty(TaskState, 'instances', {value: instances});

/**
 * Constructs an appropriate TaskState instance based on the given name, completed, timedOut, optional error, rejected &
 * optional reason.
 *
 * @param {string} name - the name of this state
 * @param {boolean} completed - whether or not to consider a task with this state as completed or not
 * @param {boolean} timedOut - whether or not to consider a task with this state as timed out or not
 * @param {Error|string|undefined} [error] - an optional error
 * @param {boolean} rejected - whether or not to consider a task with this state as rejected/abandoned/discarded or not
 * @param {string|undefined} [reason] - an optional reason given for rejecting this task
 * @return {AnyTaskState} the appropriate TaskState instance created
 */
function toTaskState(name, completed, timedOut, error, rejected, reason) {
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
  return new TaskState(name, completed, timedOut, error, rejected, reason);
}
// Install it as a static method too
if (!TaskState.toTaskState) TaskState.toTaskState = toTaskState;

/**
 * Converts the given state-like object back into an appropriate TaskState.
 * @param {TaskStateLike|undefined} stateLike - an optional state-like object to convert
 * @returns {AnyTaskState|undefined} an appropriate TaskState for the given state-like object (if defined); otherwise
 * undefined
 */
function toTaskStateFromStateLike(stateLike) {
  return stateLike ?
    toTaskState(stateLike.name, stateLike.completed, stateLike.timedOut, stateLike.error, stateLike.rejected, stateLike.reason) :
    undefined;
}
// Install it as a static method too
if (!TaskState.toTaskStateFromStateLike) TaskState.toTaskStateFromStateLike = toTaskStateFromStateLike;

module.exports = {
  // Task state names for task states with fixed names
  names: names,

  // Singleton task state instances
  instances: instances,

  // TaskState superclass constructor
  TaskState: TaskState,

  // TaskState direct subclasses
  Unstarted: Unstarted, // rather use instances.Unstarted singleton
  Started: Started, // rather use instances.Started singleton
  CompletedState: CompletedState,
  TimedOutState: TimedOutState,
  FailedState: FailedState,
  RejectedState: RejectedState,

  // CompletedState subclasses
  Completed: Completed, // rather use instances.Completed singleton
  Succeeded: Succeeded, // rather use instances.Succeeded singleton

  // TimedOutState subclasses
  TimedOut: TimedOut,

  // FailedState subclasses
  Failed: Failed,

  // RejectedState subclasses
  Rejected: Rejected,
  Discarded: Discarded,
  Abandoned: Abandoned,
};
