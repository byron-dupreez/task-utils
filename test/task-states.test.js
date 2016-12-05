'use strict';

/**
 * Unit tests for task-utils/states.js
 * @author Byron du Preez
 */

const test = require("tape");

const states = require('../task-states');
// TimeoutError constructor
const TimeoutError = states.TimeoutError;
// TaskState constructors
const TaskState = states.TaskState;
// TaskState direct subclasses
const Unstarted = states.Unstarted; // rather use UNSTARTED singleton
const CompletedState = states.CompletedState;
const TimedOutState = states.TimedOutState;
const FailedState = states.FailedState;
const RejectedState = states.RejectedState;
// CompletedState subclasses
const Completed = states.Completed; // rather use COMPLETED singleton
const Succeeded = states.Succeeded; // rather use SUCCEEDED singleton
// Timeout subclasses
const TimedOut = states.TimedOut;
// FailedState subclasses
const Failed = states.Failed;
// RejectedState subclasses
const Rejected = states.Rejected;
const Discarded = states.Discarded;
const Abandoned = states.Abandoned;

// Standard state names
const UNSTARTED_NAME = TaskState.UNSTARTED_NAME;
const COMPLETED_NAME = TaskState.COMPLETED_NAME;
const SUCCEEDED_NAME = TaskState.SUCCEEDED_NAME;
const TIMED_OUT_NAME = TaskState.TIMED_OUT_NAME;
const FAILED_NAME = TaskState.FAILED_NAME;
const REJECTED_NAME = TaskState.REJECTED_NAME;
const DISCARDED_NAME = TaskState.DISCARDED_NAME;
const ABANDONED_NAME = TaskState.ABANDONED_NAME;
// TaskState singletons
const UNSTARTED = TaskState.UNSTARTED;
const COMPLETED = TaskState.COMPLETED;
const SUCCEEDED = TaskState.SUCCEEDED;
// Utility to convert fields into an appropriate state
const toTaskState = TaskState.toTaskState;
const toTaskStateFromStateLike = TaskState.toTaskStateFromStateLike;


function ensureImmutable(state, assert) {
  if (state) {
    try {
      state.name = 'Cannot be changed';
      assert.fail(`${JSON.stringify(state)} name is supposed to be immutable`);
    } catch (err) {
      // Expect an error on attempted mutation of immutable property
      assert.pass(`${JSON.stringify(state)} name is immutable`);
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
      state.timedOut = !state.timedOut;
      assert.fail(`${JSON.stringify(state)} timedOut is supposed to be immutable`);
    } catch (err) {
      // Expect an error on attempted mutation of immutable property
      assert.pass(`${JSON.stringify(state)} timedOut is immutable`);
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

function checkToTaskStateFromStateLike(name, completed, timedOut, error, rejected, reason) {
  const stateLike = {
    name: name,
    completed: completed,
    timedOut: timedOut,
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
  const name = 'MyState1';
  const state = new TaskState(name, true, false, undefined, false, undefined);
  t.ok(state, 'TaskState must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

test('Construct completed TaskState instance with error', t => {
  const name = 'MyState2';
  const err = new Error('Badoom2');
  const state = new TaskState(name, true, false, err, false, undefined);
  t.ok(state, 'TaskState must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

test('Construct rejected TaskState instance with reason & no error', t => {
  const name = 'MyState2';
  const reason = 'Not sure';
  const state = new TaskState(name, false, false, undefined, true, reason);
  t.ok(state, 'TaskState must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  ensureImmutable(state, t);
  t.end();
});

test('Construct rejected TaskState instance with reason & error', t => {
  const name = 'MyState2';
  const err = new Error('Badoom2');
  const reason = 'Not sure';
  const state = new TaskState(name, false, false, err, true, reason);
  t.ok(state, 'TaskState must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  ensureImmutable(state, t);
  t.end();
});

test('Construct unstarted TaskState instance', t => {
  var name = 'MyState3';
  const state = new TaskState(name, false, false, undefined, false, undefined);
  t.ok(state, 'TaskState must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

test('Construct unstarted TaskState instance with error', t => {
  const name = 'MyState4';
  const err = new Error('Badoom4');
  const state = new TaskState(name, false, false, err, false, undefined);
  t.ok(state, 'TaskState must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// CompletedState
// =====================================================================================================================

test('Construct CompletedState instance', t => {
  const name = 'MyState5';
  const state = new CompletedState(name);
  t.ok(state, 'CompletedState must be defined');
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// TimedOutState
// =====================================================================================================================

test('Construct TimedOutState instance without error', t => {
  const name = 'MyState77';
  const state = new TimedOutState(name);
  t.ok(state, 'TimedOutState must be defined');
  t.ok(state instanceof TimedOutState, 'must be instanceof TimedOutState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, undefined, 'error must undefined');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

test('Construct TimedOutState instance with error', t => {
  const name = 'MyState77';
  const err = new Error('Badoom6');
  const state = new TimedOutState(name, err);
  t.ok(state, 'TimedOutState must be defined');
  t.ok(state instanceof TimedOutState, 'must be instanceof TimedOutState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// FailedState
// =====================================================================================================================

test('Construct FailedState instance', t => {
  const name = 'MyState6';
  const err = new Error('Badoom6');
  const state = new FailedState(name, err);
  t.ok(state, 'FailedState must be defined');
  t.ok(state instanceof FailedState, 'must be instanceof FailedState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// RejectedState
// =====================================================================================================================

test('Construct RejectedState instance', t => {
  const name = 'MyState6';
  const reason = 'Reason1';
  const err = new Error('Badoom77');
  const state = new RejectedState(name, reason, err);
  t.ok(state, 'RejectedState must be defined');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');
  t.notOk(state instanceof CompletedState, 'must NOT be instanceof CompletedState');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof FailedState, 'must NOT be instanceof FailedState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
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
  t.equal(state.name, UNSTARTED_NAME, `name must be ${UNSTARTED_NAME}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
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
  t.equal(state.name, UNSTARTED_NAME, `name must be ${UNSTARTED_NAME}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// COMPLETED
// =====================================================================================================================

test('COMPLETED singleton', t => {
  const state = COMPLETED;
  t.ok(state, 'COMPLETED must be defined');
  t.ok(state instanceof Completed, 'must be instanceof Completed');
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, COMPLETED_NAME, `name must be ${COMPLETED_NAME}`);
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// Completed
// =====================================================================================================================

test('Construct Completed instance', t => {
  const state = new Completed();
  t.ok(state, 'Completed must be defined');
  t.ok(state instanceof Completed, 'must be instanceof Completed');
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, COMPLETED_NAME, `name must be ${COMPLETED_NAME}`);
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
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
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, SUCCEEDED_NAME, `name must be ${SUCCEEDED_NAME}`);
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
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
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, SUCCEEDED_NAME, `name must be ${SUCCEEDED_NAME}`);
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// TimedOut
// =====================================================================================================================

test('Construct TimedOut instance without an error', t => {
  const state = new TimedOut();
  t.ok(state, 'TimedOut must be defined');
  t.ok(state instanceof TimedOut, 'must be instanceof TimedOut');
  t.ok(state instanceof TimedOutState, 'must be instanceof TimedOutState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, TIMED_OUT_NAME, `name must be ${TIMED_OUT_NAME}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, undefined, 'error must be undefined');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

test('Construct TimedOut instance with an error', t => {
  const err = new Error('Timeout7');
  const state = new TimedOut(err);
  t.ok(state, 'TimedOut must be defined');
  t.ok(state instanceof TimedOut, 'must be instanceof TimedOut');
  t.ok(state instanceof TimedOutState, 'must be instanceof TimedOutState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, TIMED_OUT_NAME, `name must be ${TIMED_OUT_NAME}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
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
  t.ok(state instanceof FailedState, 'must be instanceof FailedState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, FAILED_NAME, `name must be ${FAILED_NAME}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
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
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.ok(state instanceof Rejected, 'must be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');
  t.equal(state.name, REJECTED_NAME, `name must be ${REJECTED_NAME}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
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
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.ok(state instanceof Discarded, 'must be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');
  t.equal(state.name, DISCARDED_NAME, `name must be ${DISCARDED_NAME}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
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
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.ok(state instanceof Abandoned, 'must be instanceof Abandoned');
  t.equal(state.name, ABANDONED_NAME, `name must be ${ABANDONED_NAME}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.ok(state.reason, 'must have reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// toTaskState - TaskState
// =====================================================================================================================

test('toTaskState with any name, completed, not timed out, error, not rejected & no reason must be TaskState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = toTaskState(name, true, false, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskState with any name, completed, not timed out, no error, rejected and no reason must be TaskState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = toTaskState(name, true, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskState - Unstarted
// =====================================================================================================================

test('toTaskState with name "Unstarted"", not completed, not timed out, no error, not rejected & no reason must be Unstarted', t => {
  const name = UNSTARTED_NAME;
  const state = toTaskState(name, false, false, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskState with any name, not completed, not timed out, no error, not rejected & no reason must be Unstarted', t => {
  const name = 'Anything';
  const state = toTaskState(name, false, false, undefined, false, undefined);

  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, UNSTARTED_NAME, `name must be ${UNSTARTED_NAME}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskState - CompletedState
// =====================================================================================================================

test('toTaskState with any name, completed, no error, not timed out, not rejected & no reason must be CompletedState', t => {
  const name = 'MyState2';
  const state = toTaskState(name, true, false, undefined, false, undefined);
  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');

  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskState - Completed
// =====================================================================================================================

test('toTaskState with name "Completed", completed, not timed out, no error, not rejected & no reason must be Completed', t => {
  const name = COMPLETED_NAME;
  const state = toTaskState(name, true, false, undefined, false, undefined);
  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');

  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.ok(state instanceof Completed, 'must be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskState - Succeeded
// =====================================================================================================================

test('toTaskState with name "Succeeded", completed, not timed out, no error, not rejected & no reason  must be Succeeded', t => {
  const name = SUCCEEDED_NAME;
  const state = toTaskState(name, true, false, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.ok(state instanceof Succeeded, 'must be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskState - TimedOutState
// =====================================================================================================================

test('toTaskState with any name, not completed, timed out, no error, not rejected & no reason must be TimedOutState', t => {
  const name = 'MyState33';
  const state = toTaskState(name, false, true, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(state instanceof TimedOutState, 'must be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, undefined, 'error must be undefined');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskState with any name, not completed, timed out, error, not rejected & no reason must be TimedOutState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = toTaskState(name, false, true, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(state instanceof TimedOutState, 'must be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskState - TimedOut
// =====================================================================================================================

test('toTaskState with name "TimedOut"", not completed, timed out, no error, not rejected & no reason must be TimedOut', t => {
  const name = TIMED_OUT_NAME;
  const state = toTaskState(name, false, true, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(state instanceof TimedOutState, 'must be instanceof TimedOutState');
  t.ok(state instanceof TimedOut, 'must be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, undefined, 'error must be undefined');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskState with name "TimedOut"", not completed, timed out, error, not rejected & no reason must be TimedOut', t => {
  const name = TIMED_OUT_NAME;
  const err = new Error('Badoom88');
  const state = toTaskState(name, false, true, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(state instanceof TimedOutState, 'must be instanceof TimedOutState');
  t.ok(state instanceof TimedOut, 'must be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskState - FailedState
// =====================================================================================================================

test('toTaskState with any name, not completed, not timed out, error, not rejected & no reason must be FailedState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = toTaskState(name, false, false, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.ok(state instanceof FailedState, 'must be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskState - Failed
// =====================================================================================================================

test('toTaskState with name "Failed"", not completed, not timed out, error, not rejected & no reason must be Failed', t => {
  const name = FAILED_NAME;
  const err = new Error('Badoom88');
  const state = toTaskState(name, false, false, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.ok(state instanceof FailedState, 'must be instanceof FailedState');
  t.ok(state instanceof Failed, 'must be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskState - RejectedState
// =====================================================================================================================

test('toTaskState with any name, not completed, error, not timed out, rejected & no reason must be RejectedState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = toTaskState(name, false, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskState - Rejected
// =====================================================================================================================

test('toTaskState with name "Rejected"", not completed, not timed out, error, rejected & no reason must be Rejected', t => {
  const name = REJECTED_NAME;
  const err = new Error('Badoom88');
  const state = toTaskState(name, false, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.ok(state instanceof Rejected, 'must be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskState with name "Rejected"", not completed, not timed out, no error, rejected & reason must be Rejected', t => {
  const name = REJECTED_NAME;
  const reason = 'Reason2';
  const state = toTaskState(name, false, false, undefined, true, reason);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.ok(state instanceof Rejected, 'must be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  t.end();
});

// =====================================================================================================================
// toTaskState - Discarded
// =====================================================================================================================

test('toTaskState with name "Discarded"", not completed, not timed out, error, rejected & no reason must be Discarded', t => {
  const name = DISCARDED_NAME;
  const err = new Error('Badoom88');
  const state = toTaskState(name, false, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.ok(state instanceof Discarded, 'must be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskState with name "Discarded"", not completed, not timed out, no error, rejected & no reason must be Discarded', t => {
  const name = DISCARDED_NAME;
  const state = toTaskState(name, false, false, undefined, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.ok(state instanceof Discarded, 'must be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'error must be undefined');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskState - Abandoned
// =====================================================================================================================

test('toTaskState with name "Abandoned"", not completed, not timed out, error, rejected & no reason must be Abandoned', t => {
  const name = ABANDONED_NAME;
  const err = new Error('Badoom88');
  const state = toTaskState(name, false, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.ok(state instanceof Abandoned, 'must be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskState with name "Abandoned"", not completed, not timed out, error, rejected & reason must be Abandoned', t => {
  const name = ABANDONED_NAME;
  const err = new Error('Badoom88');
  const reason = 'Reason3';
  const state = toTaskState(name, false, false, err, true, reason);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.ok(state instanceof Abandoned, 'must be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - TaskState
// =====================================================================================================================

test('toTaskStateFromStateLike with any name, completed, not timed out, error, not rejected & no reason must be TaskState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = checkToTaskStateFromStateLike(name, true, false, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with any name, completed, not timed out, no error, rejected and no reason must be TaskState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = checkToTaskStateFromStateLike(name, true, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with any name, completed, timed out, no error, not rejected and no reason must be TaskState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = checkToTaskStateFromStateLike(name, true, true, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Unstarted
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Unstarted"", not completed, not timed out, no error, not rejected & no reason must be Unstarted', t => {
  const name = UNSTARTED_NAME;
  const state = checkToTaskStateFromStateLike(name, false, false, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with any name, not completed, not timed out, no error, not rejected & no reason must be Unstarted', t => {
  const name = 'Anything';
  const state = checkToTaskStateFromStateLike(name, false, false, undefined, false, undefined);

  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, UNSTARTED_NAME, `name must be ${UNSTARTED_NAME}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - CompletedState
// =====================================================================================================================

test('toTaskStateFromStateLike with any name, completed, not timed out, no error, not rejected & no reason must be CompletedState', t => {
  const name = 'MyState2';
  const state = checkToTaskStateFromStateLike(name, true, false, undefined, false, undefined);
  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');

  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Completed
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Completed", completed, not timed out, no error, not rejected & no reason  must be Completed', t => {
  const name = COMPLETED_NAME;
  const state = checkToTaskStateFromStateLike(name, true, false, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.ok(state instanceof Completed, 'must be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Succeeded
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Succeeded", completed, not timed out, no error, not rejected & no reason  must be Succeeded', t => {
  const name = SUCCEEDED_NAME;
  const state = checkToTaskStateFromStateLike(name, true, false, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.ok(state instanceof Succeeded, 'must be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - TimedOutState
// =====================================================================================================================

test('toTaskStateFromStateLike with any name, not completed, timed out, no error, not rejected & no reason must be TimedOutState', t => {
  const name = 'MyState333';
  const state = checkToTaskStateFromStateLike(name, false, true, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(state instanceof TimedOutState, 'must be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, undefined, 'error must be undefined');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with any name, not completed, timed out, error, not rejected & no reason must be TimedOutState', t => {
  const name = 'MyState333';
  const err = new Error('Badoom99');
  const state = checkToTaskStateFromStateLike(name, false, true, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(state instanceof TimedOutState, 'must be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - TimedOut
// =====================================================================================================================

test('toTaskStateFromStateLike with name "TimedOut"", not completed, not timed out, no error, not rejected & no reason must be TimedOut', t => {
  const name = TIMED_OUT_NAME;
  const state = checkToTaskStateFromStateLike(name, false, true, undefined, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(state instanceof TimedOutState, 'must be instanceof TimedOutState');
  t.ok(state instanceof TimedOut, 'must be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, undefined, 'error must be undefined');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with name "TimedOut"", not completed, not timed out, error, not rejected & no reason must be TimedOut', t => {
  const name = TIMED_OUT_NAME;
  const err = new Error('Badoom888');
  const state = checkToTaskStateFromStateLike(name, false, true, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(state instanceof TimedOutState, 'must be instanceof TimedOutState');
  t.ok(state instanceof TimedOut, 'must be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - FailedState
// =====================================================================================================================

test('toTaskStateFromStateLike with any name, not completed, not timed out, error, not rejected & no reason must be FailedState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = checkToTaskStateFromStateLike(name, false, false, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.ok(state instanceof FailedState, 'must be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Failed
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Failed"", not completed, not timed out, error, not rejected & no reason must be FailedState', t => {
  const name = FAILED_NAME;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromStateLike(name, false, false, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.ok(state instanceof FailedState, 'must be instanceof FailedState');
  t.ok(state instanceof Failed, 'must be instanceof Failed');
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - RejectedState
// =====================================================================================================================

test('toTaskStateFromStateLike with name, not completed, error, not timed out, rejected & no reason must be RejectedState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = checkToTaskStateFromStateLike(name, false, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Rejected
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Rejected"", not completed, not timed out, error, rejected & no reason must be Rejected', t => {
  const name = REJECTED_NAME;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromStateLike(name, false, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.ok(state instanceof Rejected, 'must be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskStateFromStateLike with name "Rejected"", not completed, not timed out, no error, rejected & reason must be Rejected', t => {
  const name = REJECTED_NAME;
  const reason = 'Reason2';
  const state = checkToTaskStateFromStateLike(name, false, false, undefined, true, reason);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.ok(state instanceof Rejected, 'must be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Discarded
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Discarded"", not completed, not timed out, error, rejected & no reason must be Discarded', t => {
  const name = DISCARDED_NAME;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromStateLike(name, false, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.ok(state instanceof Discarded, 'must be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskStateFromStateLike with name "Discarded"", not completed, not timed out, no error, rejected & no reason must be Discarded', t => {
  const name = DISCARDED_NAME;
  const state = checkToTaskStateFromStateLike(name, false, false, undefined, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.ok(state instanceof Discarded, 'must be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'error must be undefined');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Abandoned
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Abandoned"", not completed, not timed out, error, rejected & no reason must be Abandoned', t => {
  const name = ABANDONED_NAME;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromStateLike(name, false, false, err, true, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.ok(state instanceof Abandoned, 'must be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskStateFromStateLike with name "Abandoned"", not completed, not timed out, error, rejected & reason must be Abandoned', t => {
  const name = ABANDONED_NAME;
  const err = new Error('Badoom88');
  const reason = 'Reason3';
  const state = checkToTaskStateFromStateLike(name, false, false, err, true, reason);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.ok(state instanceof Abandoned, 'must be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  t.end();
});

test(`TimeoutError constructor`, t => {
  const msg = 'Tick, tock, ..., BEEP';
  const timeoutError = new TimeoutError(msg);
  t.ok(timeoutError, 'TimeoutError must be defined');
  t.equal(timeoutError.message, msg, `TimeoutError message must be ${msg}`);
  t.equal(timeoutError.name, 'TimeoutError', `TimeoutError name must be TimeoutError`);
  t.end();
});
