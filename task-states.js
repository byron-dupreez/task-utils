'use strict';

const errors = require(`core-functions/errors`);

/**
 * A TaskState class and its subclasses with static utilities for defining the state of a task or operation.
 * @module task-utils/task-states
 * @author Byron du Preez
 */

/**
 * Definition of a task state-like object.
 * @typedef {Object} TaskStateLike
 * @property {string} name - the name of the state
 * @property {boolean} completed - whether or not to consider a task with this state as completed or not
 * @property {boolean} timedOut - whether or not to consider a task with this state as timed out or not
 * @property {Error|string|undefined} [error] - an optional error
 * @property {boolean} rejected - whether or not to consider a task with this state as rejected/abandoned/discarded or not
 * @property {string|undefined} [reason] - an optional reason given for rejecting this task
 */

const UNSTARTED_NAME = 'Unstarted';
const COMPLETED_NAME = 'Completed';
const SUCCEEDED_NAME = 'Succeeded';
const TIMED_OUT_NAME = 'TimedOut';
const FAILED_NAME = 'Failed';
const REJECTED_NAME = 'Rejected';
const DISCARDED_NAME = 'Discarded';
const ABANDONED_NAME = 'Abandoned';

/**
 * The base class for a state of a task or operation.
 * @typedef {Object} TaskState
 * @property {string} name - the name of the state
 * @property {boolean} completed - whether or not to consider a task with this state as completed or not
 * @property {boolean} timedOut - whether or not this task timed out or failed due to a timeout
 * @property {string|undefined} [error] - an optional error
 * @property {boolean} rejected - whether or not to consider a task with this state as rejected/abandoned/discarded or not
 * @property {string|undefined} [reason] - an optional reason given for rejecting this task
 */
class TaskState {
  /**
   * Constructs a TaskState.
   * @param {string} name - the name of the state
   * @param {boolean} completed - whether or not to consider a task with this state as completed or not
   * @param {boolean} timedOut - whether or not to consider a task this state as timed out or not
   * @param {Error|string|undefined} [error] - an optional error
   * @param {boolean} rejected - whether or not to consider a task with this state as rejected/abandoned/discarded or not
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
   * Returns true if this state is an unstarted state (i.e. NOT completed, NOT timed out, NOT rejected and has no error);
   * false otherwise
   * @returns {boolean} true if unstarted; false otherwise
   */
  get unstarted() {
    return !this._completed && !this._timedOut && !this._error && !this._rejected;
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

}

/**
 * A TaskState subclass for an initial unstarted state of a task or operation whose fate has not been decided yet.
 */
class Unstarted extends TaskState {
  constructor() {
    super(UNSTARTED_NAME, false, false, undefined, false, undefined);
  }
}

/**
 * A TaskState subclass and superclass for all completed states of a task or operation.
 * CompletedState states are all marked as completed (and NOT timed out and NOT rejected) with no errors and no
 * rejection reasons.
 *
 * @param {string} name - the name of the state
 */
class CompletedState extends TaskState {
  constructor(name) {
    super(name, true, false, undefined, false, undefined);
  }
}

/**
 * A TaskState subclass and superclass for all timed out states of a task or operation.
 * TimedOutState states are all marked as timedOut (and NOT completed, and NOT rejected) with optional errors and no
 * rejection reasons. They indicate that a task timed out, that the timeout was not an unretryable error and that the
 * task should be reattempted again later.
 *
 * @param {string} name - the name of this state
 * @param {Error|string|undefined} [error] - an optional error that occurred that triggered this TimedOutState state
 */
class TimedOutState extends TaskState {
  constructor(name, error) {
    super(name, false, true, error, false, undefined);
  }
}

/**
 * A TaskState subclass and superclass for all failed states of a task or operation.
 *
 * FailedState states are all marked as NOT completed, NOT timed out and NOT rejected with the error encountered.
 * They indicate that a task failed, that the failure was not an unretryable error and that the task should be
 * reattempted again later.
 *
 * @param {string} name - the name of this state
 * @param {Error|string} error - the error encountered
 */
class FailedState extends TaskState {
  constructor(name, error) {
    super(name, false, false, error, false, undefined);
  }
}

/**
 * A TaskState subclass and superclass for all rejected states of a task or operation.
 *
 * RejectedState states are all marked as rejected (and NOT completed and NOT timed out) with a reason and an optional
 * error. They indicate that a task was rejected during execution for some reason (or some unretryable failure) and
 * cannot be reattempted.
 *
 * @param {string} name - the name of this state
 * @param {string} reason - the reason for rejecting a task
 * @param {Error|string|undefined} [error] - an optional error
 */
class RejectedState extends TaskState {
  constructor(name, reason, error) {
    super(name, false, false, error, true, reason);
  }
}

/**
 * A CompletedState subclass with a state and name of 'Completed'.
 * Completed states are all marked as completed (and NOT timed out and NOT rejected) with no errors and no rejection
 * reasons.
 */
class Completed extends CompletedState {
  constructor() {
    super(COMPLETED_NAME);
  }
}

/**
 * A CompletedState subclass with a state and name of 'Succeeded'.
 * Succeeded states are all marked as completed (and NOT timed out and NOT rejected) with no errors and no rejection
 * reasons.
 */
class Succeeded extends CompletedState {
  constructor() {
    super(SUCCEEDED_NAME);
  }
}

/**
 * A TimedOutState subclass with a state and name of 'TimedOut'.
 *
 * TimedOut states are all marked as timedOut (and NOT completed and NOT rejected) with an optional error that occurred.
 * As with its TimedOutState super-state, this state indicates that a task timed out, that the timeout is not an unretryable
 * error and that the task should be reattempted again later.
 *
 * @param {Error|string|undefined} [error] - an optional error that occurred that triggered this TimedOut state
 */
class TimedOut extends TimedOutState {
  constructor(error) {
    super(TIMED_OUT_NAME, error);
  }
}

/**
 * A FailedState subclass with a state and name of 'Failed'.
 *
 * Failed states are all marked as NOT completed, NOT timed out and NOT rejected with the error that occurred. As with
 * its FailedState super-state, this state indicates that a task failed, but that the failure was not an unretryable error
 * and that the task should be reattempted again later.
 *
 * @param {Error|string} error - the error that occurred that triggered this Failed state
 */
class Failed extends FailedState {
  constructor(error) {
    super(FAILED_NAME, error);
  }
}

/**
 * A RejectedState subclass with a state of 'Rejected'.
 *
 * Rejected states are all marked as rejected (and NOT completed and NOT timed out) with a reason and an optional error.
 * As with its RejectedState super-state, this state indicates that a task was rejected during execution for some reason (or
 * some unretryable failure) and cannot be reattempted.
 *
 * For example: a task may not be able to start or run to completion due to invalid input data and thus would never be
 * able to achieve a successful completed state, so the only recourse left is to flag it as rejected with a rejection
 * reason and optional error.
 *
 * @param {string} reason - the reason for rejecting a task
 * @param {Error|string|undefined} [error] - an optional error encountered that triggered this Rejected state
 */
class Rejected extends RejectedState {
  constructor(reason, error) {
    super(REJECTED_NAME, reason, error);
  }
}

/**
 * A RejectedState subclass with a state and name of 'Discarded'.
 *
 * Discarded states are all marked as rejected (and NOT completed and NOT timed out) with a reason and an optional error.
 * This state indicates that a task had to be discarded for some reason and cannot be reattempted.
 *
 * For example: A task that is unable to complete successfully within the maximum allowed number of attempts, is
 * discarded by flagging it as rejected with an appropriate reason and optional error.
 *
 * @param {string} reason - the reason for rejecting this task
 * @param {Error|string|undefined} [error] - an optional error encountered that triggered this Discarded state
 */
class Discarded extends RejectedState {
  constructor(reason, error) {
    super(DISCARDED_NAME, reason, error);
  }
}

/**
 * A RejectedState subclass with a state of 'Abandoned'.
 *
 * Discarded states are all marked as rejected (and NOT completed and NOT timed out) with a reason and an optional error.
 * This state indicates that a task was abandoned for some reason.
 *
 * For example: A task may no longer need to be run after developer changes to the list of task definitions for a
 * particular process cause previous tasks to no longer appear in the new list of tasks to be completed. These orphaned
 * tasks can NEVER be completed in such a scenario and hence have to flagged as rejected with an appropriate rejection
 * reason and optional error.
 *
 * @param {string} reason - the reason for rejecting this task
 * @param {Error|string|undefined} [error] - an optional error encountered that triggered this Abandoned state
 */
class Abandoned extends RejectedState {
  constructor(reason, error) {
    super(ABANDONED_NAME, reason, error);
  }
}

/**
 * A singleton for an initial unstarted state (with a name of 'Unstarted') of a task or operation whose fate has not
 * been decided yet.
 */
const UNSTARTED = new Unstarted();
// Install the constant as a static on TaskState
if (!TaskState.UNSTARTED) Object.defineProperty(TaskState, 'UNSTARTED', {value: UNSTARTED});

/**
 * A singleton for a completed state (with a name of 'Completed') of a task or operation.
 */
const COMPLETED = new Completed();
// Install the constant as a static on TaskState
if (!TaskState.COMPLETED) Object.defineProperty(TaskState, 'COMPLETED', {value: COMPLETED});

/**
 * A singleton for a succeeded state (with a name of 'Succeeded') of a task or operation.
 */
const SUCCEEDED = new Succeeded();
// Install the constant as a static on TaskState
if (!TaskState.SUCCEEDED) Object.defineProperty(TaskState, 'SUCCEEDED', {value: SUCCEEDED});

// Also install the name constants as statics on TaskState
if (!TaskState.UNSTARTED_NAME) Object.defineProperty(TaskState, 'UNSTARTED_NAME', {value: UNSTARTED_NAME});
if (!TaskState.COMPLETED_NAME) Object.defineProperty(TaskState, 'COMPLETED_NAME', {value: COMPLETED_NAME});
if (!TaskState.SUCCEEDED_NAME) Object.defineProperty(TaskState, 'SUCCEEDED_NAME', {value: SUCCEEDED_NAME});
if (!TaskState.TIMED_OUT_NAME) Object.defineProperty(TaskState, 'TIMED_OUT_NAME', {value: TIMED_OUT_NAME});
if (!TaskState.FAILED_NAME) Object.defineProperty(TaskState, 'FAILED_NAME', {value: FAILED_NAME});
if (!TaskState.REJECTED_NAME) Object.defineProperty(TaskState, 'REJECTED_NAME', {value: REJECTED_NAME});
if (!TaskState.DISCARDED_NAME) Object.defineProperty(TaskState, 'DISCARDED_NAME', {value: DISCARDED_NAME});
if (!TaskState.ABANDONED_NAME) Object.defineProperty(TaskState, 'ABANDONED_NAME', {value: ABANDONED_NAME});

/**
 * Constructs an appropriate TaskState instance based on the given name, completed and optional error.
 *
 * @param {string} name - the name of this state
 * @param {boolean} completed - whether or not to consider a task with this state as completed or not
 * @param {boolean} timedOut - whether or not to consider a task with this state as timed out or not
 * @param {Error|string|undefined} error - an optional error
 * @param {boolean} rejected - whether or not to consider a task with this state as rejected/abandoned/discarded or not
 * @param {string|undefined} reason - an optional reason given for rejecting this task
 * @return {TaskState|Unstarted|CompletedState|TimedOutState|FailedState|RejectedState|Completed|Succeeded|TimedOut|Failed|Rejected|Discarded|Abandoned}
 * the appropriate TaskState instance created
 */
function toTaskState(name, completed, timedOut, error, rejected, reason) {
  if (!completed && !timedOut && !error && !rejected && !reason) {
    return UNSTARTED;
  }
  if (name === COMPLETED_NAME && completed && !timedOut && !error && !rejected && !reason) {
    return COMPLETED;
  }
  if (name === SUCCEEDED_NAME && completed && !timedOut && !error && !rejected && !reason) {
    return SUCCEEDED;
  }
  if (name === TIMED_OUT_NAME && !completed && timedOut && !rejected && !reason) { // error is optional
    return new TimedOut(error);
  }
  if (name === FAILED_NAME && !completed && !timedOut && error && !rejected && !reason) {
    return new Failed(error);
  }
  if (name === REJECTED_NAME && !completed && !timedOut && rejected) { // reason could be empty and error is optional
    return new Rejected(reason, error);
  }
  if (name === DISCARDED_NAME && !completed && !timedOut && rejected) { // reason could be empty and error is optional
    return new Discarded(reason, error);
  }
  if (name === ABANDONED_NAME && !completed && !timedOut && rejected) { // reason could be empty and error is optional
    return new Abandoned(reason, error);
  }
  if (completed && !timedOut && !error && !rejected && !reason) {
    return new CompletedState(name);
  }
  if (!completed && timedOut && !rejected && !reason) { // error is optional
    return new TimedOutState(name, error);
  }
  if (!completed && !timedOut && error && !rejected && !reason) {
    return new FailedState(name, error);
  }
  if (!completed && !timedOut && rejected) { // reason could be empty and error is optional
    return new RejectedState(name, reason, error);
  }
  return new TaskState(name, completed, timedOut, error, rejected, reason);
}
// Install it as a static method too
if (!TaskState.toTaskState) TaskState.toTaskState = toTaskState;

/**
 * Converts the given state-like object back into an appropriate TaskState.
 * @param {TaskStateLike|undefined} stateLike - an optional state-like object to convert
 * @returns {TaskState|undefined} an appropriate TaskState for the given state-like object (if defined); otherwise
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
  // TimeoutError constructor
  TimeoutError: errors.TimeoutError, // re-exported for convenience

  // TaskState constructors
  TaskState: TaskState,

  // TaskState direct subclasses
  Unstarted: Unstarted, // rather use UNSTARTED singleton
  CompletedState: CompletedState,
  TimedOutState: TimedOutState,
  FailedState: FailedState,
  RejectedState: RejectedState,

  // CompletedState subclasses
  Completed: Completed, // rather use COMPLETED singleton
  Succeeded: Succeeded, // rather use SUCCEEDED singleton

  // TimedOutState subclasses
  TimedOut: TimedOut,

  // FailedState subclasses
  Failed: Failed,

  // RejectedState subclasses
  Rejected: Rejected,
  Discarded: Discarded,
  Abandoned: Abandoned,
};
