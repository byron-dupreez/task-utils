'use strict';

/**
 * Unit tests for task-utils/tasks.js
 * @author Byron du Preez
 */

const test = require("tape");

const statuses = require('../statuses');

// Common status codes
const SUCCEEDED_CODE = statuses.SUCCEEDED_CODE;
// Status singletons
const INCOMPLETE = statuses.INCOMPLETE;
const SUCCEEDED = statuses.SUCCEEDED;
// Status classes
//const Status = statuses.Status;
//const Incomplete = statuses.Incomplete;
const Success = statuses.Success;
const Failure = statuses.Failure;
//const Succeeded = statuses.Succeeded;
const Failed = statuses.Failed;
//const toStatus = statuses.toStatus;
//const isStatusCompleted = statuses.isStatusCompleted;

const Tasks = require('../tasks');
const getTask = Tasks.ONLY_FOR_TESTING.getTask;
const getOrCreateTask = Tasks.getOrCreateTask;
const getTaskStatus = Tasks.getTaskStatus;
const getTaskResult = Tasks.getTaskResult;
const getTaskProperty = Tasks.getTaskProperty;
const getTaskAttempts = Tasks.getTaskAttempts;
const incrementTaskAttempts = Tasks.incrementTaskAttempts;
const setTaskStatus = Tasks.setTaskStatus;
const setTaskStatusDetails = Tasks.setTaskStatusDetails;
const setTaskResult = Tasks.setTaskResult;
const setTaskProperty = Tasks.setTaskProperty;
//TODO test these
const setTaskStatusIfNecessary = Tasks.setTaskStatusIfNecessary;
const resetTaskStatusAndResultIfNotComplete = Tasks.resetTaskStatusAndResultIfNotComplete;


test('getTask with no tasks & no task returns undefined', t => {
  const o = {};
  const task = getTask(o, 'tasks', 'task1');
  t.notOk(task, 'task must not be defined yet');
  t.end();
});

test('getTask with tasks and no task returns undefined', t => {
  const o = { tasks: {} };
  const task = getTask(o, 'tasks', 'task1');
  t.notOk(task, 'task must not be defined yet');
  t.end();
});

test('getTask with tasks and task returns it', t => {
  const o = { tasks: { task1: {} } };
  const task = getTask(o, 'tasks', 'task1');
  t.ok(task, 'task must be defined');
  t.equal(o.tasks.task1, task, 'task must match');
  t.end();
});

test('getOrCreateTask with no tasks and no task returns new task', t => {
  const o = {};
  const task = getOrCreateTask(o, 'tasks', 'task1');
  t.ok(task, 'task must be defined');
  t.ok(o.tasks, 'o.tasks must be defined');
  t.ok(o.tasks.task1, 'o.tasks.task1 must be defined');
  t.equal(task, o.tasks.task1, 'task must match o.tasks.task1');
  t.end();
});

test('getOrCreateTask with defined task returns it', t => {
  const o = { tasks: { task1: {} } };
  const task1 = o.tasks.task1;
  const task = getOrCreateTask(o, 'tasks', 'task1');
  t.ok(task, 'task must be defined');
  t.ok(o.tasks, 'o.tasks must be defined');
  t.ok(o.tasks.task1, 'o.tasks.task1 must be defined');
  t.equal(task, task1, 'task must match task1');
  t.equal(task, o.tasks.task1, 'task must match o.tasks.task1');
  t.end();
});

test('getTaskStatus with no tasks and no task & no status, returns undefined', t => {
  const o = {};
  const taskStatus = getTaskStatus(o, 'tasks', 'task2');
  t.notOk(taskStatus, 'task status must not be defined yet');
  t.notOk(o.tasks, 'o.tasks must not be defined');
  t.end();
});

test('getTaskStatus with tasks, but no task, returns undefined', t => {
  const o = { tasks: { task1: {} } };
  const taskName = 'task2';
  const taskStatus = getTaskStatus(o, 'tasks', taskName);
  t.notOk(taskStatus, `task ${taskName} status must not be defined yet`);
  t.notOk(o.tasks[taskName], `o.tasks[${taskName}] must not be defined yet`);
  t.end();
});

test('getTaskStatus with defined task status returns it', t => {
  const taskName = 'task1';
  const err = new Error('Smash');
  const status = new Failed(err);
  const o = { tasks: { [taskName]: { status: status} } };
  const taskStatus = getTaskStatus(o, 'tasks', taskName);
  const task = getTask(o, 'tasks', taskName);
  t.ok(taskStatus, `task ${taskName} status must be defined`);
  t.equal(taskStatus, status, `task ${taskName} status must match`);
  t.end();
});

test('getTaskResult with no tasks and no task & no result, returns undefined', t => {
  const o = {};
  const taskName = 'task2';
  const taskResult = getTaskResult(o, 'tasks', taskName);
  t.notOk(taskResult, `task ${taskName} result must not be defined yet`);
  t.notOk(o.tasks, 'o.tasks must not be defined');
  t.end();
});

test('getTaskResult with tasks, but no task, returns undefined', t => {
  const o = { tasks: { task1: {} } };
  const taskName = 'task2';
  const taskResult = getTaskResult(o, 'tasks', taskName);
  t.notOk(taskResult, `task ${taskName} result must not be defined yet`);
  t.notOk(o.tasks[taskName], `o.tasks[${taskName}] must not be defined yet`);
  t.end();
});

test('getTaskResult with defined task result returns it', t => {
  const taskName = 'task1';
  const result = 'Yo';
  const o = { tasks: { [taskName]: { result: result} } };
  const taskResult = getTaskResult(o, 'tasks', taskName);
  const task = getTask(o, 'tasks', taskName);
  t.ok(taskResult, `task ${taskName} result must be defined`);
  t.equal(taskResult, result, `task ${taskName} result must match`);
  t.end();
});

test('getTaskAttempts with no tasks and no task & no attempts, returns undefined', t => {
  const o = {};
  const taskName = 'task2';
  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  t.equal(taskAttempts, 0, `task ${taskName} attempts must be zero`);
  t.notOk(taskAttempts, `task ${taskName} attempts must not be defined yet`);
  t.notOk(o.tasks, 'o.tasks must not be defined');
  t.end();
});

test('getTaskAttempts with tasks, but no task, returns undefined', t => {
  const o = { tasks: { task1: {} } };
  const taskName = 'task2';
  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  t.equal(taskAttempts, 0, `task ${taskName} attempts must be zero`);
  t.notOk(taskAttempts, `task ${taskName} attempts must not be defined yet`);
  t.notOk(o.tasks[taskName], `o.tasks[${taskName}] must not be defined yet`);
  t.end();
});

test('getTaskAttempts with defined task attempts returns it', t => {
  const taskName = 'task1';
  const attempts = 77;
  const o = { tasks: { [taskName]: { attempts: attempts} } };
  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  const task = getTask(o, 'tasks', taskName);
  t.ok(taskAttempts, `task ${taskName} attempts must be defined`);
  t.equal(taskAttempts, attempts, `task ${taskName} attempts must match`);
  t.end();
});

test('getTaskProperty with no tasks and no task & no property value, returns undefined', t => {
  const o = {};
  const taskName = 'task2';
  const propertyName = 'propertyName3';
  const taskPropertyValue = getTaskProperty(o, 'tasks', taskName, propertyName);
  t.notOk(taskPropertyValue, `task ${taskName} ${propertyName} value must not be defined yet`);
  t.notOk(o.tasks, 'o.tasks must not be defined');
  t.end();
});

test('getTaskProperty with tasks, but no task, returns undefined', t => {
  const o = { tasks: { task1: {} } };
  const taskName = 'task2';
  const propertyName = 'propertyName5';
  const taskPropertyValue = getTaskProperty(o, 'tasks', taskName, propertyName);
  t.notOk(taskPropertyValue, `task ${taskName} ${propertyName} value must not be defined yet`);
  t.notOk(o.tasks[taskName], `o.tasks[${taskName}] must not be defined yet`);
  t.end();
});

test('getTaskProperty with defined task propertyValue returns it', t => {
  const taskName = 'task1';
  const propertyName = 'propertyName7';
  const propertyValue = 'Yo';
  const o = { tasks: { [taskName]: { [propertyName]: propertyValue} } };
  const taskPropertyValue = getTaskProperty(o, 'tasks', taskName, propertyName);
  const task = getTask(o, 'tasks', taskName);
  t.ok(taskPropertyValue, `task ${taskName} ${propertyName} value must be defined`);
  t.equal(taskPropertyValue, propertyValue, `task ${taskName} ${propertyName} value must match`);
  t.end();
});

test('incrementTaskAttempts with no tasks and no task & no attempts, sets it to one', t => {
  const o = {};
  const taskName = 'task2';
  const o1  = incrementTaskAttempts(o, 'tasks', taskName);
  t.equal(o1, o, 'same object');
  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  t.equal(taskAttempts, 1, `task ${taskName} attempts must be one`);
  t.ok(o.tasks, 'o.tasks must be defined');
  t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
  t.ok(o.tasks[taskName].attempts, `o.tasks[${taskName}].attempts must be defined`);
  t.end();
});

test('incrementTaskAttempts with tasks, but no task, sets it to one', t => {
  const o = { tasks: { task1: {} } };
  const taskName = 'task2';
  const o1 = incrementTaskAttempts(o, 'tasks', taskName);
  t.equal(o1, o, 'same object');
  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  t.equal(taskAttempts, 1, `task ${taskName} attempts must be one`);
  t.ok(o.tasks, 'o.tasks must be defined');
  t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
  t.ok(o.tasks[taskName].attempts, `o.tasks[${taskName}].attempts must be defined`);
  t.end();
});

test('incrementTaskAttempts with defined task attempts, increments it', t => {
  const taskName = 'task1';
  const attempts = 77;
  const o = { tasks: { [taskName]: { attempts: attempts} } };
  const o1 = incrementTaskAttempts(o, 'tasks', taskName);
  t.equal(o1, o, 'same object');
  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  t.ok(taskAttempts, `task ${taskName} attempts must be defined`);
  t.equal(taskAttempts, attempts + 1, `task ${taskName} attempts is original plus one`);

  const o2 = incrementTaskAttempts(o, 'tasks', taskName);
  t.equal(o2, o, 'same object');
  const taskAttempts2 = getTaskAttempts(o, 'tasks', taskName);
  t.equal(taskAttempts2, attempts + 2, `task ${taskName} attempts is original plus two`);
  t.end();
});


test('setTaskStatus with no tasks and no task & no status and incrementAttempts true, updates the status and attempts to 1', t => {
  const o = {};
  const taskName = 'task2';
  const status = new Failure('Missing');
  const o1 = setTaskStatus(o, 'tasks', taskName, status, true);
  t.equal(o1, o, 'same object');

  const taskStatus = getTaskStatus(o, 'tasks', taskName);
  t.equal(taskStatus, status, `task ${taskName} status must match`);

  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  t.equal(taskAttempts, 1, `task ${taskName} status must be one`);

  t.ok(o.tasks, 'o.tasks must be defined');
  t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
  t.ok(o.tasks[taskName].status, `o.tasks[${taskName}].status must be defined`);
  t.end();
});

test('setTaskStatus with tasks, but no task and incrementAttempts true, updates the status and attempts to 1', t => {
  const o = { tasks: { task1: {} } };
  const taskName = 'task2';
  const status = new Success('Exists');
  const o1 = setTaskStatus(o, 'tasks', taskName, status, true);
  t.equal(o1, o, 'same object');

  const taskStatus = getTaskStatus(o, 'tasks', taskName);
  t.equal(taskStatus, status, `task ${taskName} status must match`);

  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  t.equal(taskAttempts, 1, `task ${taskName} attempts must be one`);

  t.ok(o.tasks, 'o.tasks must be defined');
  t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
  t.ok(o.tasks[taskName].status, `o.tasks[${taskName}].status must be defined`);
  t.ok(o.tasks[taskName].attempts, `o.tasks[${taskName}].attempts must be defined`);
  t.end();
});

test('setTaskStatus with defined task status and attempts and incrementAttempts true, updates the status and increments the attempts', t => {
  const taskName = 'task1';
  const status = new Failed(new Error('Thump'));
  const attempts = 69;
  const o = { tasks: { [taskName]: { status: INCOMPLETE, attempts: attempts } } };
  const o1 = setTaskStatus(o, 'tasks', taskName, status, true);
  t.equal(o1, o, 'same object');

  const taskStatus = getTaskStatus(o, 'tasks', taskName);
  t.equal(taskStatus, status, `task ${taskName} status must match`);

  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  t.ok(taskAttempts, `task ${taskName} attempts must be defined`);
  t.equal(taskAttempts, attempts + 1, `task ${taskName} attempts is original plus one`);

  // Simulate a reset at start of 2nd run
  setTaskStatus(o, 'tasks', taskName, INCOMPLETE, false);

  const status2 = SUCCEEDED;
  const o2 = setTaskStatus(o, 'tasks', taskName, status2, true);
  t.equal(o2, o, 'same object');

  const taskStatus2 = getTaskStatus(o, 'tasks', taskName);
  t.equal(taskStatus2, status2, `task ${taskName} status 2 must match`);

  const taskAttempts2 = getTaskAttempts(o, 'tasks', taskName);
  t.equal(taskAttempts2, attempts + 2, `task ${taskName} attempts is original plus two`);
  t.end();
});

test('setTaskStatus with no tasks and no task & no status and incrementAttempts false, updates the status only', t => {
  const o = {};
  const taskName = 'task2';
  const status = new Failure('Missing');
  const o1 = setTaskStatus(o, 'tasks', taskName, status, false);
  t.equal(o1, o, 'same object');

  const taskStatus = getTaskStatus(o, 'tasks', taskName);
  t.equal(taskStatus, status, `task ${taskName} status must match`);

  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  t.notOk(taskAttempts, `task ${taskName} attempts must not be defined`);
  t.equal(taskAttempts, 0, `task ${taskName} attempts is zero`);

  t.ok(o.tasks, 'o.tasks must be defined');
  t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
  t.ok(o.tasks[taskName].status, `o.tasks[${taskName}].status must be defined`);
  t.notOk(o.tasks[taskName].attempts, `o.tasks[${taskName}].attempts must not be defined yet`);
  t.end();
});

test('setTaskStatus with tasks, but no task and incrementAttempts false, updates the status only', t => {
  const o = { tasks: { task1: {} } };
  const taskName = 'task2';
  const status = new Success('Exists');
  const o1 = setTaskStatus(o, 'tasks', taskName, status, false);
  t.equal(o1, o, 'same object');

  const taskStatus = getTaskStatus(o, 'tasks', taskName);
  t.equal(taskStatus, status, `task ${taskName} status must match`);

  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  t.notOk(taskAttempts, `task ${taskName} attempts must not be defined`);
  t.equal(taskAttempts, 0, `task ${taskName} attempts is zero`);

  t.ok(o.tasks, 'o.tasks must be defined');
  t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
  t.ok(o.tasks[taskName].status, `o.tasks[${taskName}].status must be defined`);
  t.notOk(o.tasks[taskName].attempts, `o.tasks[${taskName}].attempts must not be defined yet`);
  t.end();
});

test('setTaskStatus with defined task status and attempts and incrementAttempts false, updates the status only', t => {
  const taskName = 'task1';
  const status = new Failed(new Error('Thump'));
  const attempts = 69;
  const o = { tasks: { [taskName]: { status: status, attempts: attempts } } };
  const o1 = setTaskStatus(o, 'tasks', taskName, status, false);
  t.equal(o1, o, 'same object');

  const taskStatus = getTaskStatus(o, 'tasks', taskName);
  t.equal(taskStatus, status, `task ${taskName} status must match`);

  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  t.equal(taskAttempts, attempts, `task ${taskName} attempts still has original value`);

  const status2 = SUCCEEDED;
  const o2 = setTaskStatus(o, 'tasks', taskName, status2, false);
  t.equal(o2, o, 'same object');

  const taskStatus2 = getTaskStatus(o, 'tasks', taskName);
  t.equal(taskStatus2, status2, `task ${taskName} status must match`);

  const taskAttempts2 = getTaskAttempts(o, 'tasks', taskName);
  t.equal(taskAttempts2, attempts, `task ${taskName} attempts 2 still has original value`);
  t.end();
});

test('setTaskStatusDetails with defined task status and attempts and incrementAttempts true, updates the status and increments the attempts', t => {
  const taskName = 'task1';
  const code = 'Failed';
  const error = new Error('Thump');
  const status = new Failed(error);
  const attempts = 69;
  const o = { tasks: { [taskName]: { status: INCOMPLETE, attempts: attempts } } };

  // Update #1
  const o1 = setTaskStatusDetails(o, 'tasks', taskName, code, false, error, true);
  t.equal(o1, o, 'same object');

  const taskStatus = getTaskStatus(o, 'tasks', taskName);
  t.deepEqual(taskStatus, status, `task ${taskName} status must match`);

  const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
  t.ok(taskAttempts, `task ${taskName} attempts must be defined`);
  t.equal(taskAttempts, attempts + 1, `task ${taskName} attempts is original plus one`);

  // Simulate a new run by resetting the task status back to incomplete
  setTaskStatus(o, 'tasks', taskName, INCOMPLETE, false);

  const code2 = SUCCEEDED_CODE;
  const status2 = SUCCEEDED;
  // Update #2
  const o2 = setTaskStatusDetails(o, 'tasks', taskName, code2, true, undefined, false);
  t.equal(o2, o, 'same object');

  const taskStatus2 = getTaskStatus(o, 'tasks', taskName);
  t.deepEqual(taskStatus2, status2, `task ${taskName} status 2 must match`);

  const taskAttempts2 = getTaskAttempts(o, 'tasks', taskName);
  t.equal(taskAttempts2, attempts + 1, `task ${taskName} attempts 2 is still original plus one`);
  t.end();
});

test('setTaskResult with no tasks and no task & no result, updates the result', t => {
  const o = {};
  const taskName = 'task2';
  const result = 1.2345;
  const o1 = setTaskResult(o, 'tasks', taskName, result);
  t.equal(o1, o, 'same object');

  const taskResult = getTaskResult(o, 'tasks', taskName);
  t.equal(taskResult, result, `task ${taskName} result must match`);

  t.ok(o.tasks, 'o.tasks must be defined');
  t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
  t.ok(o.tasks[taskName].result, `o.tasks[${taskName}].result must be defined`);
  t.end();
});

test('setTaskResult with tasks, but no task & no result, updates the result', t => {
  const o = { tasks: { task1: {} } };
  const taskName = 'task2';
  const result = 4.567;
  const o1 = setTaskResult(o, 'tasks', taskName, result);
  t.equal(o1, o, 'same object');

  const taskResult = getTaskResult(o, 'tasks', taskName);
  t.equal(taskResult, result, `task ${taskName} result must match`);

  t.ok(o.tasks, 'o.tasks must be defined');
  t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
  t.ok(o.tasks[taskName].result, `o.tasks[${taskName}].result must be defined`);
  t.end();
});

test('setTaskResult with defined task result, updates the result', t => {
  const taskName = 'task1';
  const result = 7.89;
  const o = { tasks: { [taskName]: { result: result } } };
  const o1 = setTaskResult(o, 'tasks', taskName, result);
  t.equal(o1, o, 'same object');

  const taskResult = getTaskResult(o, 'tasks', taskName);
  t.equal(taskResult, result, `task ${taskName} result must match`);

  const result2 = result * 2;
  const o2 = setTaskResult(o, 'tasks', taskName, result2);
  t.equal(o2, o, 'same object');

  const taskResult2 = getTaskResult(o, 'tasks', taskName);
  t.equal(taskResult2, result2, `task ${taskName} result 2 must match`);
  t.end();
});

test('setTaskProperty with no tasks and no task & no property value, updates the property value', t => {
  const o = {};
  const taskName = 'task2';
  const propertyName = 'propertyName53';
  const propertyValue = 2.999;
  const o1 = setTaskProperty(o, 'tasks', taskName, propertyName, propertyValue);
  t.equal(o1, o, 'same object');

  const taskPropertyValue = getTaskProperty(o, 'tasks', taskName, propertyName);
  t.equal(taskPropertyValue, propertyValue, `task ${taskName} ${propertyName} value must match`);

  t.ok(o.tasks, 'o.tasks must be defined');
  t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
  t.ok(o.tasks[taskName][propertyName], `o.tasks[${taskName}][${propertyName}] value must be defined`);
  t.end();
});

test('setTaskProperty with tasks, but no task & no propertyValue, updates the propertyValue', t => {
  const o = { tasks: { task1: {} } };
  const taskName = 'task2';
  const propertyName = 'propertyName54';
  const propertyValue = 4.999;
  const o1 = setTaskProperty(o, 'tasks', taskName, propertyName, propertyValue);
  t.equal(o1, o, 'same object');

  const taskPropertyValue = getTaskProperty(o, 'tasks', taskName, propertyName);
  t.equal(taskPropertyValue, propertyValue, `task ${taskName} ${propertyName} value must match`);

  t.ok(o.tasks, 'o.tasks must be defined');
  t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
  t.ok(o.tasks[taskName][propertyName], `o.tasks[${taskName}][${propertyName}] value must be defined`);
  t.end();
});

test('setTaskProperty with defined task propertyValue, updates the propertyValue', t => {
  const taskName = 'task1';
  const propertyName = 'propertyName55';
  const propertyValue = 7.999;
  const o = { tasks: { [taskName]: { propertyValue: propertyValue } } };
  const o1 = setTaskProperty(o, 'tasks', taskName, propertyName, propertyValue);
  t.equal(o1, o, 'same object');

  const taskPropertyValue = getTaskProperty(o, 'tasks', taskName, propertyName);
  t.equal(taskPropertyValue, propertyValue, `task ${taskName} ${propertyName} value must match`);

  const propertyValue2 = propertyValue * 2;
  const o2 = setTaskProperty(o, 'tasks', taskName, propertyName, propertyValue2);
  t.equal(o2, o, 'same object');

  const taskPropertyValue2 = getTaskProperty(o, 'tasks', taskName, propertyName);
  t.equal(taskPropertyValue2, propertyValue2, `task ${taskName} ${propertyName} value must match`);
  t.end();
});


