'use strict';

/**
 * Unit tests for task-utils/states.js
 * @author Byron du Preez
 */

const test = require("tape");

const states = require('../task-states');
// TaskState constructors
const TaskState = states.TaskState;
// TaskState direct subclasses
const Unstarted = states.Unstarted; // rather use UNSTARTED singleton
const Success = states.Success;
const Failure = states.Failure;
const Rejection = states.Rejection;
// Success subclasses
const Succeeded = states.Succeeded; // rather use SUCCEEDED singleton
// Failure subclasses
const Failed = states.Failed;
// Rejection subclasses
const Rejected = states.Rejected;
const Discarded = states.Discarded;
const Abandoned = states.Abandoned;

// Standard state codes
const UNSTARTED_CODE = TaskState.UNSTARTED_CODE;
const SUCCEEDED_CODE = TaskState.SUCCEEDED_CODE;
const FAILED_CODE = TaskState.FAILED_CODE;
const REJECTED_CODE = TaskState.REJECTED_CODE;
const DISCARDED_CODE = TaskState.DISCARDED_CODE;
const ABANDONED_CODE = TaskState.ABANDONED_CODE;
// TaskState singletons
const UNSTARTED = TaskState.UNSTARTED;
const SUCCEEDED = TaskState.SUCCEEDED;
// Utility to convert fields into an appropriate state
const toTaskState = TaskState.toTaskState;
const toTaskStateFromStateLike = TaskState.toTaskStateFromStateLike;

// // Checks against the state's completed flag
// // Checks against the state's rejected flag
// // Checks against the type of the state
// const isUnstarted = states.isUnstarted;
// const isFailure = states.isFailure;
// const isSuccess = states.isSuccess;
// const isRejection = states.isRejection;


function ensureImmutable(state, assert) {
  if (state) {
    try {
      state.code = 'Cannot be changed';
      assert.fail(`${JSON.stringify(state)} code is supposed to be immutable`);
    } catch (err) {
      // Expect an error on attempted mutation of immutable property
      assert.pass(`${JSON.stringify(state)} code is immutable`);
      //console.log(`Expected error ${err}`);
    }

    try {
      state.completed = !state.completed;
      assert.fail(`${JSON.stringify(state)} completed is supposed to be immutable`);
    } catch (err) {
      // Expect an error on attempted mutation of immutable property
      assert.pass(`${JSON.stringify(state)} completed is immutable`);
      //console.log(`Expected error ${err}`);
    }

    try {
      state.error = new Error("Boom");
      assert.fail(`${JSON.stringify(state)} error is supposed to be immutable`);
    } catch (err) {
      // Expect an error on attempted mutation of immutable property
      assert.pass(`${JSON.stringify(state)} error is immutable`);
      //console.log(`Expected error ${err}`);
    }

    try {
      state.rejected = !state.rejected;
      assert.fail(`${JSON.stringify(state)} rejected is supposed to be immutable`);
    } catch (err) {
      // Expect an error on attempted mutation of immutable property
      assert.pass(`${JSON.stringify(state)} rejected is immutable`);
      //console.log(`Expected error ${err}`);
    }

    try {
      state.reason = "We're not gonna take it";
      assert.fail(`${JSON.stringify(state)} reason is supposed to be immutable`);
    } catch (err) {
      // Expect an error on attempted mutation of immutable property
      assert.pass(`${JSON.stringify(state)} reason is immutable`);
      //console.log(`Expected error ${err}`);
    }

    // If we don't use Object.freeze and instead use Object.defineProperty to make TaskState properties read-only, then we
    // don't block adding properties to TaskState and this check will fail
    // try {
    //   state.newProperty = 'New property value';
    //   assert.fail(`${JSON.stringify(state)} is supposed to be frozen`);
    // } catch (err) {
    //   // Expect an error on attempted mutation of immutable property
    //   console.log(`Expected error ${err}`);
    // }
  }
}

function checkToTaskStateFromStateLike(code, completed, error, rejected, reason) {
  const stateLike = {
    code: code,
    completed: completed,
    error: error,
    rejected: rejected,
    reason: reason
  };
  return toTaskStateFromStateLike(stateLike);
}

// =====================================================================================================================
// TaskState oddities
// =====================================================================================================================

test('Construct completed TaskState instance', t => {
  const code = 'MyCode1';
  const state = new TaskState(code, true, undefined, false, undefined);
  t.ok(state, 'TaskState must be defined');
  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, true, 'must be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

test('Construct completed TaskState instance with error', t => {
  const code = 'MyCode2';
  const err = new Error('Badoom2');
  const state = new TaskState(code, true, err, false, undefined);
  t.ok(state, 'TaskState must be defined');
  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

test('Construct rejected TaskState instance with reason & no error', t => {
  const code = 'MyCode2';
  const reason = 'Not sure';
  const state = new TaskState(code, false, undefined, true, reason);
  t.ok(state, 'TaskState must be defined');
  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  ensureImmutable(state, t);
  t.end();
});

test('Construct rejected TaskState instance with reason & error', t => {
  const code = 'MyCode2';
  const err = new Error('Badoom2');
  const reason = 'Not sure';
  const state = new TaskState(code, false, err, true, reason);
  t.ok(state, 'TaskState must be defined');
  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  ensureImmutable(state, t);
  t.end();
});

test('Construct unstarted TaskState instance', t => {
  var code = 'MyCode3';
  const state = new TaskState(code, false, undefined, false, undefined);
  t.ok(state, 'TaskState must be defined');
  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

test('Construct unstarted TaskState instance with error', t => {
  const code = 'MyCode4';
  const err = new Error('Badoom4');
  const state = new TaskState(code, false, err, false, undefined);
  t.ok(state, 'TaskState must be defined');
  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// Success
// =====================================================================================================================

test('Construct Success instance', t => {
  const code = 'MyCode5';
  const state = new Success(code);
  t.ok(state, 'Success must be defined');
  t.ok(state instanceof Success, 'must be instanceof Success');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, true, 'must be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// Failure
// =====================================================================================================================

test('Construct Failure instance', t => {
  const code = 'MyCode6';
  const err = new Error('Badoom6');
  const state = new Failure(code, err);
  t.ok(state, 'Failure must be defined');
  t.ok(state instanceof Failure, 'must be instanceof Failure');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// Rejection
// =====================================================================================================================

test('Construct Rejection instance', t => {
  const code = 'MyCode6';
  const reason = 'Reason1';
  const err = new Error('Badoom77');
  const state = new Rejection(code, reason, err);
  t.ok(state, 'Rejection must be defined');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Failure, 'must NOT be instanceof Failure');
  t.notOk(state instanceof Success, 'must NOT be instanceof Success');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// UNSTARTED
// =====================================================================================================================

test('UNSTARTED singleton', t => {
  const state = UNSTARTED;
  t.ok(state, 'UNSTARTED must be defined');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.code, UNSTARTED_CODE, `code must be ${UNSTARTED_CODE}`);
  t.equal(state.completed, false, 'must not be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// Unstarted
// =====================================================================================================================

test('Construct an Unstarted TaskState instance', t => {
  const state = new Unstarted();
  t.ok(state, 'Unstarted must be defined');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.code, UNSTARTED_CODE, `code must be ${UNSTARTED_CODE}`);
  t.equal(state.completed, false, 'must not be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// SUCCEEDED
// =====================================================================================================================

test('SUCCEEDED singleton', t => {
  const state = SUCCEEDED;
  t.ok(state, 'SUCCEEDED must be defined');
  t.ok(state instanceof Succeeded, 'must be instanceof Succeeded');
  t.ok(state instanceof Success, 'must be instanceof Success');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.code, SUCCEEDED_CODE, `code must be ${SUCCEEDED_CODE}`);
  t.equal(state.completed, true, 'must be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// Succeeded
// =====================================================================================================================

test('Construct Succeeded instance', t => {
  const state = new Succeeded();
  t.ok(state, 'Succeeded must be defined');
  t.ok(state instanceof Succeeded, 'must be instanceof Succeeded');
  t.ok(state instanceof Success, 'must be instanceof Success');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.code, SUCCEEDED_CODE, `code must be ${SUCCEEDED_CODE}`);
  t.equal(state.completed, true, 'must be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// Failed
// =====================================================================================================================

test('Construct Failed instance', t => {
  const err = new Error('Badoom7');
  const state = new Failed(err);
  t.ok(state, 'Failed must be defined');
  t.ok(state instanceof Failed, 'must be instanceof Failed');
  t.ok(state instanceof Failure, 'must be instanceof Failure');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.code, FAILED_CODE, `code must be ${FAILED_CODE}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// Rejected
// =====================================================================================================================

test('Construct Rejected instance', t => {
  const err = new Error('Badoom7');
  const reason = 'Why not?';
  const state = new Rejected(reason, err);
  t.ok(state, 'Rejected must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.ok(state instanceof Rejected, 'must be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');
  t.equal(state.code, REJECTED_CODE, `code must be ${REJECTED_CODE}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.ok(state.reason, 'must have reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// Discarded
// =====================================================================================================================

test('Construct Discarded instance', t => {
  const err = new Error('Badoom7');
  const reason = 'Why not?';
  const state = new Discarded(reason, err);
  t.ok(state, 'Discarded must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.ok(state instanceof Discarded, 'must be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');
  t.equal(state.code, DISCARDED_CODE, `code must be ${DISCARDED_CODE}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.ok(state.reason, 'must have reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// Abandoned
// =====================================================================================================================

test('Construct Abandoned instance', t => {
  const err = new Error('Badoom7');
  const reason = 'Why not?';
  const state = new Abandoned(reason, err);
  t.ok(state, 'Abandoned must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.ok(state instanceof Abandoned, 'must be instanceof Abandoned');
  t.equal(state.code, ABANDONED_CODE, `code must be ${ABANDONED_CODE}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.ok(state.reason, 'must have reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike
// =====================================================================================================================

test('toTaskState with code, completed, error, not rejected & no reason must be TaskState', t => {
  const code = 'MyCode1';
  const err = new Error('Badoom7');
  const state = toTaskState(code, true, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskState with code, completed, no error, rejected and no reason must be TaskState', t => {
  const code = 'MyCode1';
  const err = new Error('Badoom7');
  const state = toTaskState(code, true, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskState with code "Unstarted"", not completed, no error, not rejected & no reason must be Unstarted', t => {
  const code = UNSTARTED_CODE;
  const state = toTaskState(code, false, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskState with any code, not completed, no error, not rejected & no reason must be Unstarted', t => {
  const code = 'Anything';
  const state = toTaskState(code, false, undefined, false, undefined);

  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, UNSTARTED_CODE, `code must be ${UNSTARTED_CODE}`);
  t.equal(state.completed, false, 'must not be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskState with code, completed, no error, not rejected & no reason must be Success', t => {
  const code = 'MyCode2';
  const state = toTaskState(code, true, undefined, false, undefined);
  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');

  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.ok(state instanceof Success, 'must be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, true, 'must be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskState with code "Succeeded", completed, no error, not rejected & no reason  must be Succeeded', t => {
  const code = SUCCEEDED_CODE;
  const state = toTaskState(code, true, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.ok(state instanceof Success, 'must be instanceof Success');
  t.ok(state instanceof Succeeded, 'must be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, true, 'must be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskState with code, not completed, error, not rejected & no reason must be Failure', t => {
  const code = 'MyCode33';
  const err = new Error('Badoom99');
  const state = toTaskState(code, false, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(state instanceof Failure, 'must be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskState with code "Failed"", not completed, error, not rejected & no reason must be Failure', t => {
  const code = FAILED_CODE;
  const err = new Error('Badoom88');
  const state = toTaskState(code, false, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(state instanceof Failure, 'must be instanceof Failure');
  t.ok(state instanceof Failed, 'must be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskState with code, not completed, error, rejected & no reason must be Rejection', t => {
  const code = 'MyCode33';
  const err = new Error('Badoom99');
  const state = toTaskState(code, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskState with code "Rejected"", not completed, error, rejected & no reason must be Rejected', t => {
  const code = REJECTED_CODE;
  const err = new Error('Badoom88');
  const state = toTaskState(code, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.ok(state instanceof Rejected, 'must be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskState with code "Rejected"", not completed, no error, rejected & reason must be Rejected', t => {
  const code = REJECTED_CODE;
  const reason = 'Reason2';
  const state = toTaskState(code, false, undefined, true, reason);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.ok(state instanceof Rejected, 'must be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  t.end();
});

test('toTaskState with code "Discarded"", not completed, error, rejected & no reason must be Discarded', t => {
  const code = DISCARDED_CODE;
  const err = new Error('Badoom88');
  const state = toTaskState(code, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.ok(state instanceof Discarded, 'must be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskState with code "Discarded"", not completed, no error, rejected & no reason must be Discarded', t => {
  const code = DISCARDED_CODE;
  const state = toTaskState(code, false, undefined, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.ok(state instanceof Discarded, 'must be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.notOk(state.error, 'error must be undefined');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskState with code "Abandoned"", not completed, error, rejected & no reason must be Abandoned', t => {
  const code = ABANDONED_CODE;
  const err = new Error('Badoom88');
  const state = toTaskState(code, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.ok(state instanceof Abandoned, 'must be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskState with code "Abandoned"", not completed, error, rejected & reason must be Abandoned', t => {
  const code = ABANDONED_CODE;
  const err = new Error('Badoom88');
  const reason = 'Reason3';
  const state = toTaskState(code, false, err, true, reason);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.ok(state instanceof Abandoned, 'must be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike
// =====================================================================================================================

test('toTaskStateFromStateLike with code, completed, error, not rejected & no reason must be TaskState', t => {
  const code = 'MyCode1';
  const err = new Error('Badoom7');
  const state = checkToTaskStateFromStateLike(code, true, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with code, completed, no error, rejected and no reason must be TaskState', t => {
  const code = 'MyCode1';
  const err = new Error('Badoom7');
  const state = checkToTaskStateFromStateLike(code, true, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with code "Unstarted"", not completed, no error, not rejected & no reason must be Unstarted', t => {
  const code = UNSTARTED_CODE;
  const state = checkToTaskStateFromStateLike(code, false, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with any code, not completed, no error, not rejected & no reason must be Unstarted', t => {
  const code = 'Anything';
  const state = checkToTaskStateFromStateLike(code, false, undefined, false, undefined);

  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, UNSTARTED_CODE, `code must be ${UNSTARTED_CODE}`);
  t.equal(state.completed, false, 'must not be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});



test('toTaskStateFromStateLike with code, completed, no error, not rejected & no reason must be Success', t => {
  const code = 'MyCode2';
  const state = checkToTaskStateFromStateLike(code, true, undefined, false, undefined);
  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');

  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.ok(state instanceof Success, 'must be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, true, 'must be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with code "Succeeded", completed, no error, not rejected & no reason  must be Succeeded', t => {
  const code = SUCCEEDED_CODE;
  const state = checkToTaskStateFromStateLike(code, true, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.ok(state instanceof Success, 'must be instanceof Success');
  t.ok(state instanceof Succeeded, 'must be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, true, 'must be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with code, not completed, error, not rejected & no reason must be Failure', t => {
  const code = 'MyCode33';
  const err = new Error('Badoom99');
  const state = checkToTaskStateFromStateLike(code, false, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(state instanceof Failure, 'must be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with code "Failed"", not completed, error, not rejected & no reason must be Failure', t => {
  const code = FAILED_CODE;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromStateLike(code, false, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(state instanceof Failure, 'must be instanceof Failure');
  t.ok(state instanceof Failed, 'must be instanceof Failed');
  t.notOk(state instanceof Rejection, 'must not be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with code, not completed, error, rejected & no reason must be Rejection', t => {
  const code = 'MyCode33';
  const err = new Error('Badoom99');
  const state = checkToTaskStateFromStateLike(code, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskStateFromStateLike with code "Rejected"", not completed, error, rejected & no reason must be Rejected', t => {
  const code = REJECTED_CODE;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromStateLike(code, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.ok(state instanceof Rejected, 'must be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskStateFromStateLike with code "Rejected"", not completed, no error, rejected & reason must be Rejected', t => {
  const code = REJECTED_CODE;
  const reason = 'Reason2';
  const state = checkToTaskStateFromStateLike(code, false, undefined, true, reason);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.ok(state instanceof Rejected, 'must be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  t.end();
});

test('toTaskStateFromStateLike with code "Discarded"", not completed, error, rejected & no reason must be Discarded', t => {
  const code = DISCARDED_CODE;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromStateLike(code, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.ok(state instanceof Discarded, 'must be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskStateFromStateLike with code "Discarded"", not completed, no error, rejected & no reason must be Discarded', t => {
  const code = DISCARDED_CODE;
  const state = checkToTaskStateFromStateLike(code, false, undefined, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.ok(state instanceof Discarded, 'must be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.notOk(state.error, 'error must be undefined');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskStateFromStateLike with code "Abandoned"", not completed, error, rejected & no reason must be Abandoned', t => {
  const code = ABANDONED_CODE;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromStateLike(code, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.ok(state instanceof Abandoned, 'must be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskStateFromStateLike with code "Abandoned"", not completed, error, rejected & reason must be Abandoned', t => {
  const code = ABANDONED_CODE;
  const err = new Error('Badoom88');
  const reason = 'Reason3';
  const state = checkToTaskStateFromStateLike(code, false, err, true, reason);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Success');
  t.notOk(state instanceof Success, 'must not be instanceof Success');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof Failure, 'must not be instanceof Failure');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof Rejection, 'must be instanceof Rejection');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.ok(state instanceof Abandoned, 'must be instanceof Abandoned');

  t.equal(state.code, code, 'code must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  t.end();
});
