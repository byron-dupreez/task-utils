'use strict';

/**
 * Unit tests for task-utils/errors.js
 * @author Byron du Preez
 */

const test = require("tape");

const errors = require('../errors');
// Error constructors
const TimeoutError = errors.TimeoutError;
const FrozenError = errors.FrozenError;
const FinalisedError = errors.FinalisedError;

test(`TimeoutError constructor`, t => {
  const msg = 'Tick, tock, ..., BEEP';
  const timeoutError = new TimeoutError(msg);
  t.ok(timeoutError, 'TimeoutError must be defined');
  t.equal(timeoutError.message, msg, `TimeoutError message must be ${msg}`);
  t.equal(timeoutError.name, 'TimeoutError', `TimeoutError name must be TimeoutError`);
  t.end();
});

test(`FrozenError constructor`, t => {
  const msg = 'Brr';
  const timeoutError = new FrozenError(msg);
  t.ok(timeoutError, 'FrozenError must be defined');
  t.equal(timeoutError.message, msg, `FrozenError message must be ${msg}`);
  t.equal(timeoutError.name, 'FrozenError', `FrozenError name must be FrozenError`);
  t.end();
});

test(`FinalisedError constructor`, t => {
  const msg = 'Too late ... done';
  const timeoutError = new FinalisedError(msg);
  t.ok(timeoutError, 'FinalisedError must be defined');
  t.equal(timeoutError.message, msg, `FinalisedError message must be ${msg}`);
  t.equal(timeoutError.name, 'FinalisedError', `FinalisedError name must be FinalisedError`);
  t.end();
});

