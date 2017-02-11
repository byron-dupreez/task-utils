'use strict';

/**
 * Unit tests for task-utils/tasks.js
 * @author Byron du Preez
 */

const test = require("tape");

// The test subjects
const Task = require('../tasks');
const TaskFactory = require('../task-factory');

const TaskDef = require('../task-defs');
const states = require('../task-states');
const TaskState = states.TaskState;

const taskFactory1 = new TaskFactory(console, {returnSuccessOrFailure: false});
const taskFactory2 = new TaskFactory(console, {returnSuccessOrFailure: true});

// Run with various opts values
const optsList = [
  undefined,
  // null,
  // [],
  // {},
  // {returnSuccessOrFailure: null},
  // {returnSuccessOrFailure: 'BLUE'},
  // {returnSuccessOrFailure: new Boolean(0)}, // false
  // {returnSuccessOrFailure: new Boolean('BLUE')}, // true
  {returnSuccessOrFailure: false},
  {returnSuccessOrFailure: true}
];

const Booleans = require('core-functions/booleans');
const isTrueOrFalse = Booleans.isTrueOrFalse;

const Strings = require('core-functions/strings');
const stringify = Strings.stringify;

// const Action = {
//   COMPLETE: 'COMPLETE',
//   SUCCEED: 'SUCCEED',
//   REJECT: 'REJECT',
//   FAIL: 'FAIL',
//   NONE: 'NONE'
// };

function execute1() {
  console.log(`Executing execute1 on task (${this.name})`);
}
function execute2() {
  console.log(`Executing execute2 on task (${this.name})`);
}

function defineSimpleTask(name) {
  return TaskDef.defineTask(`Task ${name}`, execute1);
}

function defineComplexTask(name) {
  const taskDef = defineSimpleTask();
  const subTaskDef = taskDef.defineSubTask(`SubTask ${name}1`, execute2);
  subTaskDef.defineSubTasks([`SubTask ${name}1a`, `SubTask ${name}1b`]);
  return taskDef;
}

// Create a simple task from a simple task definition
function createSimpleTask(name) {
  const factory = taskFactory1;
  const opts = undefined;
  return factory.createTask(defineSimpleTask(name), opts);
}

function checkTask(t, task, taskDef, factory, optsPerLevel, mustBeExecutable, prefix) {
  const opts = Array.isArray(optsPerLevel) ? optsPerLevel[0] : optsPerLevel;
  const optsRest = Array.isArray(optsPerLevel) ? optsPerLevel.slice(1) : optsPerLevel;

  if (taskDef instanceof TaskDef && task instanceof Task) {
    t.ok(task, `${prefix} ${task.name} must be defined`);
    const taskName = Strings.trim(taskDef.name);
    t.equal(task.name, taskName, `task.name must be ${taskName}`);
    t.equal(!!task.execute, mustBeExecutable, `task.execute must be ${mustBeExecutable ? '' : 'un'}defined`);
    t.equal(!!task.parent, !!taskDef.parent, `parent must be ${!!taskDef.parent ? '' : 'un'}defined`);
    t.equal(task.factory, factory, `task.factory must be ${factory}`);

    checkExecutable(t, task, mustBeExecutable);
    checkOpts(t, task, task.parent, opts);

    // Ensure immutable
    t.throws(() => task.name = -1, TypeError, 'task.name must be immutable');
    t.throws(() => task.definition = -1, TypeError, 'task.definition must be immutable');
    t.throws(() => task.parent = -1, TypeError, 'task.parent must be immutable');
    t.throws(() => task.factory = -1, TypeError, 'task.factory must be immutable');
    t.throws(() => task._opts = -1, TypeError, 'task._opts must be immutable');
    t.throws(() => task.executable = -1, TypeError, 'task.executable must be immutable');
    t.throws(() => task.execute = -1, TypeError, 'task.execute must be immutable');
    t.throws(() => task.returnSuccessOrFailure = -1, TypeError, 'task.returnSuccessOrFailure must be immutable');
    t.throws(() => task._subTasks = -1, TypeError, 'task._subTasks must be immutable');
    t.throws(() => task._subTasksByName = -1, TypeError, 'task._subTasksByName must be immutable');

    if (task.parent) {
      const self = task.parent.subTasks.find(t => t.name === taskName);
      t.equal(task, self, `Parent (${task.parent.name}) contains new task (${taskName})`);
    }
    // Check all of the subtasks recursively too
    for (let i = 0; i < taskDef.subTaskDefs.length; ++i) {
      const subTaskDef = taskDef.subTaskDefs[i];
      const subTask = task.subTasks[i];
      t.ok(subTask.isSubTask(), `task (${task.name} sub-task (${subTask.name}) must be isSubTask`);
      checkTask(t, subTask, subTaskDef, factory, optsRest, subTaskDef.executable, prefix);
    }
  }
}

function checkExecutable(t, task, expectedExecutable) {
  t.equal(task.executable, expectedExecutable, `${task.name}.executable must be ${expectedExecutable}`);
  t.equal(task.isExecutable(), expectedExecutable, `${task.name}.isExecutable must be ${expectedExecutable}`);
  t.equal(task.isNotExecutable(), !expectedExecutable, `${task.name}.isNotExecutable must be ${!expectedExecutable}`);
  t.equal(task.isInternal(), !expectedExecutable, `${task.name}.isInternal must be ${!expectedExecutable}`);
}

function checkOpts(t, task, parent, opts) {
  const expectedOpts = opts ? opts : parent ? parent._opts : undefined;
  t.equal(task._opts, expectedOpts, `${task.name} _opts must be expected ${stringify(opts)}`);

  const returnSuccessOrFailure = expectedOpts && isTrueOrFalse(expectedOpts.returnSuccessOrFailure) ?
    !!expectedOpts.returnSuccessOrFailure : undefined;

  t.equal(task.returnSuccessOrFailure, returnSuccessOrFailure, `${task.name} returnSuccessOrFailure must be ${stringify(returnSuccessOrFailure)}`);
}

// =====================================================================================================================
// createTask
// =====================================================================================================================


test('createTask', t => {
  function check(factory, taskDef, optsPerLevel, mustPass, mustBeExecutable) {
    const opts = Array.isArray(optsPerLevel) ? optsPerLevel[0] : optsPerLevel;
    const prefix = `############ createTask(${taskDef ? taskDef.name : taskDef}, ${stringify(opts)})`;
    try {
      const task = factory.createTask(taskDef, opts);
      if (mustPass) {
        t.pass(`${prefix} must pass`);
        t.ok(task, 'task must be created');
      } else {
        t.fail(`${prefix} must fail - (${stringify(task)})`);
        t.notOk(task, `${prefix} must not be created`);
      }

      checkTask(t, task, taskDef, factory, optsPerLevel, mustBeExecutable, prefix);
      return task;

    } catch (err) {
      if (mustPass) {
        t.fail(`${prefix} must pass - (${stringify(err)}) - ${err.stack}`)
      } else {
        t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err.stack}`)
      }
      return undefined;
    }
  }

  function checkCreatedTask(task, taskDef, factory, optsPerLevel, mustBeExecutable) {
    const opts = Array.isArray(optsPerLevel) ? optsPerLevel[0] : optsPerLevel;
    const prefix = `############ createTask(${taskDef ? taskDef.name : taskDef}, ${stringify(opts)})`;
    checkTask(t, task, taskDef, factory, optsPerLevel, mustBeExecutable, prefix);
    return task;
  }

  let factory = taskFactory1;

  // Test opts permutations - simple task
  const simpleTaskDef = defineSimpleTask('A');
  for (let i = 0; i < optsList.length; ++i) {
    const opts = optsList[i];
    check(factory, simpleTaskDef, [opts], true, true);
  }

  // Test opts permutations - complex task - with top-level opts that must flow down to all sub-tasks
  const complexTaskDef = defineComplexTask('B');
  for (let i = 0; i < optsList.length; ++i) {
    const opts = optsList[i];
    check(factory, complexTaskDef, [opts, opts, opts], true, true);
  }

  // Test opts permutations - complex task - with NO top-level opts, but sub-task opts
  for (let i = 0; i < optsList.length; ++i) {
    const opts = optsList[i];
    const task = factory.createTask(defineSimpleTask('C'), undefined);
    const subTask = task.createSubTask('SubTask C1', execute2, opts);
    subTask.createSubTask('SubTask C1a', execute2, opts);
    checkCreatedTask(task, task.definition, factory, [undefined, opts, opts], true);
  }

  // Test opts permutations - complex task - with NO parent opts at all and only leaf sub-task opts
  for (let i = 0; i < optsList.length; ++i) {
    const opts = optsList[i];
    const task = factory.createTask(defineSimpleTask('D'), undefined);
    const subTask = task.createSubTask('SubTask D1', execute2, undefined);
    subTask.createSubTask('SubTask D1a', execute1, opts);
    checkCreatedTask(t, task, task.definition, factory, [undefined, undefined, opts], true, undefined);
  }

  // Test opts permutations - complex task - with opts only at depth 1
  for (let i = 0; i < optsList.length; ++i) {
    const opts = optsList[i];
    const task = factory.createTask(defineSimpleTask('D'), undefined);
    const subTask = task.createSubTask('SubTask D1', execute2, opts);
    subTask.createSubTask('SubTask D1a', execute1, undefined);
    checkCreatedTask(t, task, task.definition, factory, [undefined, opts, opts], true, undefined);
  }

  t.end();
});

// =====================================================================================================================
// new Task
// =====================================================================================================================

test('new Task', t => {
  function check(taskDef, parent, factory, opts, mustPass, mustBeExecutable) {
    const prefix = `new Task(${taskDef ? taskDef.name : taskDef}, ${stringify(parent ? parent.name : parent)}, ${stringify(factory)}, ${opts})`;
    try {
      const task = new Task(taskDef, parent, factory, opts);
      if (mustPass) {
        t.pass(`${prefix} must pass`);
      } else {
        t.fail(`${prefix} must fail - (${stringify(task)})`)
      }
      t.equal(!!task, mustPass, `must ${mustPass ? '' : 'not '}be created`);
      checkTask(t, task, taskDef, factory, opts, mustBeExecutable, prefix);
      return task;

    } catch (err) {
      if (mustPass) {
        t.fail(`${prefix} must pass - (${stringify(err)}) - ${err.stack}`)
      } else {
        t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err.stack}`)
      }
      return undefined;
    }
  }

  const factory = taskFactory2;
  const opts = undefined;

  // Task with bad definition
  check(undefined, undefined, factory, opts, false, true);
  check(undefined, undefined, factory, opts, false, true);
  check(null, undefined, factory, opts, false, true);
  check({name: 'Bob'}, undefined, factory, opts, false, true);
  check(1, undefined, factory, opts, false, true);
  check('', undefined, factory, opts, false, true);
  check([], undefined, factory, opts, false, true);
  check(defineSimpleTask('A'), undefined, undefined, opts, false, true); // missing factory

  // Simple task with no internal subtasks
  const taskA = check(defineSimpleTask('A'), undefined, factory, opts, true, true);

  // Add a subtask B to Task A
  const subTaskDefB = new TaskDef('SubTask B', undefined, taskA.definition);
  const subTaskB = check(subTaskDefB, taskA, factory, opts, true, false);
  t.equal(subTaskB.subTasks.length, 0, `SubTask (${subTaskB.name}) subTasks length must be 0`);
  t.equal(taskA.subTasks.length, 1, `Task (${taskA.name}) subTasks length must be 1`);

  // Add a subtask B1 to SubTask B
  const subTaskDefB1 = new TaskDef('SubTask B1', undefined, subTaskB.definition);
  const subTaskB1 = check(subTaskDefB1, subTaskB, factory, opts, true, false);
  t.equal(subTaskB1.subTasks.length, 0, `SubTask (${subTaskB1.name}) subTasks length must be 0`);
  t.equal(subTaskB.subTasks.length, 1, `SubTask (${subTaskB.name}) subTasks length must be 1`);
  t.equal(taskA.subTasks.length, 1, `Task (${taskA.name}) subTasks length must be 1`);

  // Add another subtask C to Task A
  const subTaskDefC = new TaskDef('SubTask C', undefined, taskA.definition);
  const subTaskC = check(subTaskDefC, taskA, factory, opts, true, false);
  t.equal(subTaskC.subTasks.length, 0, `SubTask (${subTaskC.name}) subTasks length must be 0`);
  t.equal(taskA.subTasks.length, 2, `Task (${taskA.name}) subTasks length must be 2`);

  // Ensure duplicates are not possible
  check(subTaskDefB, taskA, factory, opts, false, false);
  check(subTaskDefB1, subTaskB, factory, opts, false, false);
  check(subTaskDefC, taskA, factory, opts, false, false);

  t.end();
});

// =====================================================================================================================
// reconstructTasksFromRootTaskLike
// =====================================================================================================================

test('reconstructTasksFromRootTaskLike', t => {
  function check(factory, taskBefore, opts, mustPass, mustBeExecutable) {
    // Serialize and deserialize it to convert it into a task-like object
    const json = JSON.stringify(taskBefore);
    const taskLike = JSON.parse(json);
    t.deepEqual(TaskState.toTaskStateFromStateLike(taskLike.state), taskBefore.state, `TaskLike state must be ${taskBefore.state.name}`);
    t.equal(taskLike.attempts, taskBefore.attempts, `TaskLike attempts must be ${taskBefore.attempts}`);
    t.equal(taskLike.totalAttempts, taskBefore.totalAttempts, `TaskLike totalAttempts must be ${taskBefore.totalAttempts}`);

    //t.ok(!(taskLike instanceof Task), `taskLike (${JSON.stringify(taskLike)}) must not be an instanceof Task`);
    t.ok(!(taskLike instanceof Task), `taskLike must not be an instanceof Task`);

    const prefix = `reconstructTasksFromRootTaskLike(${taskLike ? taskLike.name : taskLike})`;

    try {
      const taskAfter = factory.reconstructTasksFromRootTaskLike(taskLike, opts);
      if (mustPass) {
        t.pass(`${prefix} must pass`);
      } else {
        t.fail(`${prefix} must fail - (${stringify(taskAfter)})`);
      }
      t.equal(!!taskAfter, mustPass, `${taskAfter ? taskAfter.name : taskAfter} must ${mustPass ? '' : 'not '}be reconstructed`);
      checkTask(t, taskAfter, taskAfter.definition, factory, opts, mustBeExecutable, undefined);
      t.deepEqual(taskAfter, taskBefore, `taskAfter (${taskAfter.name}) must be taskBefore`);
      return taskAfter;

    } catch (err) {
      if (mustPass) {
        t.fail(`${prefix} must pass - (${stringify(err)}) - ${err.stack}`);
      } else {
        t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err.stack}`)
      }
      return undefined;
    }
  }

  const factory = taskFactory1;
  const opts = undefined;

  // Create a simple task from a simple task definition
  const taskDefA = defineSimpleTask('A');
  const taskA = factory.createTask(taskDefA, opts);
  // unstarted
  check(factory, taskA, opts, true, true);

  // fail it
  taskA.failAs('Failure', new Error("Feeling ill"));
  check(factory, taskA, opts, true, true);

  // succeed it
  taskA.completeAs('Ok', undefined, true);
  check(factory, taskA, opts, true, true);

  // Create a complex task from a complex task definition
  const taskDefB = TaskDef.defineTask('Task B', execute1);
  const subTaskDefsB = taskDefB.defineSubTasks(['SubTask B1', 'SubTask B2', 'SubTask B3']);
  const subTaskDefB1 = subTaskDefsB[0];
  subTaskDefB1.defineSubTasks(['SubTask B1a', 'SubTask B1b', 'SubTask B1c']);
  const subTaskDefB2 = subTaskDefsB[1];
  subTaskDefB2.defineSubTasks(['SubTask B2a', 'SubTask B2b']);

  const taskB = factory.createTask(taskDefB, opts);
  check(factory, taskB, opts, true, true);

  taskB.abandon('Dead', new Error("Black plague"), true);
  check(factory, taskB, opts, true, true);

  t.end();
});

// =====================================================================================================================
// task state changes
// =====================================================================================================================

test('task state initial', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.notOk(task.started, `${task.name} must NOT be started`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task start()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.notOk(task.started, `${task.name} must NOT be started`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  // Start it
  task.start(new Date(), true);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.started, `${task.name} must be started`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  // Reset it
  task.reset();

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.notOk(task.started, `${task.name} must NOT be started`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  // Restart it (again)
  task.start(new Date(), true);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.started, `${task.name} must be started`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.equal(task.attempts, 2, `${task.name} attempts must be 2`);

  t.end();
});


test('task succeed()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  // Complete it
  task.succeed(undefined, true);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task completeAs()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  // Complete it
  task.completeAs('MySuccessState', undefined, true);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task timeout()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  // Time it out
  task.timeout(new Error('Boom'), true);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.ok(task.timedOut, `${task.name} must be timedOut`);
  t.notOk(task.failed, `${task.name} must not be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task timeoutAs()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  // Fail it
  task.timeoutAs('MyTimeoutState', new Error('Boom'), true);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.ok(task.timedOut, `${task.name} must be timedOut`);
  t.notOk(task.failed, `${task.name} must not be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task fail()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  // Fail it
  task.fail(new Error('Boom'));

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.ok(task.failed, `${task.name} must be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task failAs()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  // Fail it
  task.failAs('MyFailureState', new Error('Boom'));

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.ok(task.failed, `${task.name} must be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task reject()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  // Reject it
  task.reject('Rotten', new Error('Yuck'), false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task discard()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  // Reject it
  task.discard('AttemptsExceeded', undefined, false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.ok(task.isDiscarded(), `${task.name} must be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});


test('task abandon()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  // Reject it
  task.abandon('Forgotten', undefined, false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.ok(task.isAbandoned(), `${task.name} must be Abandoned`);

  t.end();
});

test('task complete() and timeout() with and without overrideCompleted and overrideTimedOut flags', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.ok(task.unstarted, `${task.name} must be unstarted`);

  // Start it
  task.start(new Date());

  t.ok(task.started, `${task.name} must be started`);

  // Time it out with overrideCompleted false
  task.timeout(new Error('Boom'), false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.ok(task.timedOut, `${task.name} must be timed out`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Fail to complete it with overrideTimedOut false
  task.complete(undefined, false);

  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.ok(task.timedOut, `${task.name} must be timed out`);

  // Complete it with overrideTimedOut true
  task.complete(undefined, true);

  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.timedOut, `${task.name} must NOT be timed out`);

  // Fail to time it out with overrideCompleted false
  task.timeout(new Error('Boom'), false);

  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.timedOut, `${task.name} must NOT be timed out`);

  // Time it out with overrideCompleted true
  task.timeout(new Error('Boom'), true);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.ok(task.timedOut, `${task.name} must be timed out`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Reset the task, so that we can re-attempt complete() with overrideTimedOut false
  task.reset();

  // Re-complete it with overrideTimedOut false
  task.complete(undefined, false);

  t.notOk(task.unstarted, `${task.name} must not be unstarted`);
  t.notOk(task.incomplete, `${task.name} must not be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must not be failed`);
  t.notOk(task.rejected, `${task.name} must not be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task succeed() and timeoutAs() with and without overrideCompleted and overrideTimedOut flags', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  const stateName = 'MyTimedOutState';

  // Time it out with overrideCompleted false
  task.timeoutAs(stateName, new Error('Boom'), false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.ok(task.timedOut, `${task.name} must be timed out`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Fail to complete it with overrideTimedOut false
  task.succeed(undefined, false);

  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.ok(task.timedOut, `${task.name} must be timed out`);

  // Complete it with overrideTimedOut true
  task.succeed(undefined, true);

  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.timedOut, `${task.name} must NOT be timed out`);

  // Fail to time it out with overrideCompleted false
  task.timeoutAs(stateName, new Error('Boom'), false);

  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.timedOut, `${task.name} must NOT be timed out`);

  // Time it out with overrideCompleted true
  task.timeoutAs(stateName, new Error('Boom'), true);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.ok(task.timedOut, `${task.name} must be timed out`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Reset the task, so that we can attempt succeed() with overrideTimedOut false
  task.reset();

  // Re-complete it with overrideTimedOut false
  task.succeed(undefined, false);

  t.notOk(task.unstarted, `${task.name} must not be unstarted`);
  t.notOk(task.incomplete, `${task.name} must not be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must not be failed`);
  t.notOk(task.rejected, `${task.name} must not be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task succeed() then fail() then succeed()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.ok(task.unstarted, `${task.name} must be unstarted`);

  // Start it
  task.start(new Date());

  t.ok(task.started, `${task.name} must be started`);

  // Complete it
  task.succeed(undefined, true);

  t.ok(task.completed, `${task.name} must be completed`);

  // Fail it
  task.fail(new Error('Boom'));

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.ok(task.failed, `${task.name} must be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Re-complete it
  task.succeed(undefined, true);

  t.notOk(task.unstarted, `${task.name} must not be unstarted`);
  t.notOk(task.incomplete, `${task.name} must not be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must not be failed`);
  t.notOk(task.rejected, `${task.name} must not be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task succeed() then cannot reject()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.ok(task.unstarted, `${task.name} must be unstarted`);

  // // Start it
  // task.start(new Date());
  //
  // t.ok(task.started, `${task.name} must be started`);

  // Complete it
  task.succeed(undefined, true);

  t.ok(task.completed, `${task.name} must be completed`);

  // Cannot reject it
  task.reject('Rotten', new Error('Yuck'), false);

  t.notOk(task.unstarted, `${task.name} must not be unstarted`);
  t.notOk(task.incomplete, `${task.name} must not be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must not be failed`);
  t.notOk(task.rejected, `${task.name} must not be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task timeout() then succeed()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.ok(task.unstarted, `${task.name} must be unstarted`);

  // Start it
  task.start(new Date());

  t.ok(task.started, `${task.name} must be started`);

  // Time it out
  task.timeout(new Error('Boom'), true);

  // Complete it
  task.succeed(undefined, true);

  t.notOk(task.unstarted, `${task.name} must not be unstarted`);
  t.notOk(task.incomplete, `${task.name} must not be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must not be failed`);
  t.notOk(task.rejected, `${task.name} must not be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task timeout() then reject()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.ok(task.unstarted, `${task.name} must be unstarted`);

  // Start it
  task.start(new Date());

  t.ok(task.started, `${task.name} must be started`);

  // Time it out
  task.timeout(new Error('Boom'), true);

  // Reject it
  task.reject('Rotten', new Error('Yuck'), false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task fail() then succeed()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.ok(task.unstarted, `${task.name} must be unstarted`);

  // Start it
  task.start(new Date());

  t.ok(task.started, `${task.name} must be started`);

  // Fail it
  task.fail(new Error('Boom'));

  // Complete it
  task.succeed(undefined, true);

  t.notOk(task.unstarted, `${task.name} must not be unstarted`);
  t.notOk(task.incomplete, `${task.name} must not be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must not be failed`);
  t.notOk(task.rejected, `${task.name} must not be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task fail() then reject()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.ok(task.unstarted, `${task.name} must be unstarted`);

  // Start it
  task.start(new Date());

  t.ok(task.started, `${task.name} must be started`);

  // Fail it
  task.fail(new Error('Boom'));

  // Reject it
  task.reject('Rotten', new Error('Yuck'), false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task reject() then cannot succeed(), cannot fail(), cannot timeout()', t => {
// Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.ok(task.unstarted, `${task.name} must be unstarted`);

  // Start it
  task.start(new Date());

  t.ok(task.started, `${task.name} must be started`);

  // Reject it
  task.reject('Rotten', new Error('Yuck'), false);

  t.ok(task.rejected, `${task.name} must be rejected`);

  // Cannot complete it
  task.succeed(undefined, true);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Cannot fail it
  task.fail(new Error('Boom'));

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Cannot time it out
  task.timeout(new Error('Boom'), true);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task succeed() then fail() then reject() then cannot succeed(), cannot fail()', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.ok(task.unstarted, `${task.name} must be unstarted`);

  // Start it
  task.start(new Date());

  t.ok(task.started, `${task.name} must be started`);

  // Complete it
  task.succeed(undefined, true);

  t.ok(task.completed, `${task.name} must be completed`);

  // Fail it
  task.fail(new Error('Boom'));

  t.ok(task.failed, `${task.name} must be failed`);

  // Reject it
  task.reject('Rotten', new Error('Yuck'), false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Cannot re-complete it
  task.succeed(undefined, true);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Cannot re-fail it
  task.fail(new Error('Boom'));

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

// =====================================================================================================================
// task starts with resets
// =====================================================================================================================

test('task starts with resets', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);
  t.equal(task.totalAttempts, 0, `${task.name} totalAttempts must be 0`);
  t.equal(task.lastExecutedAt, '', `${task.name} lastExecutedAt must be ''`);

  let dt = '2016-11-27T17:10:00.000Z';
  task.start(dt);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);
  t.equal(task.totalAttempts, 1, `${task.name} totalAttempts must be 1`);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be ${dt}`);

  task.start(new Date());
  t.equal(task.attempts, 1, `${task.name} attempts must still be 1`);
  t.equal(task.totalAttempts, 1, `${task.name} totalAttempts must still be 1`);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be ${dt}`);

  task.reset();
  dt = '2016-11-27T17:10:00.111Z';
  task.start(dt);
  t.equal(task.attempts, 2, `${task.name} attempts must be 2`);
  t.equal(task.totalAttempts, 2, `${task.name} totalAttempts must be 2`);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be ${dt}`);

  task.reset();
  dt = '2016-11-27T17:10:00.222Z';
  task.start(dt);
  t.equal(task.attempts, 3, `${task.name} attempts must be 3`);
  t.equal(task.totalAttempts, 3, `${task.name} totalAttempts must be 3`);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be ${dt}`);

  task.decrementAttempts(); // DECREMENT
  t.equal(task.attempts, 2, `${task.name} attempts must be 2`);
  t.equal(task.totalAttempts, 3, `${task.name} totalAttempts must be 3`);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be ${dt}`);

  task.reset();
  dt = '2016-11-27T17:10:00.333Z';
  task.start(dt);
  t.equal(task.attempts, 3, `${task.name} attempts must be 3`);
  t.equal(task.totalAttempts, 4, `${task.name} totalAttempts must be 4`);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be ${dt}`);

  // Complete it
  task.succeed(undefined, true);

  task.start(new Date());
  t.equal(task.attempts, 3, `${task.name} attempts must still be 3`);
  t.equal(task.totalAttempts, 4, `${task.name} totalAttempts must still be 4`);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be ${dt}`);

  // Fail it
  task.fail(new Error('Badoom'));

  task.start(new Date());
  t.equal(task.attempts, 3, `${task.name} attempts must still be 3`);
  t.equal(task.totalAttempts, 4, `${task.name} totalAttempts must still be 4`);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be ${dt}`);

  task.reset();
  dt = '2016-11-27T17:10:00.444Z';
  task.start(dt);
  t.equal(task.attempts, 4, `${task.name} attempts must be 4`);
  t.equal(task.totalAttempts, 5, `${task.name} totalAttempts must be 5`);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be ${dt}`);

  // Reject it
  task.reject('NoReason', undefined, false);

  task.start(new Date());
  t.equal(task.attempts, 4, `${task.name} attempts must still be 4`);
  t.equal(task.totalAttempts, 5, `${task.name} totalAttempts must still be 5`);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be ${dt}`);

  t.end();
});

// =====================================================================================================================
// task incrementAttempts  and decrementAttempts
// =====================================================================================================================

test('task incrementAttempts and decrementAttempts', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);
  t.equal(task.totalAttempts, 0, `${task.name} totalAttempts must be 0`);

  task.incrementAttempts();
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);
  t.equal(task.totalAttempts, 1, `${task.name} totalAttempts must be 1`);

  task.incrementAttempts();
  t.equal(task.attempts, 2, `${task.name} attempts must be 2`);
  t.equal(task.totalAttempts, 2, `${task.name} totalAttempts must be 2`);

  task.incrementAttempts();
  t.equal(task.attempts, 3, `${task.name} attempts must be 3`);
  t.equal(task.totalAttempts, 3, `${task.name} totalAttempts must be 3`);

  task.decrementAttempts(); // DECREMENT
  t.equal(task.attempts, 2, `${task.name} attempts must be 2`);
  t.equal(task.totalAttempts, 3, `${task.name} totalAttempts must be 3`);

  task.incrementAttempts();
  t.equal(task.attempts, 3, `${task.name} attempts must be 3`);
  t.equal(task.totalAttempts, 4, `${task.name} totalAttempts must be 4`);

  // Complete it
  task.succeed(undefined, true);

  task.incrementAttempts();
  t.equal(task.attempts, 3, `${task.name} attempts must still be 3`);
  t.equal(task.totalAttempts, 4, `${task.name} totalAttempts must still be 4`);

  // Fail it
  task.fail(new Error('Badoom'));

  task.incrementAttempts();
  t.equal(task.attempts, 4, `${task.name} attempts must be 4`);
  t.equal(task.totalAttempts, 5, `${task.name} totalAttempts must be 5`);

  // Reject it
  task.reject('NoReason', undefined, false);

  task.incrementAttempts();
  t.equal(task.attempts, 4, `${task.name} attempts must still be 4`);
  t.equal(task.totalAttempts, 5, `${task.name} totalAttempts must still be 5`);

  t.end();
});

// =====================================================================================================================
// task updateLastExecutedAt
// =====================================================================================================================

test('task updateLastExecutedAt', t => {
  // Create a simple task from a simple task definition
  const task = createSimpleTask('A');

  t.equal(task.lastExecutedAt, '', `${task.name} lastExecutedAt must be ''`);

  let dt = '2016-11-27T17:10:00.000Z';
  task.updateLastExecutedAt(dt, true);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be '${dt}'`);

  dt = '2016-11-27T17:10:00.111Z';
  task.updateLastExecutedAt(dt, true);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be '${dt}'`);

  dt = '2016-11-27T17:10:00.222Z';
  task.updateLastExecutedAt(dt, true);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be '${dt}'`);

  // Complete it
  task.succeed(undefined, true);

  let dt0 = '2016-11-27T17:10:00.333Z';
  task.updateLastExecutedAt(dt0, true);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must still be '${dt}'`);

  // Fail it
  task.fail(new Error('Badoom'));

  dt = '2016-11-27T17:10:00.444Z';
  task.updateLastExecutedAt(dt, true);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must be '${dt}'`);

  // Reject it
  task.reject('NoReason', undefined, false);

  dt0 = '2016-11-27T17:10:00.555Z';
  task.updateLastExecutedAt(dt0, true);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must still be '${dt}'`);

  // Make task more complex by adding some non-executable sub-tasks
  const subTaskB = task.getOrCreateSubTask('SubTask B');
  const subSubTaskC = subTaskB.getOrCreateSubTask('SubSubTask C');
  t.equal(subTaskB.lastExecutedAt, '', `${subTaskB.name} lastExecutedAt must be ''`);
  t.equal(subSubTaskC.lastExecutedAt, '', `${subSubTaskC.name} lastExecutedAt must be ''`);

  let dt1 = '2016-11-27T17:10:00.666Z';
  task.updateLastExecutedAt(dt1, false);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must still be '${dt}'`);
  t.equal(subTaskB.lastExecutedAt, '', `${subTaskB.name} lastExecutedAt must still be ''`);
  t.equal(subSubTaskC.lastExecutedAt, '', `${subSubTaskC.name} lastExecutedAt must still be ''`);

  dt1 = '2016-11-27T17:10:00.777Z';
  task.updateLastExecutedAt(dt1, true);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must still be '${dt}'`);
  t.equal(subTaskB.lastExecutedAt, dt1, `${subTaskB.name} lastExecutedAt must be '${dt1}'`);
  t.equal(subSubTaskC.lastExecutedAt, dt1, `${subSubTaskC.name} lastExecutedAt must be '${dt1}'`);

  // Make task more complex by adding some executable sub-tasks
  const subTaskD = task.getOrCreateSubTask('SubTask D', execute2);
  const subSubTaskE = subTaskD.getOrCreateSubTask('SubSubTask E', execute1);
  t.equal(subTaskD.lastExecutedAt, '', `${subTaskD.name} lastExecutedAt must be ''`);
  t.equal(subSubTaskE.lastExecutedAt, '', `${subSubTaskE.name} lastExecutedAt must be ''`);

  let dt2 = '2016-11-27T17:10:00.888Z';
  task.updateLastExecutedAt(dt2, false);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must still be '${dt}'`);
  t.equal(subTaskD.lastExecutedAt, '', `${subTaskD.name} lastExecutedAt must still be ''`);
  t.equal(subSubTaskE.lastExecutedAt, '', `${subSubTaskE.name} lastExecutedAt must still be ''`);

  dt2 = '2016-11-27T17:10:00.999Z';
  task.updateLastExecutedAt(dt2, true);
  t.equal(task.lastExecutedAt, dt, `${task.name} lastExecutedAt must still be '${dt}'`);
  t.equal(subTaskD.lastExecutedAt, dt2, `${subTaskD.name} lastExecutedAt must be '${dt2}'`);
  t.equal(subSubTaskE.lastExecutedAt, dt2, `${subSubTaskE.name} lastExecutedAt must be '${dt2}'`);

  t.end();
});

// =====================================================================================================================
// createMasterTask
// =====================================================================================================================

function checkSlavesStatesAndAttempts(t, masterTask, skipReject) {
  t.equal(masterTask.attempts, 0, 'master attempts must be 0');
  t.equal(masterTask.totalAttempts, 0, 'master totalAttempts must be 0');
  masterTask.slaveTasks.forEach(st => {
    t.equal(st.attempts, 0, `slave (${st.name}) attempts must be 0`);
    t.equal(st.totalAttempts, 0, `slave (${st.name}) totalAttempts must be 0`);
  });

  // Start master task
  masterTask.start(new Date());
  t.equal(masterTask.attempts, 1, 'master attempts must be 1');
  t.equal(masterTask.totalAttempts, 1, 'master totalAttempts must be 1');
  masterTask.slaveTasks.forEach(st => {
    t.equal(st.attempts, 1, `slave (${st.name}) attempts must be 1`);
    t.equal(st.totalAttempts, 1, `slave (${st.name}) totalAttempts must be 1`);
  });

  // "Start" master task again (must have no effect)
  masterTask.start(new Date());
  t.equal(masterTask.attempts, 1, 'master attempts must still be 1');
  t.equal(masterTask.totalAttempts, 1, 'master totalAttempts must still be 1');
  masterTask.slaveTasks.forEach(st => {
    t.equal(st.attempts, 1, `slave (${st.name}) attempts must still be 1`);
    t.equal(st.totalAttempts, 1, `slave (${st.name}) totalAttempts must still be 1`);
  });

  // Increment attempts on master task
  masterTask.incrementAttempts();
  t.equal(masterTask.attempts, 2, 'master attempts must be 2');
  t.equal(masterTask.totalAttempts, 2, 'master totalAttempts must be 2');
  masterTask.slaveTasks.forEach(st => {
    t.equal(st.attempts, 2, `slave (${st.name}) attempts must be 2`);
    t.equal(st.totalAttempts, 2, `slave (${st.name}) totalAttempts must be 2`);
  });

  masterTask.decrementAttempts(); // DECREMENT
  t.equal(masterTask.attempts, 1, 'master attempts must be 1');
  t.equal(masterTask.totalAttempts, 2, 'master totalAttempts must be 2');
  masterTask.slaveTasks.forEach(st => {
    t.equal(st.attempts, 1, `slave (${st.name}) attempts must be 1`);
    t.equal(st.totalAttempts, 2, `slave (${st.name}) totalAttempts must be 2`);
  });

  masterTask.incrementAttempts(); // RE-INCREMENT
  t.equal(masterTask.attempts, 2, 'master attempts must be 2');
  t.equal(masterTask.totalAttempts, 3, 'master totalAttempts must be 3');
  masterTask.slaveTasks.forEach(st => {
    t.equal(st.attempts, 2, `slave (${st.name}) attempts must be 2`);
    t.equal(st.totalAttempts, 3, `slave (${st.name}) totalAttempts must be 3`);
  });

  // Succeed the master task
  masterTask.succeed(undefined, true);
  masterTask.slaveTasks.forEach(st => {
    t.ok(st.completed, `slave (${st.name}) must be completed (after 1st succeed)`);
  });

  // Fail the master task
  const err1 = new Error('Fail 1st - err1');
  masterTask.fail(err1);
  masterTask.slaveTasks.forEach(st => {
    t.ok(st.failed, `slave (${st.name}) must be failed (1st fail after 1st succeed)`);
    t.equal(st.state.error, err1.toString(), `slave (${st.name}) state error (${st.state.error}) must be err1 (1st fail after 1st succeed)`);
    t.equal(st.error, err1, `slave (${st.name}) error (${st.error}) must be err1 (1st fail after 1st succeed)`);
  });

  // Re-complete the master task
  masterTask.complete(undefined, true);
  masterTask.slaveTasks.forEach(st => {
    t.ok(st.completed, `slave (${st.name}) must be completed again (after 2nd complete)`);
    t.equal(st.state.error, undefined, `slave (${st.name}) state error (${st.state.error}) must be undefined (after 2nd complete)`);
    t.equal(st.error, undefined, `slave (${st.name}) error (${st.error}) must be undefined (after 2nd complete)`);
  });

  // Re-fail the master task
  const err2 = new Error('Fail 2nd - err2');
  masterTask.fail(err2);
  t.ok(masterTask.failed, `masterTask (${masterTask.name}) must be failed again (2nd fail after 2nd complete)`);
  masterTask.slaveTasks.forEach(st => {
    t.ok(st.failed, `slave (${st.name}) must be failed again (after 2nd fail)`);
    t.equal(st.state.error, err2.toString(), `slave (${st.name}) state error (${st.state.error}) must be err2 (2nd fail after 2nd complete)`);
    t.equal(st.error, err2, `slave (${st.name}) error (${st.error}) must be err2 (2nd fail after 2nd complete)`);
  });

  // Reset the master task (must clear failures)
  masterTask.reset();
  masterTask.slaveTasks.forEach(st => {
    t.ok(st.unstarted, `slave (${st.name}) must be unstarted (after 1st reset)`);
    t.equal(st.state.error, undefined, `slave (${st.name}) state error (${st.state.error}) must be undefined (after 1st reset)`);
    t.equal(st.error, undefined, `slave (${st.name}) error (${st.error}) must be undefined (after 1st reset)`);
  });

  // Timeout the master task
  const err3 = new Error('Timeout 1st - err3');
  masterTask.timeout(err3, true);
  masterTask.slaveTasks.forEach(st => {
    t.ok(st.timedOut, `slave (${st.name}) must be timed out (1st timeout after 1st reset)`);
    t.equal(st.state.error, err3.toString(), `slave (${st.name}) state error (${st.state.error}) must be err3 (1st timeout after 1st reset)`);
    t.equal(st.error, err3, `slave (${st.name}) error (${st.error}) must be err3 (1st timeout after 1st reset)`);
  });

  // Re-complete the master task again
  masterTask.complete(undefined, true);
  masterTask.slaveTasks.forEach(st => {
    t.ok(st.completed, `slave (${st.name}) must be completed again (after 3rd complete)`);
    t.equal(st.state.error, undefined, `slave (${st.name}) state error (${st.state.error}) must be undefined (after 3rd complete)`);
    t.equal(st.error, undefined, `slave (${st.name}) error (${st.error}) must be undefined (after 3rd complete)`);
  });

  // Fail to re-timeout with overrideCompleted false
  const err4 = new Error('Timeout 2nd - err4');
  masterTask.timeout(err4, false);
  masterTask.slaveTasks.forEach(st => {
    t.ok(st.completed, `slave (${st.name}) must still be completed again (after timeout without override)`);
    t.equal(st.state.error, undefined, `slave (${st.name}) state error (${st.state.error}) must be undefined (after timeout without override)`);
    t.equal(st.error, undefined, `slave (${st.name}) error (${st.error}) must be undefined (after timeout without override)`);
  });

  // Re-timeout the master task
  masterTask.timeout(err4, true);
  masterTask.slaveTasks.forEach(st => {
    t.ok(st.timedOut, `slave (${st.name}) must be timed out again (2nd timeout after 3rd complete)`);
    t.equal(st.state.error, err4.toString(), `slave (${st.name}) state error (${st.state.error}) must be err4 (2nd timeout after 3rd complete)`);
    t.equal(st.error, err4, `slave (${st.name}) error (${st.error}) must be err4 (2nd timeout after 3rd complete)`);
  });

  // Reset the master task again (must clear timeouts)
  masterTask.reset();
  masterTask.slaveTasks.forEach(st => {
    t.ok(st.unstarted, `slave (${st.name}) must be unstarted (after 2nd reset)`);
    t.equal(st.state.error, undefined, `slave (${st.name}) state error (${st.state.error}) must be undefined (after 2nd reset)`);
    t.equal(st.error, undefined, `slave (${st.name}) error (${st.error}) must be undefined (after 2nd reset)`);
  });

  // Re-fail the master task
  const err5 = new Error('Fail 3rd - err5');
  masterTask.fail(err5);
  masterTask.slaveTasks.forEach(st => {
    t.ok(st.failed, `slave (${st.name}) must be failed again (3rd fail after 2nd reset)`);
    t.equal(st.state.error, err5.toString(), `slave (${st.name}) state error (${st.state.error}) must be err5 (3rd fail after 2nd reset)`);
    t.equal(st.error, err5, `slave (${st.name}) error (${st.error}) must be err5 (3rd fail after 2nd reset)`);
  });

  if (!skipReject) {
    // Reject the master task
    const err6 = new Error('Reject - err5');
    masterTask.reject('Bob did it', err6);
    masterTask.slaveTasks.forEach(st => {
      t.ok(st.rejected, `slave (${st.name}) must be rejected`);
      t.ok(st.isRejected() && st.rejected, `slave (${st.name}) must be Rejected`);
      t.equal(st.state.error, err6.toString(), `slave (${st.name}) state error (${st.state.error}) must be err6 (after reject)`);
      t.equal(st.error, err6, `slave (${st.name}) error (${st.error}) must be err6 (after reject)`);
    });
  }
}

test('createMasterTask', t => {
  function check(factory, taskDef, slaveTasks, opts, mustPass, mustBeExecutable) {
    const prefix = `createMasterTask(${taskDef ? taskDef.name : taskDef}, ${stringify(slaveTasks ? slaveTasks.map(t => t.name) : slaveTasks)})`;
    try {
      const task = factory.createMasterTask(taskDef, slaveTasks);
      if (mustPass) {
        t.pass(`${prefix} must pass`);
      } else {
        t.fail(`${prefix} must fail - (${stringify(task)})`)
      }
      t.equal(!!task, mustPass, `${task ? task.name : task} must ${mustPass ? '' : 'not '}be created`);
      checkTask(t, task, taskDef, factory, opts, mustBeExecutable, undefined);
      t.ok(task.isMasterTask(), 'must be a master task');
      t.deepEqual(task.slaveTasks, slaveTasks, `slave tasks must match`);

      t.deepEqual(Task.getTasksAndSubTasks(task.slaveTasks), Task.getTasksAndSubTasks(slaveTasks), `all slave tasks recursively must match`);
      return task;

    } catch (err) {
      if (mustPass) {
        t.fail(`${prefix} must pass - (${stringify(err)}) - ${err.stack}`)
      } else {
        t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err.stack}`)
      }
      return undefined;
    }
  }

  const factory = taskFactory2;
  const opts = undefined;

  // Create a simple master task from a simple task definition
  const taskDefA = TaskDef.defineTask('Task A', execute1);

  // Must have at least one slave task
  check(factory, taskDefA, [], opts, false, true);

  // Must have slave tasks with exactly the same definition
  const slaveTaskANot = factory.createTask(TaskDef.defineTask('Task A', execute1), opts);
  check(factory, taskDefA, [slaveTaskANot], opts, false, true);

  // One slave task with same definition works
  const slaveTaskA1 = factory.createTask(taskDefA, opts);
  check(factory, taskDefA, [slaveTaskA1], opts, true, true);

  // Two slave tasks with same definition works
  const slaveTaskA2 = factory.createTask(taskDefA);

  const masterTaskA = check(factory, taskDefA, [slaveTaskA1, slaveTaskA2], opts, true, true);
  checkSlavesStatesAndAttempts(t, masterTaskA, false);


  // Create a complex master task from a complex task definition
  const taskDefB = TaskDef.defineTask('Task B', execute1);
  const subTaskDefsB = taskDefB.defineSubTasks(['SubTask B1', 'SubTask B2', 'SubTask B3']);
  const subTaskDefB1 = subTaskDefsB[0];
  subTaskDefB1.defineSubTasks(['SubTask B1a', 'SubTask B1b', 'SubTask B1c']);
  const subTaskDefB2 = subTaskDefsB[1];
  subTaskDefB2.defineSubTasks(['SubTask B2a', 'SubTask B2b']);

  // Must not have a slave task with a different definition
  check(factory, taskDefB, [factory.createTask(taskDefA)], opts, false, true);

  // 3 slaves - same definition - ok
  const slave1 = factory.createTask(taskDefB);
  const slave2 = factory.createTask(taskDefB);

  const slave3 = factory.createTask(taskDefB);
  const slave4 = factory.createTask(taskDefB);
  const masterSlave5 = factory.createMasterTask(taskDefB, [slave3, slave4]);

  // 2 slaves and 1 (master) slave (with 2 sub-slaves) works
  const masterTaskB = check(factory, taskDefB, [slave1, slave2, masterSlave5], opts, true, true);
  checkSlavesStatesAndAttempts(t, masterTaskB, true);

  // Fail master task B to be able to reset it
  masterTaskB.fail(new Error('Temp fail'));
  masterTaskB.reset();

  // Fail slave 1
  const slave1Error = new Error('Slave 1 error');
  slave1.fail(slave1Error);

  // Reject slave 2
  const slave2Error = new Error('Slave 2 reject error');
  slave2.reject('MyReason', slave2Error, true);

  // Complete master slave 5
  const masterSlave5CompletedState = 'Master slave 5 completed state';
  masterSlave5.completeAs(masterSlave5CompletedState, undefined, true);

  // Now fail master task B, which should have NO impact on its slave tasks, since they are already failed/rejected/completed
  const masterTaskBError = new Error('Master task B error');
  masterTaskB.fail(masterTaskBError);

  // Check states
  t.ok(masterTaskB.failed, `Master task B (${stringify(masterTaskB.state)}) must be Failure`);
  t.equal(masterTaskB.state.error, masterTaskBError.toString(), `Master task B (${stringify(masterTaskB.state)}) must be failed with error (${masterTaskBError})`);

  t.ok(slave1.failed, `Slave 1 (${stringify(slave1.state)}) must be Failure`);
  t.equal(slave1.state.error, slave1Error.toString(), `Slave 1 (${stringify(slave1.state)}) must be failed with error (${slave1Error})`);

  t.ok(slave2.isRejected(), `Slave 2 (${stringify(slave2.state)}) must be Rejected`);
  t.equal(slave2.state.error, slave2Error.toString(), `Slave 2 must be rejected with error (${slave2Error})`);

  t.ok(masterSlave5.failed, `Master-slave 5 (${stringify(masterSlave5.state)}) must be Failure`);
  t.equal(masterSlave5.state.error, masterTaskBError.toString(), `Master-slave 5 must be failed with error (${masterTaskBError})`);
  t.ok(slave3.failed, `Sub-slave 3 (${stringify(slave3.state)}) must be Failure`);
  t.equal(slave3.state.error, masterTaskBError.toString(), `Slave 3 must be failed with error (${masterTaskBError})`);
  t.ok(slave4.failed, `Sub-slave 4 (${stringify(slave4.state)}) must be Failure`);
  t.equal(slave4.state.error, masterTaskBError.toString(), `Slave 4 must be failed with error (${masterTaskBError})`);

  // Check master sub-tasks
  const masterSubTaskB1 = masterTaskB.getSubTask('SubTask B1');
  t.ok(masterSubTaskB1.state.unstarted, `Master sub-task B1 (${stringify(masterSubTaskB1.state)}) must be unstarted`);

  const slave1SubTaskB1 = slave1.getSubTask('SubTask B1');
  t.ok(slave1SubTaskB1.state.unstarted, `Slave 1 sub-task B1 (${stringify(slave1SubTaskB1.state)}) must be unstarted`);

  // Rejections always ripple down to sub-tasks too
  const slave2SubTaskB1 = slave2.getSubTask('SubTask B1');
  t.ok(slave2SubTaskB1.state.rejected, `Slave 2 sub-task B1 (${stringify(slave2SubTaskB1.state)}) must be rejected`);

  const masterSlave5SubTaskB1 = masterSlave5.getSubTask('SubTask B1');
  t.ok(masterSlave5SubTaskB1.state.unstarted, `Master-slave 5 sub-task B1 (${stringify(masterSlave5SubTaskB1.state)}) must be unstarted`);

  const slave3SubTaskB1 = slave3.getSubTask('SubTask B1');
  t.ok(slave3SubTaskB1.state.unstarted, `Slave 3 sub-task B1 (${stringify(slave3SubTaskB1.state)}) must be unstarted`);

  const slave4SubTaskB1 = slave4.getSubTask('SubTask B1');
  t.ok(slave4SubTaskB1.state.unstarted, `Slave 4 sub-task B1 (${stringify(slave4SubTaskB1.state)}) must be unstarted`);

  // Fail the master-slave 5 sub-task B1, must trigger fail on its slave tasks 3 & 4
  const masterSlave5SubTaskB1Error = new Error('masterSlave5SubTaskB1Error');
  masterSlave5SubTaskB1.fail(masterSlave5SubTaskB1Error);

  t.ok(masterSlave5SubTaskB1.state.failed, `Master-slave 5 sub-task B1 (${stringify(masterSlave5SubTaskB1.state)}) must be Failure`);
  t.equal(masterSlave5SubTaskB1.state.error, masterSlave5SubTaskB1Error.toString(), `Master-slave 5 sub-task B1 must be failed with error (${masterSlave5SubTaskB1Error})`);

  t.ok(slave3SubTaskB1.state.failed, `Slave 3 sub-task B1 (${stringify(slave3SubTaskB1.state)}) must be Failure`);
  t.equal(slave3SubTaskB1.state.error, masterSlave5SubTaskB1Error.toString(), `Slave 3 sub-task B1 must be failed with error (${masterSlave5SubTaskB1Error})`);

  t.ok(slave4SubTaskB1.state.failed, `Slave 4 sub-task B1 (${stringify(slave4SubTaskB1.state)}) must be Failure`);
  t.equal(slave4SubTaskB1.state.error, masterSlave5SubTaskB1Error.toString(), `Slave 4 sub-task B1 must be failed with error (${masterSlave5SubTaskB1Error})`);

  // Complete the master sub-task B1, should complete the same sub-task on all its slaves (1, (not rejected 2), master-slave 5, which should in turn complete its slaves 3 & 4)
  masterSubTaskB1.completeAs('masterSubTaskB1SuccessState', undefined, true);

  t.ok(masterSubTaskB1.state.completed, `Master sub-task B1 (${stringify(masterSubTaskB1.state)}) must be completed`);
  t.ok(slave1SubTaskB1.state.completed, `Slave 1 sub-task B1 (${stringify(slave1SubTaskB1.state)}) must be completed`);
  t.ok(slave2SubTaskB1.state.rejected, `Slave 2 sub-task B1 (${stringify(slave2SubTaskB1.state)}) must be rejected`);
  t.ok(masterSlave5SubTaskB1.state.completed, `Master-slave 5 sub-task B1 (${stringify(masterSlave5SubTaskB1.state)}) must be completed`);
  t.ok(slave3SubTaskB1.state.completed, `Slave 3 sub-task B1 (${stringify(slave3SubTaskB1.state)}) must be completed`);
  t.ok(slave4SubTaskB1.state.completed, `Slave 4 sub-task B1 (${stringify(slave4SubTaskB1.state)}) must be completed`);

  // Sub-sub tasks must still be unstarted
  const masterSubTaskB1a = masterSubTaskB1.getSubTask('SubTask B1a');
  t.ok(masterSubTaskB1a.state.unstarted, `Master sub-task B1a (${stringify(masterSubTaskB1a.state)}) must be unstarted`);

  const slave1SubTaskB1a = slave1SubTaskB1.getSubTask('SubTask B1a');
  t.ok(slave1SubTaskB1a.state.unstarted, `Slave 1 sub-task B1a (${stringify(slave1SubTaskB1a.state)}) must be unstarted`);

  const slave2SubTaskB1a = slave2SubTaskB1.getSubTask('SubTask B1a');
  t.ok(slave2SubTaskB1a.state.rejected, `Slave 2 sub-task B1a (${stringify(slave1SubTaskB1a.state)}) must be rejected`);

  const masterSlave5SubTaskB1a = masterSlave5SubTaskB1.getSubTask('SubTask B1a');
  t.ok(masterSlave5SubTaskB1a.state.unstarted, `Master-slave 5 sub-task B1a (${stringify(masterSlave5SubTaskB1a.state)}) must be unstarted`);

  const slave3SubTaskB1a = slave3SubTaskB1.getSubTask('SubTask B1a');
  t.ok(slave3SubTaskB1a.state.unstarted, `Slave 3 sub-task B1a (${stringify(slave3SubTaskB1a.state)}) must be unstarted`);

  const slave4SubTaskB1a = slave4SubTaskB1.getSubTask('SubTask B1a');
  t.ok(slave4SubTaskB1a.state.unstarted, `Slave 4 sub-task B1a (${stringify(slave4SubTaskB1a.state)}) must be unstarted`);


  // Complete the master sub-task B1a, should complete the same sub-task on all its slaves (1, (not rejected 2), master-slave 5, which should in turn complete its slaves 3 & 4)
  masterSubTaskB1a.succeed(undefined, true);

  t.ok(masterSubTaskB1a.state.completed, `Master sub-task B1a (${stringify(masterSubTaskB1a.state)}) must be completed`);
  t.ok(slave1SubTaskB1a.state.completed, `Slave 1 sub-task B1a (${stringify(slave1SubTaskB1a.state)}) must be completed`);
  t.ok(slave2SubTaskB1a.state.rejected, `Slave 2 sub-task B1a (${stringify(slave2SubTaskB1a.state)}) must be rejected`);
  t.ok(masterSlave5SubTaskB1a.state.completed, `Master-slave 5 sub-task B1a (${stringify(masterSlave5SubTaskB1a.state)}) must be completed`);
  t.ok(slave3SubTaskB1a.state.completed, `Slave 3 sub-task B1a (${stringify(slave3SubTaskB1a.state)}) must be completed`);
  t.ok(slave4SubTaskB1a.state.completed, `Slave 4 sub-task B1a (${stringify(slave4SubTaskB1a.state)}) must be completed`);

  t.end();
});
