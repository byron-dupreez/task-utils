'use strict';

/**
 * Unit tests for task-utils/task-states.js
 * @author Byron du Preez
 */

const test = require("tape");

const states = require('../task-states');
// Standard state names
const names = states.names;
// Singleton TaskState instances
const instances = states.instances;

const core = require('../core');
const StateType = core.StateType;

// TaskState constructors
const TaskState = states.TaskState;
// const StateType = states.StateType;
// TaskState direct subclasses
const Unstarted = states.Unstarted; // rather use instances.Unstarted singleton
const Started = states.Started; // rather use instances.Started singleton
const CompletedState = states.CompletedState;
const TimedOutState = states.TimedOutState;
const FailedState = states.FailedState;
const RejectedState = states.RejectedState;
// CompletedState subclasses
const Completed = states.Completed; // rather use instances.Completed singleton
const Succeeded = states.Succeeded; // rather use instances.Succeeded singleton
// Timeout subclasses
const TimedOut = states.TimedOut;
// FailedState subclasses
const Failed = states.Failed;
// RejectedState subclasses
const Rejected = states.Rejected;
const Discarded = states.Discarded;
const Abandoned = states.Abandoned;

// Utility to convert fields into an appropriate state
const toTaskStateFromStateLike = TaskState.toTaskStateFromStateLike;
const fromStateLikeProperties = TaskState.fromStateLikeProperties;

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
      state.error = new Error("Boom1");
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

function checkToTaskStateFromStateLike(name, kind, error, reason) {
  const stateLike = {
    name: name,
    kind: kind,
    error: error,
    reason: reason
  };
  return toTaskStateFromStateLike(stateLike);
}

// =====================================================================================================================
// TaskState oddities
// =====================================================================================================================

test('Construct completed TaskState instance', t => {
  const name = 'MyState1';
  const state = new TaskState(name, StateType.COMPLETED, undefined, undefined);
  t.ok(state, 'TaskState must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.failed, false, 'must not be failed');
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
  const state = new TaskState(name, StateType.COMPLETED, err, undefined);
  t.ok(state, 'TaskState must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.failed, false, 'must not be failed');
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
  const state = new TaskState(name, StateType.REJECTED, undefined, reason);
  t.ok(state, 'TaskState must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must be completed');
  t.equal(state.failed, false, 'must not be failed');
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
  const state = new TaskState(name, StateType.REJECTED, err, reason);
  t.ok(state, 'TaskState must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  ensureImmutable(state, t);
  t.end();
});

test('Construct unstarted TaskState instance', t => {
  const name = 'MyState3';
  const state = new TaskState(name, StateType.UNSTARTED, undefined, undefined);
  t.ok(state, 'TaskState must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
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
  const state = new TaskState(name, StateType.UNSTARTED, err, undefined);
  t.ok(state, 'TaskState must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, name, 'name must match');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
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
  t.equal(state.failed, false, 'must not be failed');
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
  t.equal(state.failed, false, 'must not be failed');
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
  t.equal(state.failed, false, 'must not be failed');
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
  t.equal(state.failed, true, 'must be failed');
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
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// instances.Unstarted
// =====================================================================================================================

test('instances.Unstarted singleton', t => {
  const state = instances.Unstarted;
  t.ok(state, 'instances.Unstarted must be defined');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, names.Unstarted, `name must be ${names.Unstarted}`);
  t.equal(state.unstarted, true, 'must be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.ok(state.unstarted, 'must be unstarted');
  t.notOk(state.started, 'must NOT be started');
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
  t.equal(state.name, names.Unstarted, `name must be ${names.Unstarted}`);
  t.equal(state.unstarted, true, 'must be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.ok(state.unstarted, 'must be unstarted');
  t.notOk(state.started, 'must NOT be started');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// instances.Started
// =====================================================================================================================

test('instances.Started singleton', t => {
  const state = instances.Started;
  t.ok(state, 'instances.Started must be defined');
  t.ok(state instanceof Started, 'must be instanceof Started');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, names.Started, `name must be ${names.Started}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, true, 'must be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.ok(state.started, 'must be started');
  t.notOk(state.unstarted, 'must NOT be unstarted');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// Started
// =====================================================================================================================

test('Construct a Started TaskState instance', t => {
  const state = new Started();
  t.ok(state, 'Started must be defined');
  t.ok(state instanceof Started, 'must be instanceof Started');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, names.Started, `name must be ${names.Started}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, true, 'must be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.ok(state.started, 'must be started');
  t.notOk(state.unstarted, 'must NOT be unstarted');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// instances.Completed
// =====================================================================================================================

test('instances.Completed singleton', t => {
  const state = instances.Completed;
  t.ok(state, 'instances.Completed must be defined');
  t.ok(state instanceof Completed, 'must be instanceof Completed');
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, names.Completed, `name must be ${names.Completed}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.failed, false, 'must not be failed');
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
  t.equal(state.name, names.Completed, `name must be ${names.Completed}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// instances.Succeeded
// =====================================================================================================================

test('instances.Succeeded singleton', t => {
  const state = instances.Succeeded;
  t.ok(state, 'instances.Succeeded must be defined');
  t.ok(state instanceof Succeeded, 'must be instanceof Succeeded');
  t.ok(state instanceof CompletedState, 'must be instanceof CompletedState');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.equal(state.name, names.Succeeded, `name must be ${names.Succeeded}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.failed, false, 'must not be failed');
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
  t.equal(state.name, names.Succeeded, `name must be ${names.Succeeded}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.failed, false, 'must not be failed');
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
  t.equal(state.name, names.TimedOut, `name must be ${names.TimedOut}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
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
  t.equal(state.name, names.TimedOut, `name must be ${names.TimedOut}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
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
  t.equal(state.name, names.Failed, `name must be ${names.Failed}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, true, 'must be failed');
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
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.name, names.Rejected, `name must be ${names.Rejected}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
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
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.name, names.Discarded, `name must be ${names.Discarded}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
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
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.name, names.Abandoned, `name must be ${names.Abandoned}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.ok(state.reason, 'must have reason');
  ensureImmutable(state, t);
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - TaskState
// =====================================================================================================================

test('fromStateLikeProperties with any name, StateType.FAILED, error, no reason must be FailedState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = fromStateLikeProperties(name, StateType.FAILED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.FAILED, `kind must ${StateType.FAILED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, true, 'must be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('fromStateLikeProperties with any name, StateType.REJECTED, no error and no reason must be RejectedState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = fromStateLikeProperties(name, StateType.REJECTED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
  t.notOk(state instanceof CompletedState, 'must not be instanceof CompletedState');
  t.notOk(state instanceof Completed, 'must not be instanceof Completed');
  t.notOk(state instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(state instanceof TimedOutState, 'must not be instanceof TimedOutState');
  t.notOk(state instanceof TimedOut, 'must not be instanceof TimedOut');
  t.notOk(state instanceof FailedState, 'must not be instanceof FailedState');
  t.notOk(state instanceof Failed, 'must not be instanceof Failed');
  t.ok(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - Unstarted
// =====================================================================================================================

test('fromStateLikeProperties with name "Unstarted"", StateType.UNSTARTED, no error & no reason must be Unstarted', t => {
  const name = names.Unstarted;
  const state = fromStateLikeProperties(name, StateType.UNSTARTED, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.UNSTARTED, `kind must ${StateType.UNSTARTED}`);
  t.equal(state.unstarted, true, 'must be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('fromStateLikeProperties with any non-"Started" name, StateType.UNSTARTED, no error & no reason must be Unstarted', t => {
  const name = 'Anything';
  const state = fromStateLikeProperties(name, StateType.UNSTARTED, undefined, undefined);

  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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

  t.equal(state.name, names.Unstarted, `name must be ${names.Unstarted}`);
  t.equal(state.kind, StateType.UNSTARTED, `kind must ${StateType.UNSTARTED}`);
  t.equal(state.unstarted, true, 'must be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - Started
// =====================================================================================================================

test('fromStateLikeProperties with name "Started"", StateType.STARTED, no error & no reason must be Started', t => {
  const name = names.Started;
  const state = fromStateLikeProperties(name, StateType.STARTED, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.ok(state instanceof Started, 'must be instanceof Started');
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
  t.equal(state.kind, StateType.STARTED, `kind must ${StateType.STARTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, true, 'must be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - CompletedState
// =====================================================================================================================

test('fromStateLikeProperties with any name, StateType.COMPLETED, no error & no reason must be CompletedState', t => {
  const name = 'MyState2';
  const state = fromStateLikeProperties(name, StateType.COMPLETED, undefined, undefined);
  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');

  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.COMPLETED, `kind must ${StateType.COMPLETED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - Completed
// =====================================================================================================================

test('fromStateLikeProperties with name "Completed", StateType.COMPLETED, no error & no reason must be Completed', t => {
  const name = names.Completed;
  const state = fromStateLikeProperties(name, StateType.COMPLETED, undefined, undefined);
  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');

  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.COMPLETED, `kind must ${StateType.COMPLETED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - Succeeded
// =====================================================================================================================

test('fromStateLikeProperties with name "Succeeded", StateType.COMPLETED, no error & no reason  must be Succeeded', t => {
  const name = names.Succeeded;
  const state = fromStateLikeProperties(name, StateType.COMPLETED, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.COMPLETED, `kind must ${StateType.COMPLETED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - TimedOutState
// =====================================================================================================================

test('fromStateLikeProperties with any name, StateType.TIMED_OUT, no error & no reason must be TimedOutState', t => {
  const name = 'MyState33';
  const state = fromStateLikeProperties(name, StateType.TIMED_OUT, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.TIMED_OUT, `kind must ${StateType.TIMED_OUT}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, undefined, 'error must be undefined');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('fromStateLikeProperties with any name, StateType.TIMED_OUT, error & no reason must be TimedOutState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = fromStateLikeProperties(name, StateType.TIMED_OUT, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.TIMED_OUT, `kind must ${StateType.TIMED_OUT}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - TimedOut
// =====================================================================================================================

test('fromStateLikeProperties with name "TimedOut"", StateType.TIMED_OUT, no error & no reason must be TimedOut', t => {
  const name = names.TimedOut;
  const state = fromStateLikeProperties(name, StateType.TIMED_OUT, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.TIMED_OUT, `kind must ${StateType.TIMED_OUT}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, undefined, 'error must be undefined');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('fromStateLikeProperties with name "TimedOut"", StateType.TIMED_OUT, error & no reason must be TimedOut', t => {
  const name = names.TimedOut;
  const err = new Error('Badoom88');
  const state = fromStateLikeProperties(name, StateType.TIMED_OUT, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.TIMED_OUT, `kind must ${StateType.TIMED_OUT}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - FailedState
// =====================================================================================================================

test('fromStateLikeProperties with any name, StateType.FAILED, error & no reason must be FailedState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = fromStateLikeProperties(name, StateType.FAILED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.FAILED, `kind must ${StateType.FAILED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, true, 'must be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - Failed
// =====================================================================================================================

test('fromStateLikeProperties with name "Failed"", StateType.FAILED, error & no reason must be Failed', t => {
  const name = names.Failed;
  const err = new Error('Badoom88');
  const state = fromStateLikeProperties(name, StateType.FAILED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.FAILED, `kind must ${StateType.FAILED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, true, 'must be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - RejectedState
// =====================================================================================================================

test('fromStateLikeProperties with any name, StateType.REJECTED, error & no reason must be RejectedState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = fromStateLikeProperties(name, StateType.REJECTED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - Rejected
// =====================================================================================================================

test('fromStateLikeProperties with name "Rejected"", StateType.REJECTED, error & no reason must be Rejected', t => {
  const name = names.Rejected;
  const err = new Error('Badoom88');
  const state = fromStateLikeProperties(name, StateType.REJECTED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('fromStateLikeProperties with name "Rejected"", StateType.REJECTED, no error & reason must be Rejected', t => {
  const name = names.Rejected;
  const reason = 'Reason2';
  const state = fromStateLikeProperties(name, StateType.REJECTED, undefined, reason);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - Discarded
// =====================================================================================================================

test('fromStateLikeProperties with name "Discarded"", StateType.REJECTED, error & no reason must be Discarded', t => {
  const name = names.Discarded;
  const err = new Error('Badoom88');
  const state = fromStateLikeProperties(name, StateType.REJECTED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('fromStateLikeProperties with name "Discarded"", StateType.REJECTED, no error & no reason must be Discarded', t => {
  const name = names.Discarded;
  const state = fromStateLikeProperties(name, StateType.REJECTED, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'error must be undefined');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

// =====================================================================================================================
// fromStateLikeProperties - Abandoned
// =====================================================================================================================

test('fromStateLikeProperties with name "Abandoned"", StateType.REJECTED, error & no reason must be Abandoned', t => {
  const name = names.Abandoned;
  const err = new Error('Badoom88');
  const state = fromStateLikeProperties(name, StateType.REJECTED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('fromStateLikeProperties with name "Abandoned"", StateType.REJECTED, error & reason must be Abandoned', t => {
  const name = names.Abandoned;
  const err = new Error('Badoom88');
  const reason = 'Reason3';
  const state = fromStateLikeProperties(name, StateType.REJECTED, err, reason);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - TaskState
// =====================================================================================================================

test('toTaskStateFromStateLike with any name, StateType.FAILED, error, & no reason must be FailedState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = checkToTaskStateFromStateLike(name, StateType.FAILED, err, false, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.FAILED, `kind must ${StateType.FAILED}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, true, 'must be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with any name, StateType.REJECTED, no error & no reason must be RejectedState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = checkToTaskStateFromStateLike(name, StateType.REJECTED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with any name, StateType.TIMED_OUT, no error & no reason must be TimedOutState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = checkToTaskStateFromStateLike(name, StateType.TIMED_OUT, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.TIMED_OUT, `kind must ${StateType.TIMED_OUT}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Unstarted
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Unstarted", StateType.UNSTARTED, no error & no reason must be Unstarted', t => {
  const name = names.Unstarted;
  const state = checkToTaskStateFromStateLike(name, StateType.UNSTARTED, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.UNSTARTED, `kind must ${StateType.UNSTARTED}`);
  t.equal(state.unstarted, true, 'must be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with any non-"Started" name, StateType.UNSTARTED, no error & no reason must be Unstarted', t => {
  const name = 'Anything';
  const state = checkToTaskStateFromStateLike(name, StateType.UNSTARTED, undefined, undefined);

  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.ok(state instanceof Unstarted, 'must be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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

  t.equal(state.name, names.Unstarted, `name must be ${names.Unstarted}`);
  t.equal(state.kind, StateType.UNSTARTED, `kind must ${StateType.UNSTARTED}`);
  t.equal(state.unstarted, true, 'must be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Started
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Started", StateType.STARTED, no error & no reason must be Started', t => {
  const name = names.Started;
  const state = checkToTaskStateFromStateLike(name, StateType.STARTED, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.ok(state instanceof Started, 'must be instanceof Started');
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
  t.equal(state.kind, StateType.STARTED, `kind must ${StateType.STARTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, true, 'must be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - CompletedState
// =====================================================================================================================

test('toTaskStateFromStateLike with any name, StateType.COMPLETED, no error & no reason must be CompletedState', t => {
  const name = 'MyState2';
  const state = checkToTaskStateFromStateLike(name, StateType.COMPLETED, undefined, undefined);
  t.ok(state, 'state must be defined');
  t.ok(state instanceof TaskState, 'must be instanceof TaskState');

  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.COMPLETED, `kind must ${StateType.COMPLETED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Completed
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Completed", StateType.COMPLETED, no error & no reason  must be Completed', t => {
  const name = names.Completed;
  const state = checkToTaskStateFromStateLike(name, StateType.COMPLETED, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.COMPLETED, `kind must ${StateType.COMPLETED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Succeeded
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Succeeded", StateType.COMPLETED, no error & no reason must be Succeeded', t => {
  const name = names.Succeeded;
  const state = checkToTaskStateFromStateLike(name, StateType.COMPLETED, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.COMPLETED, `kind must ${StateType.COMPLETED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, true, 'must be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - TimedOutState
// =====================================================================================================================

test('toTaskStateFromStateLike with any name, StateType.TIMED_OUT, no error & no reason must be TimedOutState', t => {
  const name = 'MyState333';
  const state = checkToTaskStateFromStateLike(name, StateType.TIMED_OUT, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.TIMED_OUT, `kind must ${StateType.TIMED_OUT}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, undefined, 'error must be undefined');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with any name, StateType.TIMED_OUT, error & no reason must be TimedOutState', t => {
  const name = 'MyState333';
  const err = new Error('Badoom99');
  const state = checkToTaskStateFromStateLike(name, StateType.TIMED_OUT, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.TIMED_OUT, `kind must ${StateType.TIMED_OUT}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - TimedOut
// =====================================================================================================================

test('toTaskStateFromStateLike with name "TimedOut"", StateType.TIMED_OUT, no error & no reason must be TimedOut', t => {
  const name = names.TimedOut;
  const state = checkToTaskStateFromStateLike(name, StateType.TIMED_OUT, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.TIMED_OUT, `kind must ${StateType.TIMED_OUT}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, undefined, 'error must be undefined');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with name "TimedOut"", StateType.TIMED_OUT, error & no reason must be TimedOut', t => {
  const name = names.TimedOut;
  const err = new Error('Badoom888');
  const state = checkToTaskStateFromStateLike(name, StateType.TIMED_OUT, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.TIMED_OUT, `kind must ${StateType.TIMED_OUT}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, true, 'must be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - FailedState
// =====================================================================================================================

test('toTaskStateFromStateLike with any name, StateType.FAILED, error & no reason must be FailedState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = checkToTaskStateFromStateLike(name, StateType.FAILED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.FAILED, `kind must ${StateType.FAILED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, true, 'must be failed');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Failed
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Failed"", StateType.FAILED, error & no reason must be FailedState', t => {
  const name = names.Failed;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromStateLike(name, StateType.FAILED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.FAILED, `kind must ${StateType.FAILED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, true, 'must be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - RejectedState
// =====================================================================================================================

test('toTaskStateFromStateLike with name, StateType.REJECTED, error & no reason must be RejectedState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = checkToTaskStateFromStateLike(name, StateType.REJECTED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Rejected
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Rejected"", StateType.REJECTED, error & no reason must be Rejected', t => {
  const name = names.Rejected;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromStateLike(name, StateType.REJECTED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskStateFromStateLike with name "Rejected"", StateType.REJECTED, no error & reason must be Rejected', t => {
  const name = names.Rejected;
  const reason = 'Reason2';
  const state = checkToTaskStateFromStateLike(name, StateType.REJECTED, undefined, reason);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'must have no error');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Discarded
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Discarded"", StateType.REJECTED, error & no reason must be Discarded', t => {
  const name = names.Discarded;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromStateLike(name, StateType.REJECTED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskStateFromStateLike with name "Discarded"", StateType.REJECTED, no error & no reason must be Discarded', t => {
  const name = names.Discarded;
  const state = checkToTaskStateFromStateLike(name, StateType.REJECTED, undefined, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.notOk(state.error, 'error must be undefined');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

// =====================================================================================================================
// toTaskStateFromStateLike - Abandoned
// =====================================================================================================================

test('toTaskStateFromStateLike with name "Abandoned"", StateType.REJECTED, error & no reason must be Abandoned', t => {
  const name = names.Abandoned;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromStateLike(name, StateType.REJECTED, err, undefined);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.notOk(state.reason, 'can have no reason');
  t.end();
});

test('toTaskStateFromStateLike with name "Abandoned"", StateType.REJECTED, error & reason must be Abandoned', t => {
  const name = names.Abandoned;
  const err = new Error('Badoom88');
  const reason = 'Reason3';
  const state = checkToTaskStateFromStateLike(name, StateType.REJECTED, err, reason);
  t.ok(state, 'state must be defined');

  t.ok(state instanceof TaskState, 'must be instanceof TaskState');
  t.notOk(state instanceof Unstarted, 'must not be instanceof Unstarted');
  t.notOk(state instanceof Started, 'must not be instanceof Started');
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
  t.equal(state.kind, StateType.REJECTED, `kind must ${StateType.REJECTED}`);
  t.equal(state.unstarted, false, 'must not be unstarted');
  t.equal(state.started, false, 'must not be started');
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, false, 'must not be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, true, 'must be rejected');
  t.equal(state.reason, reason, 'reason must match');
  t.end();
});
