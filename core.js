'use strict';

const errors = require('core-functions/errors');
const setTypeName = errors.setTypeName;

/**
 * A core module containing enum objects, such as `StateType` and `ReturnMode`, and error subclasses for specific errors
 * that can be thrown when executing a Task.
 * @module task-utils/core
 * @author Byron du Preez
 */
exports._ = '_'; //IDE workaround

// External Error subclasses re-exported for convenience
exports.TimeoutError = errors.TimeoutError;

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

/** State types ordered from "least" advanced to "most" advanced state */
const ascendingStateTypes = [StateType.UNSTARTED, StateType.STARTED, StateType.FAILED, StateType.TIMED_OUT, StateType.COMPLETED, StateType.REJECTED];

/**
 * Compares state type `a` with state type `b` and returns a negative number if `a` is "less advanced" than `b`; zero if
 * `a` is as advanced as `b`; or a positive number if `a` is "more advanced" than `b`
 * @param {StateType} a - first state type to compare
 * @param {StateType} b - second state type to compare
 * @returns {number} a negative number if `a` is "less advanced" than `b`; zero if `a` is as advanced as `b`; or a
 * positive number if `a` is "more advanced" than `b`
 */
function compareStateTypes(a, b) {
  const aPos = a ? ascendingStateTypes.indexOf(a) : -1;
  const bPos = b ? ascendingStateTypes.indexOf(b) : -1;
  return aPos - bPos;
}

StateType.compareStateTypes = compareStateTypes;
Object.freeze(StateType);
exports.StateType = StateType;

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
exports.ReturnMode = ReturnMode;

/**
 * Thrown if a task cannot be executed, because it has already been frozen and hence its state cannot be updated.
 */
class FrozenError extends Error {
  constructor(message) {
    super(message);
    setTypeName(this.constructor);
  }

  toJSON() {
    return errors.toJSON(this);
  }
}

exports.FrozenError = FrozenError;

/**
 * Thrown if a task cannot be executed, because it is already fully finalised.
 */
class FinalisedError extends Error {
  constructor(message) {
    super(message);
    setTypeName(this.constructor);
  }

  toJSON() {
    return errors.toJSON(this);
  }
}

exports.FinalisedError = FinalisedError;