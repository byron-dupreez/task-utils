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
      const self = task.parent.subTasks.find(t => t.name === taskName);
      //console.log(`************** self = ${stringify(self)}`);
      equal(t, task, self, `Parent (${task.parent.name}) contains new task (${taskName})`);
    }
    // Check all of the subtasks recursively too
    for (let i = 0; i < taskDef.subTaskDefs.length; ++i) {
      const subTaskDef = taskDef.subTaskDefs[i];
      const subTask = task.subTasks[i];
      t.ok(subTask.isSubTask(), `task (${task.name} sub-task (${subTask.name}) must be isSubTask`);
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
  equal(t, subTaskB.subTasks.length, 0, `SubTask (${subTaskB.name}) subTasks length `);
  equal(t, taskA.subTasks.length, 1, `Task (${taskA.name}) subTasks length `);

  // Add a subtask B1 to SubTask B
  const subTaskDefB1 = new TaskDef('SubTask B1', undefined, subTaskB.definition);
  const subTaskB1 = check(subTaskDefB1, subTaskB, true, false);
  equal(t, subTaskB1.subTasks.length, 0, `SubTask (${subTaskB1.name}) subTasks length `);
  equal(t, subTaskB.subTasks.length, 1, `SubTask (${subTaskB.name}) subTasks length `);
  equal(t, taskA.subTasks.length, 1, `Task (${taskA.name}) subTasks length `);

  // Add another subtask C to Task A
  const subTaskDefC = new TaskDef('SubTask C', undefined, taskA.definition);
  const subTaskC = check(subTaskDefC, taskA, true, false);
  equal(t, subTaskC.subTasks.length, 0, `SubTask (${subTaskC.name}) subTasks length `);
  equal(t, taskA.subTasks.length, 2, `Task (${taskA.name}) subTasks length `);

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
  taskA.failAs('Failure', new Error("Feeling ill"));
  check(taskA, true, true);

  // succeed it
  taskA.completeAs('Ok', undefined, true);
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
  t.notOk(task.timedOut, `${task.name} must not be timedOut`);
  t.notOk(task.failed, `${task.name} must NOT be failed`);
  t.notOk(task.rejected, `${task.name} must NOT be rejected`);

  t.notOk(task.isRejected(), `${task.name} must NOT be Rejected`);
  t.notOk(task.isDiscarded(), `${task.name} must NOT be Discarded`);
  t.notOk(task.isAbandoned(), `${task.name} must NOT be Abandoned`);

  t.end();
});

test('task succeed()', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));
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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Complete it
  task.succeed(undefined, true);

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Complete it
  task.succeed(undefined, true);

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Reject it
  task.reject('Rotten', new Error('Yuck'), false);

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
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

  // Complete it
  task.succeed(undefined, true);

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
  task.succeed(undefined, true);

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

// =====================================================================================================================
// task updateLastExecutedAt
// =====================================================================================================================

test('task updateLastExecutedAt', t => {
  // Create a simple task from a simple task definition
  const task = Task.createTask(TaskDef.defineTask('Task A', execute1));

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

  // Make task more complex
  const subTaskB = task.getOrAddSubTask('SubTask B');
  const subSubTaskC = subTaskB.getOrAddSubTask('SubSubTask C');
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

  t.end();
});

// =====================================================================================================================
// createMasterTask
// =====================================================================================================================

function checkSlavesStatesAndAttempts(t, masterTask, skipReject) {
  t.equal(masterTask.attempts, 0, 'master attempts must be 0');
  masterTask.slaveTasks.forEach(st => {
    t.equal(st.attempts, 0, `slave (${st.name}) attempts must be 0`);
  });

  // Increment attempts x 2 on master task
  masterTask.incrementAttempts();
  masterTask.incrementAttempts();
  t.equal(masterTask.attempts, 2, 'master attempts must be 2');
  masterTask.slaveTasks.forEach(st => {
    t.equal(st.attempts, 2, `slave (${st.name}) attempts must be 2`);
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
  function check(taskDef, slaveTasks, mustPass, mustBeExecutable) {
    const prefix = `createMasterTask(${taskDef ? taskDef.name : taskDef}, ${stringify(slaveTasks ? slaveTasks.map(t => t.name) : slaveTasks)})`;
    try {
      const task = Task.createMasterTask(taskDef, slaveTasks);
      if (mustPass) {
        t.pass(`${prefix} must pass`);
      } else {
        t.fail(`${prefix} must fail - (${stringify(task)})`)
      }
      okNotOk(t, task, mustPass, `must be created`, `must not be created`, prefix);
      checkTask(t, task, taskDef, mustBeExecutable);
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
  // Create a simple master task from a simple task definition
  const taskDefA = TaskDef.defineTask('Task A', execute1);

  // Must have at least one slave task
  check(taskDefA, [], false, true);

  // Must have slave tasks with exactly the same definition
  const slaveTaskANot = Task.createTask(TaskDef.defineTask('Task A', execute1));
  check(taskDefA, [slaveTaskANot], false, true);

  // One slave task with same definition works
  const slaveTaskA1 = Task.createTask(taskDefA);
  check(taskDefA, [slaveTaskA1], true, true);

  // Two slave tasks with same definition works
  const slaveTaskA2 = Task.createTask(taskDefA);

  const masterTaskA = check(taskDefA, [slaveTaskA1, slaveTaskA2], true, true);
  checkSlavesStatesAndAttempts(t, masterTaskA, false);


  // Create a complex master task from a complex task definition
  const taskDefB = TaskDef.defineTask('Task B', execute1);
  const subTaskDefsB = taskDefB.defineSubTasks(['SubTask B1', 'SubTask B2', 'SubTask B3']);
  const subTaskDefB1 = subTaskDefsB[0];
  subTaskDefB1.defineSubTasks(['SubTask B1a', 'SubTask B1b', 'SubTask B1c']);
  const subTaskDefB2 = subTaskDefsB[1];
  subTaskDefB2.defineSubTasks(['SubTask B2a', 'SubTask B2b']);

  // Must not have a slave task with a different definition
  check(taskDefB, [Task.createTask(taskDefA)], false, true);

  // 3 slaves - same definition - ok
  const slave1 = Task.createTask(taskDefB);
  const slave2 = Task.createTask(taskDefB);

  const slave3 = Task.createTask(taskDefB);
  const slave4 = Task.createTask(taskDefB);
  const masterSlave5 = Task.createMasterTask(taskDefB, [slave3, slave4]);

  // 2 slaves and 1 (master) slave (with 2 sub-slaves) works
  const masterTaskB = check(taskDefB, [slave1, slave2, masterSlave5], true, true);
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

