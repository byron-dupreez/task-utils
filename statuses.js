'use strict';

/**
 * Classes and utilities for defining the status of a task or operation.
 * @module task-utils/statuses
 * @author Byron du Preez
 */

const INCOMPLETE_CODE = `Incomplete`;
const SUCCEEDED_CODE = `Succeeded`;
const FAILED_CODE = `Failed`;

/**
 * The base class for a status of a task or operation.
 */
class Status {
  /**
   * Constructs a Status.
   * @param {string} code the descriptive code of the status
   * @param {boolean} completed whether or not to consider a task with this status as completed or not
   * @param {Error|undefined} error an optional error
   */
  constructor(code, completed, error) {
    // create each properties as read-only (writable: false and configurable: false are defaults)
    Object.defineProperty(this, 'code', {value: code, enumerable: true});
    Object.defineProperty(this, 'completed', {value: !!completed, enumerable: true}); // !! deals with being given a non-boolean completed
    Object.defineProperty(this, 'error', {value: error, enumerable: true});

    // this.code = code;
    // this.completed = !!completed; // !! deals with being given a non-boolean completed
    // if (error) this.error = error;
    // return Object.freeze(this);
  }

}

/**
 * A subclass for an initial incomplete status of a task or operation whose fate has not been decided yet.
 */
class Incomplete extends Status {
  constructor() {
    super(INCOMPLETE_CODE, false, undefined);
  }
}

/**
 * A subclass for a successful status of a task or operation.
 */
class Success extends Status {
  constructor(code) {
    super(code, true, undefined);
  }
}

/**
 * A subclass for a failure status of a task or operation.
 */
class Failure extends Status {
  constructor(code, error) {
    super(code, false, error);
  }
}

/**
 * A SuccessStatus with a status of 'Succeeded'.
 */
class Succeeded extends Success {
  constructor() {
    super(SUCCEEDED_CODE);
  }
}

/**
 * A FailureStatus with a status of 'Failed'.
 */
class Failed extends Failure {
  constructor(error) {
    super(FAILED_CODE, error);
  }
}

/**
 * A singleton for a succeeded status (with a code of 'Succeeded') of a task or operation.
 */
const SUCCEEDED = new Succeeded();

/**
 * A singleton for an initial incomplete status (with a code of 'Incomplete') of a task or operation whose fate has not
 * been decided yet.
 */
const INCOMPLETE = new Incomplete();


/**
 * Constructs an appropriate Status instance based on the given status, completed and optional error.
 * @param {string} code the descriptive code of the status
 * @param {boolean} completed whether or not to consider a task with this status as completed or not
 * @param {Error|undefined} error an optional error
 * @return {Status|Success|Failure|Succeeded|Failed} the appropriate Status instance created
 */
function toStatus(code, completed, error) {
  if (code === INCOMPLETE_CODE && !completed && !error)
    return INCOMPLETE;
  if (code === SUCCEEDED_CODE && completed && !error)
    return SUCCEEDED;
  if (code === FAILED_CODE && !completed && error)
    return new Failed(error);
  if (completed && !error)
    return new Success(code);
  if (!completed && error) {
    return new Failure(code, error);
  }
  return new Status(code, completed, error);
}

/**
 * Returns true if the given status is defined and completed; false otherwise.
 * @param {Status|undefined} status the status to check
 * @return {*|boolean} true if the given status is defined and completed; false otherwise.
 */
function isStatusCompleted(status) {
  return status && status.completed;
}

/**
 * Returns true if the given status is INCOMPLETE or an instance of Incomplete; false otherwise.
 *
 * NB: This is NOT the negation of the isStatusCompleted function above.
 *
 * @param {Status|undefined} status the status to check
 * @return {*|boolean} true if the given status is INCOMPLETE or an instance of Incomplete; false otherwise.
 */
function isIncompleteStatus(status) {
  return status === INCOMPLETE || status instanceof Incomplete;
}

/**
 * Returns true if the given status is an instance of Failure; false otherwise.
 * @param {Status|undefined} status the status to check
 * @return {*|boolean} true if the given status is an instance of Failure; false otherwise.
 */
function isFailureStatus(status) {
  return status instanceof Failure;
}

/**
 * Returns true if the given status is an instance of Success; false otherwise.
 * @param {Status|undefined} status the status to check
 * @return {*|boolean} true if the given status is SUCCEEDED or an instance of Success; false otherwise.
 */
function isSuccessStatus(status) {
  return status === SUCCEEDED || status instanceof Success;
}

module.exports = {
  // Standard status codes
  INCOMPLETE_CODE: INCOMPLETE_CODE,
  SUCCEEDED_CODE: SUCCEEDED_CODE,
  FAILED_CODE: FAILED_CODE,

  // Status singletons
  INCOMPLETE: INCOMPLETE,
  SUCCEEDED: SUCCEEDED,

  // Status constructors
  Status: Status,
  Incomplete: Incomplete, // rather use INCOMPLETE singleton
  Success: Success,
  Failure: Failure,
  Succeeded: Succeeded, // rather use SUCCEEDED singleton
  Failed: Failed,
  toStatus: toStatus,

  // Checks against the status' completed flag
  isStatusCompleted: isStatusCompleted,

  // Checks against the type of the status
  isIncompleteStatus: isIncompleteStatus,
  isFailureStatus: isFailureStatus,
  isSuccessStatus: isSuccessStatus
};
