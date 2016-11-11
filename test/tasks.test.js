'use strict';

/**
 * Unit tests for task-utils/tasks.js
 * @author Byron du Preez
 */

const test = require("tape");

// The test subject
const Tasks = require('../tasks');
const Task = Tasks.Task;
// const reconstructTaskDefsFromRootTaskLike = Tasks.FOR_TESTING.reconstructTaskDefsFromRootTaskLike;
// const wrapExecuteTask = Tasks.FOR_TESTING.wrapExecuteTask;


const taskDefs = require('../task-defs');
const TaskDef = taskDefs.TaskDef;

const Strings = require('core-functions/strings');
const stringify = Strings.stringify;

const testing = require('./testing');
const okNotOk = testing.okNotOk;
//const checkOkNotOk = testing.checkOkNotOk;
const checkMethodOkNotOk = testing.checkMethodOkNotOk;
const equal = testing.equal;
//const checkEqual = testing.checkEqual;
//const checkMethodEqual = testing.checkMethodEqual;

const states = require('../task-states');
const TaskState = states.TaskState;

function execute1() {
  console.log(`Executing execute1 on task (${this.name})`);
}
function execute2() {
  console.log(`Executing execute2 on task (${this.name})`);
}

function checkTask(t, task, taskDef, mustBeExecutable) {
  if (taskDef instanceof TaskDef && task instanceof Task) {
    const taskName = Strings.trim(taskDef.name);
    equal(t, task.name, taskName, `name`);
    okNotOk(t, task.execute, mustBeExecutable, `must be defined`, `must be undefined`, `execute`);
    okNotOk(t, task.parent, !mustBeExecutable, `must be defined`, `must be undefined`, `parent`);

    checkExecutable(t, task, mustBeExecutable);

    // Ensure immutable
    t.throws(() => task.state = null, TypeError, 'task.state must be immutable');
    t.throws(() => task.attempts = -1, TypeError, 'task.attempts must be immutable');

    if (task.parent) {
      //console.log(`************** task.parent.subTasks = ${stringify(task.parent.subTasks.map(t => t.name))}`);
      const self = task.parent._subTasks.find(t => t.name === taskName);
      //console.log(`************** self = ${stringify(self)}`);
      equal(t, task, self, `Parent (${task.parent.name}) contains new task (${taskName})`);
    }
    // Check all of the subtasks recursively too
    for (let i = 0; i < taskDef.subTaskDefs.length; ++i) {
      const subTaskDef = taskDef.subTaskDefs[i];
      const subTask = task.subTasks[i];
      checkTask(t, subTask, subTaskDef, false);
    }
  }
}

function checkExecutable(t, task, expectedExecutable) {
  okNotOk(t, task.executable, expectedExecutable, `must be ${expectedExecutable}`, `must be ${!expectedExecutable}`, `Task.executable -> `);
  checkMethodOkNotOk(t, task, task.isExecutable, [], expectedExecutable, 'must be Executable', 'must be NOT Executable');
  checkMethodOkNotOk(t, task, task.isNotExecutable, [], !expectedExecutable, 'must be NotExecutable', 'must be NOT NotExecutable');
  checkMethodOkNotOk(t, task, task.isInternal, [], !expectedExecutable, 'must be Internal', 'must be NOT Internal');
}

// =====================================================================================================================
// createTask
// =====================================================================================================================

test('createTask', t => {
  function check(taskDef, mustPass, mustBeExecutable) {
    const prefix = `createTask(${taskDef ? taskDef.name : taskDef})`;
    try {
      const task = Task.createTask(taskDef);
      if (mustPass) {
        t.pass(`${prefix} must pass`);
      } else {
        t.fail(`${prefix} must fail - (${stringify(task)})`)
      }
      okNotOk(t, task, mustPass, `must be created`, `must not be created`, prefix);
      checkTask(t, task, taskDef, mustBeExecutable);
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
  // Create a simple task from a simple task definition
  const taskDefA = TaskDef.defineTask('Task A', execute1);
  check(taskDefA, true, true);

  // Create a complex task from a complex task definition
  const taskDefB = TaskDef.defineTask('Task B', execute1);
  const subTaskDefsB = taskDefB.defineSubTasks(['SubTask B1', 'SubTask B2', 'SubTask B3']);
  const subTaskDefB1 = subTaskDefsB[0];
  subTaskDefB1.defineSubTasks(['SubTask B1a', 'SubTask B1b', 'SubTask B1c']);
  const subTaskDefB2 = subTaskDefsB[1];
  subTaskDefB2.defineSubTasks(['SubTask B2a', 'SubTask B2b']);

  check(taskDefB, true, true);

  t.end();
});

// =====================================================================================================================
// new Task
// =====================================================================================================================

test('new Task', t => {
  function check(taskDef, parent, mustPass, mustBeExecutable) {
    const prefix = `new Task(${taskDef ? taskDef.name : taskDef}, ${stringify(parent ? parent.name : parent)}) `;
    try {
      const task = new Task(taskDef, parent);
      if (mustPass) {
        t.pass(`${prefix} must pass`);
      } else {
        t.fail(`${prefix} must fail - (${stringify(task)})`)
      }
      okNotOk(t, task, mustPass, `must be created`, `must not be created`, prefix);
      checkTask(t, task, taskDef, mustBeExecutable);
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

  // Task with bad definition
  check(undefined, undefined, false, true);
  check(null, undefined, false, true);
  check({name: 'Bob'}, undefined, false, true);
  check(1, undefined, false, true);
  check('', undefined, false, true);
  check([], undefined, false, true);

  // Simple task with no internal subtasks
  const taskA = check(TaskDef.defineTask('TaskA', execute1), undefined, true, true);

  // Add a subtask B to Task A
  const subTaskDefB = new TaskDef('SubTask B', undefined, taskA.definition);
  const subTaskB = check(subTaskDefB, taskA, true, false);
  equal(t, subTaskB._subTasks.length, 0, `SubTask (${subTaskB.name}) subTasks length `);
  equal(t, taskA._subTasks.length, 1, `Task (${taskA.name}) subTasks length `);

  // Add a subtask B1 to SubTask B
  const subTaskDefB1 = new TaskDef('SubTask B1', undefined, subTaskB.definition);
  const subTaskB1 = check(subTaskDefB1, subTaskB, true, false);
  equal(t, subTaskB1._subTasks.length, 0, `SubTask (${subTaskB1.name}) subTasks length `);
  equal(t, subTaskB._subTasks.length, 1, `SubTask (${subTaskB.name}) subTasks length `);
  equal(t, taskA._subTasks.length, 1, `Task (${taskA.name}) subTasks length `);

  // Add another subtask C to Task A
  const subTaskDefC = new TaskDef('SubTask C', undefined, taskA.definition);
  const subTaskC = check(subTaskDefC, taskA, true, false);
  equal(t, subTaskC._subTasks.length, 0, `SubTask (${subTaskC.name}) subTasks length `);
  equal(t, taskA._subTasks.length, 2, `Task (${taskA.name}) subTasks length `);

  // Ensure duplicates are not possible
  check(subTaskDefB, taskA, false, false);
  check(subTaskDefB1, subTaskB, false, false);
  check(subTaskDefC, taskA, false, false);


  t.end();
});

// =====================================================================================================================
// reconstructTasksFromRootTaskLike
// =====================================================================================================================

test('reconstructTasksFromRootTaskLike', t => {
  function check(taskBefore, mustPass, mustBeExecutable) {
    // Serialize and deserialize it to convert it into a task-like object
    const json = JSON.stringify(taskBefore);
    //console.log(`*************** TASK JSON ${json}`);
    const taskLike = JSON.parse(json);
    //console.log(`*************** TASK LIKE ${stringify(taskLike)}`);
    equal(t, TaskState.toTaskStateFromStateLike(taskLike.state), taskBefore.state, `TaskLike state `);
    equal(t, taskLike.attempts, taskBefore.attempts, `TaskLike attempts `);

    t.ok(!(taskLike instanceof Task), `taskLike (${stringify(taskLike)}) must not be an instanceof Task`);

    const prefix = `reconstructTasksFromRootTaskLike(${taskLike ? taskLike.name : taskLike})`;

    try {
      const taskAfter = Task.reconstructTasksFromRootTaskLike(taskLike);
      if (mustPass) {
        t.pass(`${prefix} must pass`);
      } else {
        t.fail(`${prefix} must fail - (${stringify(taskAfter)})`);
      }
      okNotOk(t, taskAfter, mustPass, `must be reconstructed`, `must not be reconstructed`, prefix);
      checkTask(t, taskAfter, taskAfter.definition, mustBeExecutable);
      equal(t, taskAfter, taskBefore);
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

  // Create a simple task from a simple task definition
  const taskDefA = TaskDef.defineTask('Task A', execute1);
  const taskA = Task.createTask(taskDefA);
  // unstarted
  check(taskA, true, true);

  // fail it
  taskA.failure('Failure', new Error("Feeling ill"));
  check(taskA, true, true);

  // succeed it
  taskA.success('Ok');
  check(taskA, true, true);

  // Create a complex task from a complex task definition
  const taskDefB = TaskDef.defineTask('Task B', execute1);
  const subTaskDefsB = taskDefB.defineSubTasks(['SubTask B1', 'SubTask B2', 'SubTask B3']);
  const subTaskDefB1 = subTaskDefsB[0];
  subTaskDefB1.defineSubTasks(['SubTask B1a', 'SubTask B1b', 'SubTask B1c']);
  const subTaskDefB2 = subTaskDefsB[1];
  subTaskDefB2.defineSubTasks(['SubTask B2a', 'SubTask B2b']);

  const taskB = Task.createTask(taskDefB);
  check(taskB, true, true);

  taskB.abandon('Dead', new Error("Black plague"), true);
  check(taskB, true, true);

  t.end();
});

// =====================================================================================================================
// task state changes
// =====================================================================================================================

test('task state initial', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task succeed()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Complete it
  task.succeed();

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.ok(task.isSuccess(), `${task.name} must be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task success()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Complete it
  task.success('MySuccessCode');

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.ok(task.isSuccess(), `${task.name} must be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task fail()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Fail it
  task.fail(new Error('Boom'));

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.ok(task.failed, `${task.name} must be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.ok(task.isFailure(), `${task.name} must be Failure`);
  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task failure()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Fail it
  task.failure('MyFailureCode', new Error('Boom'));

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.ok(task.failed, `${task.name} must be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.ok(task.isFailure(), `${task.name} must be Failure`);
  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task reject()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Reject it
  task.reject('Rotten', new Error('Yuck'), false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task discard()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Reject it
  task.discard('AttemptsExceeded', undefined, false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.ok(task.isDiscarded(), `${task.name} must be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});


test('task abandon()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Reject it
  task.abandon('Forgotten', undefined, false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.ok(task.isAbandoned(), `${task.name} must be Abandoned`);

  t.end();
});


test('task succeed() then fail() then succeed()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Complete it
  task.succeed();

  // Fail it
  task.fail(new Error('Boom'));

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.ok(task.incomplete, `${task.name} must be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.ok(task.failed, `${task.name} must be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.ok(task.isFailure(), `${task.name} must be Failure`);
  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Re-complete it
  task.succeed();

  t.notOk(task.unstarted, `${task.name} must not be unstarted`);
  t.notOk(task.incomplete, `${task.name} must not be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.failed, `${task.name} must not be failed`);
  t.notOk(task.rejected, `${task.name} must not be rejected`);

  t.ok(task.isSuccess(), `${task.name} must be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task succeed() then cannot reject()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Complete it
  task.succeed();

  // Cannot reject it
  task.reject('Rotten', new Error('Yuck'), false);

  t.notOk(task.unstarted, `${task.name} must not be unstarted`);
  t.notOk(task.incomplete, `${task.name} must not be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.failed, `${task.name} must not be failed`);
  t.notOk(task.rejected, `${task.name} must not be rejected`);

  t.ok(task.isSuccess(), `${task.name} must be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task fail() then succeed()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Fail it
  task.fail(new Error('Boom'));

  // Complete it
  task.succeed();

  t.notOk(task.unstarted, `${task.name} must not be unstarted`);
  t.notOk(task.incomplete, `${task.name} must not be incomplete`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.notOk(task.failed, `${task.name} must not be failed`);
  t.notOk(task.rejected, `${task.name} must not be rejected`);

  t.ok(task.isSuccess(), `${task.name} must be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task fail() then reject()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Fail it
  task.fail(new Error('Boom'));

  // Reject it
  task.reject('Rotten', new Error('Yuck'), false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task reject() then cannot succeed(), cannot fail()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Reject it
  task.reject('Rotten', new Error('Yuck'), false);

  // Cannot complete it
  task.succeed();

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Cannot fail it
  task.fail(new Error('Boom'));

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task succeed() then fail() then reject() then cannot succeed(), cannot fail()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Complete it
  task.succeed();

  // Fail it
  task.fail(new Error('Boom'));

  // Reject it
  task.reject('Rotten', new Error('Yuck'), false);

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Cannot re-complete it
  task.succeed();

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  // Cannot re-fail it
  task.fail(new Error('Boom'));

  t.notOk(task.unstarted, `${task.name} must NOT be unstarted`);
  t.notOk(task.incomplete, `${task.name} must NOT be incomplete`);
  t.notOk(task.completed, `${task.name} must NOT be completed`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.ok(task.rejected, `${task.name} must be rejected`);

  t.notOk(task.isSuccess(), `${task.name} must NOT be Success`);
  t.notOk(task.isFailure(), `${task.name} must NOT be Failure`);
  t.ok(task.isRejected(), `${task.name} must be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

// =====================================================================================================================
// task incrementAttempts
// =====================================================================================================================

test('task incrementAttempts', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  task.incrementAttempts();
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  task.incrementAttempts();
  t.equal(task.attempts, 2, `${task.name} attempts must be 2`);

  task.incrementAttempts();
  t.equal(task.attempts, 3, `${task.name} attempts must be 3`);

  // Complete it
  task.succeed();

  task.incrementAttempts();
  t.equal(task.attempts, 3, `${task.name} attempts must still be 3`);

  // Fail it
  task.fail(new Error('Badoom'));

  task.incrementAttempts();
  t.equal(task.attempts, 4, `${task.name} attempts must be 4`);

  // Reject it
  task.reject('NoReason', undefined, false);

  task.incrementAttempts();
  t.equal(task.attempts, 4, `${task.name} attempts must still be 4`);

  t.end();
});
