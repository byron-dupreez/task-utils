'use strict';

/**
 * Error subclasses for specific errors that can be thrown when executing a Task.
 * @module task-utils/errors
 * @author Byron du Preez
 */

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
  TimeoutError: TimeoutError,
  FrozenError: FrozenError,
  FinalisedError: FinalisedError
};

