'use strict';

/**
 * Classes and utilities for defining the state of a task or operation.
 * @module task-utils/task-states
 * @author Byron du Preez
 */

/**
 * Definition of a task state-like object.
 * @typedef {{code, completed, error, rejected, reason}} TaskStateLike
 * @property {string} code - the descriptive code of the state
 * @property {boolean} completed - whether or not to consider a task with this state as completed or not
 * @property {Error|string|undefined} [error] - an optional error
 * @property {boolean} rejected - whether or not to consider a task with this state as rejected/abandoned/discarded or not
 * @property {string|undefined} [reason] - an optional reason given for rejecting this task
 */

const UNSTARTED_CODE = 'Unstarted';
const SUCCEEDED_CODE = 'Succeeded';
const FAILED_CODE = 'Failed';
const REJECTED_CODE = 'Rejected';
const DISCARDED_CODE = 'Discarded';
const ABANDONED_CODE = 'Abandoned';

/**
 * The base class for a state of a task or operation.
 * @typedef TaskState
 * @property {string} code - the descriptive code of the state
 * @property {boolean} completed - whether or not to consider a task with this state as completed or not
 * @property {string|undefined} [error] - an optional error
 * @property {boolean} rejected - whether or not to consider a task with this state as rejected/abandoned/discarded or not
 * @property {string|undefined} [reason] - an optional reason given for rejecting this task
 */
class TaskState {
  /**
   * Constructs a TaskState.
   * @param {string} code - the descriptive code of the state
   * @param {boolean} completed - whether or not to consider a task with this state as completed or not
   * @param {Error|string|undefined} [error] - an optional error
   * @param {boolean} rejected - whether or not to consider a task with this state as rejected/abandoned/discarded or not
   * @param {string|undefined} [reason] - an optional reason given for rejecting this task
   */
  constructor(code, completed, error, rejected, reason) {
    // Create each property as read-only (writable: false and configurable: false are defaults)
    Object.defineProperty(this, 'code', {value: code, enumerable: true});
    Object.defineProperty(this, 'completed', {value: !!completed, enumerable: true}); // !! deals with being given a non-boolean completed

    // Convert the given error (if any) into a string (to facilitate serialization to and from JSON)
    const errorMessage = typeof error === 'string' ? error :
      error instanceof String ? error.valueOf() :
        //error instanceof Error ? error.toString() :
        error ? error.toString() : undefined;

    Object.defineProperty(this, 'error', {value: errorMessage, enumerable: true});
    Object.defineProperty(this, 'rejected', {value: !!rejected, enumerable: true});
    Object.defineProperty(this, 'reason', {value: reason, enumerable: true});
  }

  /**
   * Returns true if this state is an unstarted state (i.e. not completed, not rejected and has no error); false otherwise
   * @returns {boolean} true if unstarted; false otherwise
   */
  get unstarted() {
    return !this.completed && !this.rejected && !this.error;
  }

  /**
   * Returns true if this state is an incomplete state (i.e. not completed and not rejected); false otherwise
   * @returns {boolean} true if incomplete; false otherwise
   */
  get incomplete() {
    return !this.completed && !this.rejected;
  }

  /**
   * Returns true if this state is a failed state (i.e. not completed, not rejected, but has an error); false otherwise.
   * @return {boolean} true if failed; false otherwise.
   */
  get failed() {
    return !this.completed && !this.rejected && !!this.error;
  }

  /**
   * Returns true if this state is a finalised state (i.e. either completed or rejected); false otherwise
   * @returns {boolean} true if a finalised state; false otherwise
   */
  get finalised() {
    return this.completed || this.rejected;
  }

  /**
   * Returns true if this state is an instance of Failure; false otherwise.
   * @return {boolean} true if this state is an instance of Failure; false otherwise.
   */
  isFailure() {
    return this instanceof Failure;
  }

  /**
   * Returns true if this state is an instance of Success; false otherwise.
   * @return {boolean} true if this state is SUCCEEDED or an instance of Success; false otherwise.
   */
  isSuccess() {
    return this === SUCCEEDED || this instanceof Success;
  }

  /**
   * Returns true if this state is an instance of Rejection; false otherwise.
   * @return {boolean} true if this state is an instance of Rejection; false otherwise.
   */
  isRejection() {
    return this instanceof Rejection;
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
    super(UNSTARTED_CODE, false, undefined, false, undefined);
  }
}

/**
 * A TaskState subclass for a successful state of a task or operation.
 * Success sub-states are all marked as completed successfully (with no errors and no rejection reasons).
 *
 * @param {string} code - the descriptive code of the state
 */
class Success extends TaskState {
  constructor(code) {
    super(code, true, undefined, false, undefined);
  }
}

/**
 * A TaskState subclass for a failure state of a task or operation.
 *
 * Failure sub-states are all marked as NOT completed (and NOT rejected) with the error that occurred. They indicate
 * that a task failed, but that the failure was not an unretryable error and that the task should be reattempted again
 * later.
 *
 * @param {string} code - the descriptive code of the state
 * @param {Error|string|undefined} error - an optional error
 */
class Failure extends TaskState {
  constructor(code, error) {
    super(code, false, error, false, undefined);
  }
}

/**
 * A TaskState subclass for a rejection state of a task or operation.
 *
 * Rejection subclasses are all marked as rejected (and NOT completed) with a reason and an optional error. They
 * indicate that a task was rejected during execution for some reason (or some unretryable failure) and cannot be
 * reattempted.
 *
 * @param {string} code - the descriptive code of the state
 * @param {string} reason - the reason for rejecting a task
 * @param {Error|string|undefined} error - an optional error
 */
class Rejection extends TaskState {
  constructor(code, reason, error) {
    super(code, false, error, true, reason);
  }
}

/**
 * A Success subclass with a state and code of 'Succeeded'.
 * Succeeded states are all marked as completed successfully (with no errors and no rejection reasons).
 */
class Succeeded extends Success {
  constructor() {
    super(SUCCEEDED_CODE);
  }
}

/**
 * A Failure subclass with a state and code of 'Failed'.
 *
 * Failed states are all marked as NOT completed (and NOT rejected) with the error that occurred. As with its Failure
 * super-state, this state indicates that a task failed, but that the failure was not an unretryable error and that the
 * task should be reattempted again later.
 *
 * @param {Error|string} error - the error that occurred that triggered this Failed state
 */
class Failed extends Failure {
  constructor(error) {
    super(FAILED_CODE, error);
  }
}

/**
 * A Rejection subclass with a state of 'Rejected'.
 *
 * Rejected states are all marked as rejected (and NOT completed) with a reason and an optional error. As with its
 * Rejection super-state, this state indicates that a task was rejected during execution for some reason (or some
 * unretryable failure) and cannot be reattempted.
 *
 * For example: a task may not be able to start or run to completion due to invalid input data and thus would never be
 * able to achieve a successful completed state, so the only recourse left is to flag it as rejected with a rejection
 * reason and optional error.
 *
 * @param {string} reason - the reason for rejecting a task
 * @param {Error|string|undefined} error - an optional error
 */
class Rejected extends Rejection {
  constructor(reason, error) {
    super(REJECTED_CODE, reason, error);
  }
}

/**
 * A Rejection subclass with a state and code of 'Discarded'.
 *
 * Discarded states are all marked as rejected (and NOT completed) with a reason and an optional error. This state
 * indicates that a task had to be discarded for some reason and cannot be reattempted.
 *
 * For example: A task that is unable to complete successfully within the maximum allowed number of attempts, is
 * discarded by flagging it as rejected with an appropriate reason and optional error.
 *
 * @param {string} reason - the reason for rejecting this task
 * @param {Error|string|undefined} error - an optional error
 */
class Discarded extends Rejection {
  constructor(reason, error) {
    super(DISCARDED_CODE, reason, error);
  }
}

/**
 * A Rejection subclass with a state of 'Abandoned'.
 *
 * Discarded states are all marked as rejected (and NOT completed) with a reason and an optional error. This state
 * indicates that a task was abandoned for some reason.
 *
 * For example: A task may no longer need to be run after developer changes to the list of task definitions for a
 * particular process cause previous tasks to no longer appear in the new list of tasks to be completed. These orphaned
 * tasks can NEVER be completed in such as scenario and hence have to flagged as rejected with an appropriate rejection
 * reason and optional error.
 *
 * @param {string} reason - the reason for rejecting this task
 * @param {Error|string|undefined} error - an optional error
 */
class Abandoned extends Rejection {
  constructor(reason, error) {
    super(ABANDONED_CODE, reason, error);
  }
}

/**
 * A singleton for an initial unstarted state (with a code of 'Unstarted') of a task or operation whose fate has not
 * been decided yet.
 */
const UNSTARTED = new Unstarted();
// Install the constant as a static on TaskState
if (!TaskState.UNSTARTED) Object.defineProperty(TaskState, 'UNSTARTED', {value: UNSTARTED});

/**
 * A singleton for a succeeded state (with a code of 'Succeeded') of a task or operation.
 */
const SUCCEEDED = new Succeeded();
// Install the constant as a static on TaskState
if (!TaskState.SUCCEEDED) Object.defineProperty(TaskState, 'SUCCEEDED', {value: SUCCEEDED});

// Also install the code constants as statics on TaskState
if (!TaskState.UNSTARTED_CODE) Object.defineProperty(TaskState, 'UNSTARTED_CODE', {value: UNSTARTED_CODE});
if (!TaskState.SUCCEEDED_CODE) Object.defineProperty(TaskState, 'SUCCEEDED_CODE', {value: SUCCEEDED_CODE});
if (!TaskState.FAILED_CODE) Object.defineProperty(TaskState, 'FAILED_CODE', {value: FAILED_CODE});
if (!TaskState.REJECTED_CODE) Object.defineProperty(TaskState, 'REJECTED_CODE', {value: REJECTED_CODE});
if (!TaskState.DISCARDED_CODE) Object.defineProperty(TaskState, 'DISCARDED_CODE', {value: DISCARDED_CODE});
if (!TaskState.ABANDONED_CODE) Object.defineProperty(TaskState, 'ABANDONED_CODE', {value: ABANDONED_CODE});

/**
 * Constructs an appropriate TaskState instance based on the given code, completed and optional error.
 *
 * @param {string} code - the descriptive code of the state
 * @param {boolean} completed - whether or not to consider a task with this state as completed or not
 * @param {Error|string|undefined} error - an optional error
 * @param {boolean} rejected - whether or not to consider a task with this state as rejected/abandoned/discarded or not
 * @param {string|undefined} reason - an optional reason given for rejecting this task
 * @return {TaskState|Unstarted|Success|Failure|Rejection|Succeeded|Failed|Rejected|Discarded|Abandoned} the appropriate
 * TaskState instance created
 */
function toTaskState(code, completed, error, rejected, reason) {
  if (!completed && !error && !rejected && !reason) { // code === UNSTARTED_CODE &&
    return UNSTARTED;
  }
  if (code === SUCCEEDED_CODE && completed && !error && !rejected && !reason) {
    return SUCCEEDED;
  }
  if (code === FAILED_CODE && !completed && error && !rejected && !reason) {
    return new Failed(error);
  }
  if (code === REJECTED_CODE && !completed && rejected) { // reason could be empty and error is optional
    return new Rejected(reason, error);
  }
  if (code === DISCARDED_CODE && !completed && rejected) { // reason could be empty and error is optional
    return new Discarded(reason, error);
  }
  if (code === ABANDONED_CODE && !completed && rejected) { // reason could be empty and error is optional
    return new Abandoned(reason, error);
  }
  if (completed && !error && !rejected && !reason) {
    return new Success(code);
  }
  if (!completed && error && !rejected && !reason) {
    return new Failure(code, error);
  }
  if (!completed && rejected) { // reason could be empty and error is optional
    return new Rejection(code, reason, error);
  }
  return new TaskState(code, completed, error, rejected, reason);
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
    toTaskState(stateLike.code, stateLike.completed, stateLike.error, stateLike.rejected, stateLike.reason) :
    undefined;
}
// Install it as a static method too
if (!TaskState.toTaskStateFromStateLike) TaskState.toTaskStateFromStateLike = toTaskStateFromStateLike;

module.exports = {
  // TaskState constructors
  TaskState: TaskState,

  // TaskState direct subclasses
  Unstarted: Unstarted, // rather use UNSTARTED singleton
  Success: Success,
  Failure: Failure,
  Rejection: Rejection,

  // Success subclasses
  Succeeded: Succeeded, // rather use SUCCEEDED singleton

  // Failure subclasses
  Failed: Failed,

  // Rejection subclasses
  Rejected: Rejected,
  Discarded: Discarded,
  Abandoned: Abandoned,
};
