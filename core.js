'use strict';

/**
 * A core module containing enum objects, such as `StateType` and `ReturnMode`, and error subclasses for specific errors
 * that can be thrown when executing a Task.
 * @module task-utils/core
 * @author Byron du Preez
 */

/**
 * An enum for all of the valid types/kinds of states.
 * @enum {string}
 * @readonly
 */
const StateType = {
  UNSTARTED: 'UNSTARTED',
  STARTED: 'STARTED',
  COMPLETED: 'COMPLETED',
  TIMED_OUT: 'TIMED_OUT',
  FAILED: 'FAILED',
  REJECTED: 'REJECTED'
};
Object.freeze(StateType);

/**
 * ReturnMode - specifies how the value returned or error thrown by a task's `execute` function should be handled
 * @enum {string}
 * @readonly
 */
const ReturnMode = {
  /** This mode simply executes a task's `execute` function as normal and returns its value or throws its error. */
  NORMAL: 'NORMAL',
  /** This mode wraps a task's `execute` function's returned value in a {@link Success} or its thrown error in a {@link Failure}. */
  SUCCESS_OR_FAILURE: 'SUCCESS_OR_FAILURE',
  /** This mode wraps a task's `execute` function's returned value in a resolved Promise or its thrown error in a rejected Promise. */
  PROMISE: 'PROMISE'
};

/**
 * Returns true if the given return mode is a valid mode; false otherwise.
 * @param {string|*} [returnMode] - the return mode to validate
 * @returns {boolean} true if valid; false otherwise
 */
function isReturnModeValid(returnMode) {
  return returnMode === ReturnMode.PROMISE || returnMode === ReturnMode.SUCCESS_OR_FAILURE || returnMode === ReturnMode.NORMAL;
}

ReturnMode.isValid = isReturnModeValid;
Object.freeze(ReturnMode);

/**
 * An Error subclass that indicates that a task or operation timed out.
 */
class TimeoutError extends Error {
  /**
   * Constructs a new TimeoutError.
   * @param {string} message - a message for this error.
   */
  constructor(message) {
    super(message);
    Object.defineProperty(this, 'message', {writable: false, enumerable: true, configurable: false});
    Object.defineProperty(this, 'name', {value: this.constructor.name});
  }
}

/**
 * Thrown if a task cannot be executed, because it has already been frozen and hence its state cannot be updated.
 */
class FrozenError extends Error {
  constructor(message) {
    super(message);
    Object.defineProperty(this, 'message', {writable: false, enumerable: true, configurable: false});
    Object.defineProperty(this, 'name', {value: this.constructor.name});
  }
}

/**
 * Thrown if a task cannot be executed, because it is already fully finalised.
 */
class FinalisedError extends Error {
  constructor(message) {
    super(message);
    Object.defineProperty(this, 'message', {writable: false, enumerable: true, configurable: false});
    Object.defineProperty(this, 'name', {value: this.constructor.name});
  }
}

module.exports = {
  // Enums
  StateType: StateType,
  ReturnMode: ReturnMode,

  // Error subclasses
  TimeoutError: TimeoutError,
  FrozenError: FrozenError,
  FinalisedError: FinalisedError
};

