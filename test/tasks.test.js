'use strict';

/**
 * Unit tests for task-utils/tasks.js
 * @author Byron du Preez
 */

const test = require("tape");

// The test subject
const Tasks = require('../tasks');
const Task = Tasks.Task;
// const createTask = Task.createTask;
// const getRootTask = Task.getRootTask;
// const reconstructTasksFromRootTaskLike = Task.reconstructTasksFromRootTaskLike;
// const reconstructTaskDefsFromRootTaskLike = Tasks.FOR_TESTING.reconstructTaskDefsFromRootTaskLike;
const wrapExecuteTask = Tasks.FOR_TESTING.wrapExecuteTask;


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

test('reconstructTasksFromRootTaskLike', t => {
  function check(taskBefore, mustPass, mustBeExecutable) {
    // Serialize and deserialize it to convert it into a task-like object
    const json = JSON.stringify(taskBefore);
    console.log(`*************** TASK JSON ${json}`);
    const taskLike = JSON.parse(json);
    console.log(`*************** TASK LIKE ${stringify(taskLike)}`);
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
