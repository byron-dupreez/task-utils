'use strict';

/**
 * Unit tests for task-utils/task-states.js
 * @author Byron du Preez
 */

const test = require('tape');

const states = require('../task-states');
// Standard state names
const names = states.names;
// Singleton TaskState instances
// const instances = states.instances;

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
const fromLegacyStateLikeProperties = TaskState.fromLegacyStateLikeProperties;

function checkToTaskStateFromLegacyStateLike(name, completed, timedOut, error, rejected, reason) {
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
// fromLegacyStateLikeProperties - TaskState
// =====================================================================================================================

test('fromLegacyStateLikeProperties with any name, completed, not timed out, error, not rejected & no reason must be failed TaskState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = fromLegacyStateLikeProperties(name, true, false, err, false, undefined);
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
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.type, StateType.Failed, `type must ${StateType.Failed}`);
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

test('fromLegacyStateLikeProperties with any name, completed, not timed out, no error, rejected and no reason must be rejected TaskState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = fromLegacyStateLikeProperties(name, true, false, err, true, undefined);
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
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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
// fromLegacyStateLikeProperties - Unstarted
// =====================================================================================================================

test('fromLegacyStateLikeProperties with name "Unstarted"", not completed, not timed out, no error, not rejected & no reason must be Unstarted', t => {
  const name = names.Unstarted;
  const state = fromLegacyStateLikeProperties(name, false, false, undefined, false, undefined);
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
  t.equal(state.type, StateType.Unstarted, `type must ${StateType.Unstarted}`);
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

test('fromLegacyStateLikeProperties with any non-"Started" name, not completed, not timed out, no error, not rejected & no reason must be Unstarted', t => {
  const name = 'Anything';
  const state = fromLegacyStateLikeProperties(name, false, false, undefined, false, undefined);

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
  t.equal(state.type, StateType.Unstarted, `type must ${StateType.Unstarted}`);
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
// fromLegacyStateLikeProperties - Started
// =====================================================================================================================

test('fromLegacyStateLikeProperties with name "Started"", not completed, not timed out, no error, not rejected & no reason must be Started', t => {
  const name = names.Started;
  const state = fromLegacyStateLikeProperties(name, false, false, undefined, false, undefined);
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
  t.equal(state.type, StateType.Started, `type must ${StateType.Started}`);
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
// fromLegacyStateLikeProperties - CompletedState
// =====================================================================================================================

test('fromLegacyStateLikeProperties with any name, completed, no error, not timed out, not rejected & no reason must be CompletedState', t => {
  const name = 'MyState2';
  const state = fromLegacyStateLikeProperties(name, true, false, undefined, false, undefined);
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
  t.equal(state.type, StateType.Completed, `type must ${StateType.Completed}`);
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
// fromLegacyStateLikeProperties - Completed
// =====================================================================================================================

test('fromLegacyStateLikeProperties with name "Completed", completed, not timed out, no error, not rejected & no reason must be Completed', t => {
  const name = names.Completed;
  const state = fromLegacyStateLikeProperties(name, true, false, undefined, false, undefined);
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
  t.equal(state.type, StateType.Completed, `type must ${StateType.Completed}`);
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
// fromLegacyStateLikeProperties - Succeeded
// =====================================================================================================================

test('fromLegacyStateLikeProperties with name "Succeeded", completed, not timed out, no error, not rejected & no reason  must be Succeeded', t => {
  const name = names.Succeeded;
  const state = fromLegacyStateLikeProperties(name, true, false, undefined, false, undefined);
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
  t.equal(state.type, StateType.Completed, `type must ${StateType.Completed}`);
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
// fromLegacyStateLikeProperties - TimedOutState
// =====================================================================================================================

test('fromLegacyStateLikeProperties with any name, not completed, timed out, no error, not rejected & no reason must be TimedOutState', t => {
  const name = 'MyState33';
  const state = fromLegacyStateLikeProperties(name, false, true, undefined, false, undefined);
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
  t.equal(state.type, StateType.TimedOut, `type must ${StateType.TimedOut}`);
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

test('fromLegacyStateLikeProperties with any name, not completed, timed out, error, not rejected & no reason must be TimedOutState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = fromLegacyStateLikeProperties(name, false, true, err, false, undefined);
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
  t.equal(state.type, StateType.TimedOut, `type must ${StateType.TimedOut}`);
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
// fromLegacyStateLikeProperties - TimedOut
// =====================================================================================================================

test('fromLegacyStateLikeProperties with name "TimedOut"", not completed, timed out, no error, not rejected & no reason must be TimedOut', t => {
  const name = names.TimedOut;
  const state = fromLegacyStateLikeProperties(name, false, true, undefined, false, undefined);
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
  t.equal(state.type, StateType.TimedOut, `type must ${StateType.TimedOut}`);
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

test('fromLegacyStateLikeProperties with name "TimedOut"", not completed, timed out, error, not rejected & no reason must be TimedOut', t => {
  const name = names.TimedOut;
  const err = new Error('Badoom88');
  const state = fromLegacyStateLikeProperties(name, false, true, err, false, undefined);
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
  t.equal(state.type, StateType.TimedOut, `type must ${StateType.TimedOut}`);
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
// fromLegacyStateLikeProperties - FailedState
// =====================================================================================================================

test('fromLegacyStateLikeProperties with any name, not completed, not timed out, error, not rejected & no reason must be FailedState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = fromLegacyStateLikeProperties(name, false, false, err, false, undefined);
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
  t.equal(state.type, StateType.Failed, `type must ${StateType.Failed}`);
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
// fromLegacyStateLikeProperties - Failed
// =====================================================================================================================

test('fromLegacyStateLikeProperties with name "Failed"", not completed, not timed out, error, not rejected & no reason must be Failed', t => {
  const name = names.Failed;
  const err = new Error('Badoom88');
  const state = fromLegacyStateLikeProperties(name, false, false, err, false, undefined);
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
  t.equal(state.type, StateType.Failed, `type must ${StateType.Failed}`);
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
// fromLegacyStateLikeProperties - RejectedState
// =====================================================================================================================

test('fromLegacyStateLikeProperties with any name, not completed, error, not timed out, rejected & no reason must be RejectedState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = fromLegacyStateLikeProperties(name, false, false, err, true, undefined);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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
// fromLegacyStateLikeProperties - Rejected
// =====================================================================================================================

test('fromLegacyStateLikeProperties with name "Rejected"", not completed, not timed out, error, rejected & no reason must be Rejected', t => {
  const name = names.Rejected;
  const err = new Error('Badoom88');
  const state = fromLegacyStateLikeProperties(name, false, false, err, true, undefined);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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

test('fromLegacyStateLikeProperties with name "Rejected"", not completed, not timed out, no error, rejected & reason must be Rejected', t => {
  const name = names.Rejected;
  const reason = 'Reason2';
  const state = fromLegacyStateLikeProperties(name, false, false, undefined, true, reason);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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
// fromLegacyStateLikeProperties - Discarded
// =====================================================================================================================

test('fromLegacyStateLikeProperties with name "Discarded"", not completed, not timed out, error, rejected & no reason must be Discarded', t => {
  const name = names.Discarded;
  const err = new Error('Badoom88');
  const state = fromLegacyStateLikeProperties(name, false, false, err, true, undefined);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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

test('fromLegacyStateLikeProperties with name "Discarded"", not completed, not timed out, no error, rejected & no reason must be Discarded', t => {
  const name = names.Discarded;
  const state = fromLegacyStateLikeProperties(name, false, false, undefined, true, undefined);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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
// fromLegacyStateLikeProperties - Abandoned
// =====================================================================================================================

test('fromLegacyStateLikeProperties with name "Abandoned"", not completed, not timed out, error, rejected & no reason must be Abandoned', t => {
  const name = names.Abandoned;
  const err = new Error('Badoom88');
  const state = fromLegacyStateLikeProperties(name, false, false, err, true, undefined);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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

test('fromLegacyStateLikeProperties with name "Abandoned"", not completed, not timed out, error, rejected & reason must be Abandoned', t => {
  const name = names.Abandoned;
  const err = new Error('Badoom88');
  const reason = 'Reason3';
  const state = fromLegacyStateLikeProperties(name, false, false, err, true, reason);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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

test('toTaskStateFromStateLike with any name, completed, not timed out, error, not rejected & no reason must be failed TaskState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = checkToTaskStateFromLegacyStateLike(name, true, false, err, false, undefined);
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
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.type, StateType.Failed, `type must ${StateType.Failed}`);
  t.equal(state.completed, false, 'must not be completed');
  t.equal(state.failed, true, 'must be failed');
  t.equal(state.timedOut, false, 'must not be timedOut');
  t.equal(state.error, err.toString(), 'error must match');
  t.equal(state.rejected, false, 'must not be rejected');
  t.notOk(state.reason, 'must have no reason');
  t.end();
});

test('toTaskStateFromStateLike with any name, completed, not timed out, no error, rejected and no reason must be rejected TaskState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = checkToTaskStateFromLegacyStateLike(name, true, false, err, true, undefined);
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
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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

test('toTaskStateFromStateLike with any name, completed, timed out, no error, not rejected and no reason must be timed-out TaskState', t => {
  const name = 'MyState1';
  const err = new Error('Badoom7');
  const state = checkToTaskStateFromLegacyStateLike(name, true, true, err, false, undefined);
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
  t.notOk(state instanceof RejectedState, 'must not be instanceof RejectedState');
  t.notOk(state instanceof Rejected, 'must not be instanceof Rejected');
  t.notOk(state instanceof Discarded, 'must not be instanceof Discarded');
  t.notOk(state instanceof Abandoned, 'must not be instanceof Abandoned');

  t.equal(state.name, name, 'name must match');
  t.equal(state.type, StateType.TimedOut, `type must ${StateType.TimedOut}`);
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

test('toTaskStateFromStateLike with name "Unstarted"", not completed, not timed out, no error, not rejected & no reason must be Unstarted', t => {
  const name = names.Unstarted;
  const state = checkToTaskStateFromLegacyStateLike(name, false, false, undefined, false, undefined);
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
  t.equal(state.type, StateType.Unstarted, `type must ${StateType.Unstarted}`);
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

test('toTaskStateFromStateLike with any non-"Started" name, not completed, not timed out, no error, not rejected & no reason must be Unstarted', t => {
  const name = 'Anything';
  const state = checkToTaskStateFromLegacyStateLike(name, false, false, undefined, false, undefined);

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
  t.equal(state.type, StateType.Unstarted, `type must ${StateType.Unstarted}`);
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

test('toTaskStateFromStateLike with name "Started"", not completed, not timed out, no error, not rejected & no reason must be Started', t => {
  const name = names.Started;
  const state = checkToTaskStateFromLegacyStateLike(name, false, false, undefined, false, undefined);
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
  t.equal(state.type, StateType.Started, `type must ${StateType.Started}`);
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

test('toTaskStateFromStateLike with any name, completed, not timed out, no error, not rejected & no reason must be CompletedState', t => {
  const name = 'MyState2';
  const state = checkToTaskStateFromLegacyStateLike(name, true, false, undefined, false, undefined);
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
  t.equal(state.type, StateType.Completed, `type must ${StateType.Completed}`);
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

test('toTaskStateFromStateLike with name "Completed", completed, not timed out, no error, not rejected & no reason  must be Completed', t => {
  const name = names.Completed;
  const state = checkToTaskStateFromLegacyStateLike(name, true, false, undefined, false, undefined);
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
  t.equal(state.type, StateType.Completed, `type must ${StateType.Completed}`);
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

test('toTaskStateFromStateLike with name "Succeeded", completed, not timed out, no error, not rejected & no reason  must be Succeeded', t => {
  const name = names.Succeeded;
  const state = checkToTaskStateFromLegacyStateLike(name, true, false, undefined, false, undefined);
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
  t.equal(state.type, StateType.Completed, `type must ${StateType.Completed}`);
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

test('toTaskStateFromStateLike with any name, not completed, timed out, no error, not rejected & no reason must be TimedOutState', t => {
  const name = 'MyState333';
  const state = checkToTaskStateFromLegacyStateLike(name, false, true, undefined, false, undefined);
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
  t.equal(state.type, StateType.TimedOut, `type must ${StateType.TimedOut}`);
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

test('toTaskStateFromStateLike with any name, not completed, timed out, error, not rejected & no reason must be TimedOutState', t => {
  const name = 'MyState333';
  const err = new Error('Badoom99');
  const state = checkToTaskStateFromLegacyStateLike(name, false, true, err, false, undefined);
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
  t.equal(state.type, StateType.TimedOut, `type must ${StateType.TimedOut}`);
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

test('toTaskStateFromStateLike with name "TimedOut"", not completed, not timed out, no error, not rejected & no reason must be TimedOut', t => {
  const name = names.TimedOut;
  const state = checkToTaskStateFromLegacyStateLike(name, false, true, undefined, false, undefined);
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
  t.equal(state.type, StateType.TimedOut, `type must ${StateType.TimedOut}`);
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

test('toTaskStateFromStateLike with name "TimedOut"", not completed, not timed out, error, not rejected & no reason must be TimedOut', t => {
  const name = names.TimedOut;
  const err = new Error('Badoom888');
  const state = checkToTaskStateFromLegacyStateLike(name, false, true, err, false, undefined);
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
  t.equal(state.type, StateType.TimedOut, `type must ${StateType.TimedOut}`);
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

test('toTaskStateFromStateLike with any name, not completed, not timed out, error, not rejected & no reason must be FailedState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = checkToTaskStateFromLegacyStateLike(name, false, false, err, false, undefined);
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
  t.equal(state.type, StateType.Failed, `type must ${StateType.Failed}`);
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

test('toTaskStateFromStateLike with name "Failed"", not completed, not timed out, error, not rejected & no reason must be FailedState', t => {
  const name = names.Failed;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromLegacyStateLike(name, false, false, err, false, undefined);
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
  t.equal(state.type, StateType.Failed, `type must ${StateType.Failed}`);
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

test('toTaskStateFromStateLike with name, not completed, error, not timed out, rejected & no reason must be RejectedState', t => {
  const name = 'MyState33';
  const err = new Error('Badoom99');
  const state = checkToTaskStateFromLegacyStateLike(name, false, false, err, true, undefined);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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

test('toTaskStateFromStateLike with name "Rejected"", not completed, not timed out, error, rejected & no reason must be Rejected', t => {
  const name = names.Rejected;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromLegacyStateLike(name, false, false, err, true, undefined);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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

test('toTaskStateFromStateLike with name "Rejected"", not completed, not timed out, no error, rejected & reason must be Rejected', t => {
  const name = names.Rejected;
  const reason = 'Reason2';
  const state = checkToTaskStateFromLegacyStateLike(name, false, false, undefined, true, reason);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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

test('toTaskStateFromStateLike with name "Discarded"", not completed, not timed out, error, rejected & no reason must be Discarded', t => {
  const name = names.Discarded;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromLegacyStateLike(name, false, false, err, true, undefined);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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

test('toTaskStateFromStateLike with name "Discarded"", not completed, not timed out, no error, rejected & no reason must be Discarded', t => {
  const name = names.Discarded;
  const state = checkToTaskStateFromLegacyStateLike(name, false, false, undefined, true, undefined);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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

test('toTaskStateFromStateLike with name "Abandoned"", not completed, not timed out, error, rejected & no reason must be Abandoned', t => {
  const name = names.Abandoned;
  const err = new Error('Badoom88');
  const state = checkToTaskStateFromLegacyStateLike(name, false, false, err, true, undefined);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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

test('toTaskStateFromStateLike with name "Abandoned"", not completed, not timed out, error, rejected & reason must be Abandoned', t => {
  const name = names.Abandoned;
  const err = new Error('Badoom88');
  const reason = 'Reason3';
  const state = checkToTaskStateFromLegacyStateLike(name, false, false, err, true, reason);
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
  t.equal(state.type, StateType.Rejected, `type must ${StateType.Rejected}`);
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
