'use strict';

/**
 * Unit tests for task-utils/tasks.js
 * @author Byron du Preez
 */

const test = require("tape");

// The test subject
const taskDefs = require('../task-defs');
const TaskDef = taskDefs.TaskDef;
// const defineTask = TaskDef.defineTask;
// const getRootTaskDef = TaskDef.getRootTaskDef;
const ensureAllTaskDefsDistinct = taskDefs.FOR_TESTING.ensureAllTaskDefsDistinct;
const areSubTaskNamesDistinct = taskDefs.FOR_TESTING.areSubTaskNamesDistinct;

const Strings = require('core-functions/strings');
const stringify = Strings.stringify;

const testing = require('./testing');
const okNotOk = testing.okNotOk;
const checkOkNotOk = testing.checkOkNotOk;
const checkMethodOkNotOk = testing.checkMethodOkNotOk;
const equal = testing.equal;
const checkEqual = testing.checkEqual;
const checkMethodEqual = testing.checkMethodEqual;

const states = require('../task-states');
// Common state codes
const SUCCEEDED_CODE = states.SUCCEEDED_CODE;
// TaskState singletons
const UNSTARTED = states.UNSTARTED;
const SUCCEEDED = states.SUCCEEDED;
// TaskState classes
//const TaskState = states.TaskState;
//const Unstarted = states.Unstarted;
const Success = states.Success;
const Failure = states.Failure;
//const Succeeded = states.Succeeded;
const Failed = states.Failed;
//const toTaskState = states.toTaskState;
//const isCompleted = states.isCompleted;

// const statuses = require('../task-statuses');
// const getTask = statuses.ONLY_FOR_TESTING.getTask;
// const getOrCreateTask = statuses.getOrCreateTask;
// const getTaskState = statuses.getTaskState;
// const getTaskResult = statuses.getTaskResult;
// const getTaskProperty = statuses.getTaskProperty;
// const getTaskAttempts = statuses.getTaskAttempts;
// const incrementTaskAttempts = statuses.incrementTaskAttempts;
// const setTaskState = statuses.setTaskState;
// const setTaskStateDetails = statuses.setTaskStateDetails;
// const setTaskResult = statuses.setTaskResult;
// const setTaskProperty = statuses.setTaskProperty;
// const setTaskStateIfNecessary = statuses.setTaskStateIfNecessary;
// const resetTaskStateAndResultIfNotComplete = statuses.resetTaskStateAndResultIfNotComplete;

function execute1() {
  console.log(`Executing execute1 on task (${this.name})`);
}
function execute2() {
  console.log(`Executing execute2 on task (${this.name})`);
}

function checkExecutable(t, taskDef, expectedExecutable) {
  okNotOk(t, taskDef.executable, expectedExecutable, `must be ${expectedExecutable}`, `must be ${!expectedExecutable}`, `TaskDef.executable `);
  checkMethodOkNotOk(t, taskDef, taskDef.isExecutable, [], expectedExecutable, 'must be Executable', 'must be NOT Executable');
  checkMethodOkNotOk(t, taskDef, taskDef.isNotExecutable, [], !expectedExecutable, 'must be NotExecutable', 'must be NOT NotExecutable');
  checkMethodOkNotOk(t, taskDef, taskDef.isInternal, [], !expectedExecutable, 'must be Internal', 'must be NOT Internal');
}

function checkNewTaskDef(t, name, execute, parent, mustPass, mustBeExecutable) {
  const prefix = `new TaskDef(${name}, ${stringify(execute ? execute.name ? execute.name : '<anon>' : execute)}, ${stringify(parent ? parent.name : parent)})`;
  try {
    const taskDef = new TaskDef(name, execute, parent);
    if (mustPass) {
      t.pass(`${prefix} must pass`);
    } else {
      t.fail(`${prefix} must fail - (${stringify(taskDef)})`)
    }
    okNotOk(t, taskDef, mustPass, `must be created`, `must not be created`, `TaskDef`);

    const taskName = Strings.trim(name);
    equal(t, taskDef.name, taskName, `name`);
    equal(t, taskDef.execute, execute, `execute`);
    equal(t, taskDef.parent, parent, `parent`);

    checkExecutable(t, taskDef, mustBeExecutable);

    if (taskDef.parent) {
      const self = taskDef.parent.subTaskDefs.find(d => d.name === taskName);
      equal(t, taskDef, self, `Parent (${taskDef.parent.name}) contains new task (${taskName})`);
    }

    return taskDef;

  } catch (err) {
    if (mustPass) {
      t.fail(`${prefix} must pass - (${stringify(err)}) - ${err.stack}`)
    } else {
      t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err.stack}`)
    }
    return undefined;
  }
}

function checkDefineTask(t, name, execute, mustPass, mustBeExecutable) {
  const prefix = `defineTask(${name}, ${stringify(execute ? execute.name ? execute.name : '<anon>' : execute)})`;
  try {
    const taskDef = TaskDef.defineTask(name, execute);
    if (mustPass) {
      t.pass(`${prefix} must pass`);
    } else {
      t.fail(`${prefix} must fail - (${stringify(taskDef)})`)
    }
    okNotOk(t, taskDef, mustPass, `must be created`, `must not be created`, `TaskDef`);

    const taskName = Strings.trim(name);
    equal(t, taskDef.name, taskName, `name`);
    equal(t, taskDef.execute, execute, `execute`);
    equal(t, taskDef.parent, undefined, `parent`);

    checkExecutable(t, taskDef, mustBeExecutable);

    if (taskDef.parent) {
      const self = taskDef.parent.subTaskDefs.find(d => d.name === taskName);
      equal(t, taskDef, self, `Parent (${taskDef.parent.name}) contains new task (${taskName})`);
    }

    return taskDef;

  } catch (err) {
    if (mustPass) {
      t.fail(`${prefix} must pass - (${stringify(err)}) - ${err.stack}`)
    } else {
      t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err.stack}`)
    }
    return undefined;
  }
}
function checkDefineSubTask(t, name, parent, mustPass, mustBeExecutable) {
  const prefix = `defineSubTask(${name}, ${stringify(parent ? parent.name : parent)})`;
  try {
    const taskDef = parent.defineSubTask(name);
    if (mustPass) {
      t.pass(`${prefix} must pass`);
    } else {
      t.fail(`${prefix} must fail - (${stringify(taskDef)})`)
    }
    okNotOk(t, taskDef, mustPass, `must be created`, `must not be created`, `TaskDef`);

    const taskName = Strings.trim(name);
    equal(t, taskDef.name, taskName, `name`);
    equal(t, taskDef.execute, undefined, `execute`);
    equal(t, taskDef.parent, parent, `parent`);

    checkExecutable(t, taskDef, mustBeExecutable);

    if (taskDef.parent) {
      const self = taskDef.parent.subTaskDefs.find(d => d.name === taskName);
      equal(t, taskDef, self, `Parent (${taskDef.parent.name}) contains new task (${taskName})`);
    }

    return taskDef;

  } catch (err) {
    if (mustPass) {
      t.fail(`${prefix} must pass - (${stringify(err)}) - ${err.stack}`)
    } else {
      t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err.stack}`)
    }
    return undefined;
  }
}

function checkDefineSubTasks(t, names, parent, mustPass, mustBeExecutable) {
  const prefix = `defineSubTasks(${stringify(names)}, ${stringify(parent ? parent.name : parent)})`;
  try {
    const taskDefs = parent.defineSubTasks(names);
    if (mustPass) {
      t.pass(`${prefix} must pass`);
    } else {
      t.fail(`${prefix} must fail - (${stringify(taskDefs)})`)
    }
    okNotOk(t, taskDefs, mustPass, `must be created`, `must not be created`, `TaskDefs`);
    if (mustPass) {
      equal(t, taskDefs.length, names.length, 'length');

      for (let i = 0; i < names.length; ++i) {
        const name = names[i];
        const taskDef = taskDefs[i];

        const taskName = Strings.trim(name);
        equal(t, taskDef.name, taskName, `name`);
        equal(t, taskDef.execute, undefined, `execute`);
        equal(t, taskDef.parent, parent, `parent`);

        checkExecutable(t, taskDef, mustBeExecutable);

        if (taskDef.parent) {
          const self = taskDef.parent.subTaskDefs.find(d => d.name === taskName);
          equal(t, taskDef, self, `Parent (${taskDef.parent.name}) contains new task (${taskName})`);
        }
      }
    }
    return taskDefs;

  } catch (err) {
    if (mustPass) {
      t.fail(`${prefix} must pass - (${stringify(err)}) - ${err.stack}`)
    } else {
      t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err.stack}`)
    }
    return undefined;
  }
}

function checkGetRoot(t, taskDef, expected, mustPass) {
  const prefix = `getRootTaskDef(${stringify(taskDef)})`;
  try {
    const root = TaskDef.getRootTaskDef(taskDef);
    if (mustPass) {
      t.pass(`${prefix} must pass`);
    } else {
      t.fail(`${prefix} must fail - (${stringify(root)})`)
    }

    equal(t, root, expected, prefix);

    if (root && root instanceof TaskDef) {
      t.ok(root.execute, `execute must be defined`);
      equal(t, root.parent, undefined, `parent`);
      checkExecutable(t, root, true);
    }
    return root;

  } catch (err) {
    if (mustPass) {
      t.fail(`${prefix} must pass - (${stringify(err)}) - ${err.stack}`)
    } else {
      t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err.stack}`)
    }
    return undefined;
  }
}


test('new TaskDef', t => {
  const taskDefA = checkNewTaskDef(t, 'TaskA', execute1, undefined, true, true);

  // Task with non-string or blank name
  checkNewTaskDef(t, undefined, execute1, undefined, false, true);
  checkNewTaskDef(t, null, execute1, undefined, false, true);
  checkNewTaskDef(t, {name: 'Bob'}, execute1, undefined, false, true);
  checkNewTaskDef(t, 1, execute1, undefined, false, true);
  checkNewTaskDef(t, '', execute1, undefined, false, true);
  checkNewTaskDef(t, ' \n \t \r ', execute1, undefined, false, true);

  // Task with invalid execute
  checkNewTaskDef(t, 'TaskB1', undefined, undefined, false, true);
  checkNewTaskDef(t, 'TaskB2', null, undefined, false, true);
  checkNewTaskDef(t, 'TaskB3', 'WRONG', undefined, false, true);

  // Check trimming of name
  checkNewTaskDef(t, '   TaskB   ', execute2, undefined, true, true);

  // SubTask with parent & execute
  const subTaskDefB = checkNewTaskDef(t, 'SubTaskB', undefined, taskDefA, true, false);

  console.log(`taskDefA=${stringify(taskDefA)}`);
  console.log(`subTaskDefB=${stringify(subTaskDefB)}`);
  equal(t, taskDefA.subTaskDefs.length, 1, `TaskDef (${taskDefA.name}) subTaskDefs length `);

  const subTaskDefC = checkNewTaskDef(t, 'SubTaskC', undefined, taskDefA, true, false);

  equal(t, taskDefA.subTaskDefs.length, 2, `TaskDef (${taskDefA.name}) subTaskDefs length `);

  // Prevent duplicate subTask def names
  checkNewTaskDef(t, 'SubTaskB', undefined, taskDefA, false, true);
  checkNewTaskDef(t, 'SubTaskC', undefined, taskDefA, false, false);

  equal(t, taskDefA.subTaskDefs.length, 2, `TaskDef (${taskDefA.name}) subTaskDefs length `);

  // SubTask with execute
  checkNewTaskDef(t, 'SubTaskD0', execute1, taskDefA, false, true);

  // SubTask with a subTask parent
  const subTaskDefD = checkNewTaskDef(t, 'SubTaskD', undefined, subTaskDefB, true, false);
  // SubTask with a subTask parent with a subTask parent
  const subTaskDefE = checkNewTaskDef(t, 'SubTaskE', undefined, subTaskDefD, true, false);
  const subTaskDefF = checkNewTaskDef(t, 'SubTaskF', undefined, subTaskDefD, true, false);

  equal(t, taskDefA.subTaskDefs.length, 2, `TaskDef (${taskDefA.name}) subTaskDefs length `);
  equal(t, subTaskDefB.subTaskDefs.length, 1, `TaskDef (${subTaskDefB.name}) subTaskDefs length `);
  equal(t, subTaskDefD.subTaskDefs.length, 2, `TaskDef (${subTaskDefD.name}) subTaskDefs length `);
  equal(t, subTaskDefE.subTaskDefs.length, 0, `TaskDef (${subTaskDefE.name}) subTaskDefs length `);
  equal(t, subTaskDefF.subTaskDefs.length, 0, `TaskDef (${subTaskDefF.name}) subTaskDefs length `);


  t.end();
});

test('defineTask', t => {
  const taskDefA = checkDefineTask(t, 'TaskDA', execute1, true, true);

  // Task with non-string or blank name
  checkDefineTask(t, undefined, execute1, false, true);
  checkDefineTask(t, null, execute1, false, true);
  checkDefineTask(t, {name: 'Bob'}, execute1, false, true);
  checkDefineTask(t, 1, execute1, false, true);
  checkDefineTask(t, '', execute1, false, true);
  checkDefineTask(t, ' \n \t \r ', execute1, false, true);

  // Task with invalid execute
  checkDefineTask(t, 'TaskB1', undefined, false, true);
  checkDefineTask(t, 'TaskB2', null, false, true);
  checkDefineTask(t, 'TaskB3', 'WRONG', false, true);

  // Check trimming of name
  checkDefineTask(t, '   TaskB   ', execute2, true, true);

  t.end();
});


test('defineSubTask', t => {
  const taskDef = TaskDef.defineTask('Task 1', execute1);
  equal(t, taskDef.subTaskDefs.length, 0, `TaskDef (${taskDef.name}) subTaskDefs length `);

  // SubTask with non-string or blank name
  checkDefineSubTask(t, undefined, taskDef, false, false);
  checkDefineSubTask(t, null, taskDef, false, false);
  checkDefineSubTask(t, {name: 'Bob'}, taskDef, false, false);
  checkDefineSubTask(t, 1, taskDef, false, false);
  checkDefineSubTask(t, '', taskDef, false, false);
  checkDefineSubTask(t, ' \n \t \r ', taskDef, false, false);

  // Check trimming of name
  const subTask1A = checkDefineSubTask(t, '   SubTask 1A   ', taskDef, true, false);
  equal(t, subTask1A.subTaskDefs.length, 0, `SubTaskDef (${subTask1A.name}) subTaskDefs length `);
  equal(t, taskDef.subTaskDefs.length, 1, `SubTaskDef (${taskDef.name}) subTaskDefs length `);

  // Check cannot be duplicate name
  checkDefineSubTask(t, '   SubTask 1A   ', taskDef, false, false);
  equal(t, taskDef.subTaskDefs.length, 1, `SubTaskDef (${taskDef.name}) subTaskDefs length `);

  // SubTask with subTask parent
  const subTask1B = checkDefineSubTask(t, 'SubTask 1B', taskDef, true, false);
  equal(t, subTask1B.subTaskDefs.length, 0, `SubTaskDef (${subTask1B.name}) subTaskDefs length `);
  equal(t, taskDef.subTaskDefs.length, 2, `SubTaskDef (${taskDef.name}) subTaskDefs length `);

  const subTask2A = checkDefineSubTask(t, 'SubTask 2A', subTask1B, true, false);
  equal(t, subTask2A.subTaskDefs.length, 0, `SubTaskDef (${subTask2A.name}) subTaskDefs length `);
  equal(t, subTask1B.subTaskDefs.length, 1, `SubTaskDef (${subTask1B.name}) subTaskDefs length `);

  const subTask2B = checkDefineSubTask(t, 'SubTask 2B', subTask1B, true, false);
  equal(t, subTask2B.subTaskDefs.length, 0, `SubTaskDef (${subTask2B.name}) subTaskDefs length `);
  equal(t, subTask1B.subTaskDefs.length, 2, `SubTaskDef (${subTask1B.name}) subTaskDefs length `);

  const subTask3B = checkDefineSubTask(t, 'SubTask 3B', subTask2B, true, false);
  equal(t, subTask3B.subTaskDefs.length, 0, `SubTaskDef (${subTask3B.name}) subTaskDefs length `);
  equal(t, subTask2A.subTaskDefs.length, 0, `SubTaskDef (${subTask2A.name}) subTaskDefs length `);
  equal(t, subTask2B.subTaskDefs.length, 1, `SubTaskDef (${subTask2B.name}) subTaskDefs length `);
  equal(t, subTask1B.subTaskDefs.length, 2, `SubTaskDef (${subTask1B.name}) subTaskDefs length `);
  equal(t, taskDef.subTaskDefs.length, 2, `SubTaskDef (${taskDef.name}) subTaskDefs length `);

  t.end();
});

test('defineSubTasks', t => {
  const taskDef = TaskDef.defineTask('Task 1', execute1);
  equal(t, taskDef.subTaskDefs.length, 0, `TaskDef (${taskDef.name}) subTaskDefs length `);

  // SubTasks with non-string or blank names
  checkDefineSubTasks(t, undefined, taskDef, false, false);
  checkDefineSubTasks(t, [undefined], taskDef, false, false);
  checkDefineSubTasks(t, null, taskDef, false, false);
  checkDefineSubTasks(t, [null], taskDef, false, false);
  checkDefineSubTasks(t, {name: 'Bob'}, taskDef, false, false);
  checkDefineSubTasks(t, [{name: 'Bob'}], taskDef, false, false);
  checkDefineSubTasks(t, 1, taskDef, false, false);
  checkDefineSubTasks(t, [1], taskDef, false, false);
  checkDefineSubTasks(t, '', taskDef, false, false);
  checkDefineSubTasks(t, [''], taskDef, false, false);
  checkDefineSubTasks(t, ' \n \t \r ', taskDef, false, false);
  checkDefineSubTasks(t, [' \n \t \r '], taskDef, false, false);

  const noSubTasks = checkDefineSubTasks(t, [], taskDef, true, false);
  equal(t, noSubTasks.length, 0, `No subTasks length `);

  // Check trimming of name
  const subTasks1 = checkDefineSubTasks(t, ['   SubTask 1A   ', 'SubTask 1B ', ' SubTask 1C'], taskDef, true, false);
  equal(t, subTasks1.length, 3, `SubTaskDefs (${subTasks1.map(t => t.name)}) length `);
  equal(t, taskDef.subTaskDefs.length, 3, `SubTaskDefs (${taskDef.name}) subTaskDefs length `);

  // Check cannot be any duplicate name
  checkDefineSubTasks(t, ['SubTask 1A   ', ' SubTask 1B', 'SubTask 1C'], taskDef, false, false);
  equal(t, taskDef.subTaskDefs.length, 3, `SubTaskDefs (${taskDef.name}) subTaskDefs length `);
  checkDefineSubTasks(t, ['SubTask 1D', 'SubTask 1B', 'SubTask 1C'], taskDef, false, false);
  equal(t, taskDef.subTaskDefs.length, 3, `SubTaskDefs (${taskDef.name}) subTaskDefs length `);
  checkDefineSubTasks(t, ['SubTask 1D', ' SubTask 1E', 'SubTask 1C'], taskDef, false, false);
  equal(t, taskDef.subTaskDefs.length, 3, `SubTaskDefs (${taskDef.name}) subTaskDefs length `);

  // Check can add more non-duplicate names
  const subTasks1b = checkDefineSubTasks(t, ['SubTask 1D', ' SubTask 1E', 'SubTask 1F'], taskDef, true, false);
  equal(t, subTasks1b.length, 3, `SubTaskDefs (${subTasks1b.map(t => t.name)}) length `);
  equal(t, taskDef.subTaskDefs.length, 6, `SubTaskDefs (${taskDef.name}) subTaskDefs length `);

  // SubTasks with subTask parent
  const subTask1F = taskDef.subTaskDefs[5];
  t.equal(subTask1F.name, 'SubTask 1F');
  const subTasks2 = checkDefineSubTasks(t, ['SubTask 2A', 'SubTask 2B'], subTask1F, true, false);
  equal(t, subTasks2.length, 2, `SubTaskDefs (${subTasks2.map(t => t.name)}) length `);
  equal(t, subTasks2[0].subTaskDefs.length, 0, `SubTaskDefs (${subTasks2[0].name}) subTaskDefs length `);
  equal(t, subTasks2[1].subTaskDefs.length, 0, `SubTaskDefs (${subTasks2[1].name}) subTaskDefs length `);
  equal(t, subTask1F.subTaskDefs.length, 2, `SubTaskDefs (${subTask1F.name}) subTaskDefs length `);
  equal(t, taskDef.subTaskDefs.length, 6, `SubTaskDefs (${taskDef.name}) subTaskDefs length `);

  t.end();
});

test('getRootTaskDef', t => {
  // Get root with non-task def
  checkGetRoot(t, undefined, undefined, true);
  checkGetRoot(t, null, undefined, true);
  checkGetRoot(t, {name: 'Bob'}, {name: 'Bob'}, true); // bit weird, but ok
  checkGetRoot(t, {name: 'Joe', parent: {name: "Eve"}}, {name: "Eve"}, true); // bit weird, but ok
  checkGetRoot(t, 1, undefined, true);
  checkGetRoot(t, '', undefined, true);
  checkGetRoot(t, ' \n \t \r ', undefined, true);
  checkGetRoot(t, [], [], true);

  // Create a task def
  const taskDef = TaskDef.defineTask('Task 1', execute1);
  checkGetRoot(t, taskDef, taskDef, true);

  // with 3 subTasks 1A,B,C
  const subTasks1 = taskDef.defineSubTasks(['SubTask 1A', 'SubTask 1B', 'SubTask 1C']);
  const subTask1A = taskDef.subTaskDefs[0];
  const subTask1B = taskDef.subTaskDefs[1];
  const subTask1C = taskDef.subTaskDefs[2];
  // and subTask 1B with 2 sub-subTasks 2A,B
  const subTasks2 = subTask1B.defineSubTasks(['SubTask 2A', 'SubTask 2B']);
  const subTask2A = subTask1B.subTaskDefs[0];
  const subTask2B = subTask1B.subTaskDefs[1];

  checkGetRoot(t, subTask1A, taskDef, true);
  checkGetRoot(t, subTask1B, taskDef, true);
  checkGetRoot(t, subTask1C, taskDef, true);
  checkGetRoot(t, subTask2A, taskDef, true);
  checkGetRoot(t, subTask2B, taskDef, true);

  // Create task def 2
  const taskDef2 = TaskDef.defineTask('Task 2', execute1);
  checkGetRoot(t, taskDef2, taskDef2, true);

  // Create an infinite loop
  function noop() {}
  // Can only do the following if temporarily allow parent to be updatable (bad)
  // const t1 = new TaskDef('T1', noop, undefined);
  // const t2 = new TaskDef('T2', undefined, t1);
  // Object.defineProperty(t1, 'parent', {value: t2, writable: true});
  // checkGetRoot(t, t1, undefined, false);
  // checkGetRoot(t, t2, undefined, false);

  // Simulate infinite loop with non-TaskDefs
  const t1 = {name: 'T1', execute: noop};
  const t2 = {name: 'T2', execute: undefined};
  Object.defineProperty(t2, 'parent', {value: t1, enumerable: false});
  Object.defineProperty(t1, 'parent', {value: t2, enumerable: false});
  checkGetRoot(t, t1, undefined, false);
  checkGetRoot(t, t2, undefined, false);

  t.end();
});

test('areSubTaskNamesDistinct', t => {
  function check(parent, proposedNames, expected) {
    equal(t, areSubTaskNamesDistinct(parent, proposedNames), expected, `areSubTaskNamesDistinct(<${parent.name} ${stringify(parent.subTaskDefs.map(t => t.name))}>, ${stringify(proposedNames)}) ->`);
  }
  // Create task
  const taskDef = TaskDef.defineTask('Task 1', execute1);
  // with 3 subTasks 1A,B,C
  taskDef.defineSubTasks(['SubTask 1A', 'SubTask 1B', 'SubTask 1C']);
  const subTask1A = taskDef.subTaskDefs[0];
  const subTask1B = taskDef.subTaskDefs[1];
  const subTask1C = taskDef.subTaskDefs[2];
  // and subTask 1B with 2 sub-subTasks 2A,B
  subTask1B.defineSubTasks(['SubTask 2A', 'SubTask 2B']);
  const subTask2A = subTask1B.subTaskDefs[0];
  const subTask2B = subTask1B.subTaskDefs[1];

  check(taskDef, 'Task 1', true);
  check(taskDef, 'SubTask 1A', false);
  check(taskDef, 'SubTask 1B', false);
  check(taskDef, 'SubTask 1C', false);
  check(taskDef, 'SubTask 1Z', true);
  check(taskDef, 'SubTask 2A', true);
  check(taskDef, 'SubTask 2B', true);
  check(taskDef, 'SubTask 2Z', true);

  const subTasks = [subTask1A, subTask1C, subTask2A, subTask2B];
  subTasks.forEach(subTask => {
    check(subTask, 'Task 1', true);
    check(subTask, 'SubTask 1A', true);
    check(subTask, 'SubTask 1B', true);
    check(subTask, 'SubTask 1C', true);
    check(subTask, 'SubTask 1Z', true);
    check(subTask, 'SubTask 2A', true);
    check(subTask, 'SubTask 2B', true);
    check(subTask, 'SubTask 2Z', true);
  });

  check(subTask1B, 'Task 1', true);
  check(subTask1B, 'SubTask 1A', true);
  check(subTask1B, 'SubTask 1B', true);
  check(subTask1B, 'SubTask 1C', true);
  check(subTask1B, 'SubTask 1Z', true);
  check(subTask1B, 'SubTask 2A', false);
  check(subTask1B, 'SubTask 2B', false);
  check(subTask1B, 'SubTask 2Z', true);

  t.end();
});

test('ensureAllTaskDefsDistinct', t => {
  function check(parent, proposedTaskDef, mustPass) {
    const prefix = `ensureAllTaskDefsDistinct(${parent ? parent.name : parent}, ${stringify(proposedTaskDef ? proposedTaskDef.name : proposedTaskDef)}) ->`;
    try {
      ensureAllTaskDefsDistinct(parent, proposedTaskDef);
      if (mustPass) {
        t.pass(`${prefix} must pass`);
      } else {
        t.fail(`${prefix} must fail - (${stringify(root)})`)
      }
    } catch (err) {
      if (mustPass) {
        t.fail(`${prefix} must pass - (${stringify(err)}) - ${err.stack}`)
      } else {
        t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err.stack}`)
      }
    }
  }

  // Check bad input
  check(undefined, undefined, true);
  check(null, null, true);

  // Create task
  const taskDef = TaskDef.defineTask('Task 1', execute1);
  const taskDef2 = TaskDef.defineTask('Task 2', execute1);

  // Check partial input
  check(taskDef, null, true);
  check(null, taskDef, true);

  check(taskDef, taskDef, false);
  check(taskDef2, taskDef2, false);

  check(taskDef, taskDef2, true);
  check(taskDef2, taskDef, true);

  // with 3 subTasks 1A,B,C
  taskDef.defineSubTasks(['SubTask 1A', 'SubTask 1B', 'SubTask 1C']);
  const subTask1A = taskDef.subTaskDefs[0];
  check(taskDef, subTask1A, false);
  check(subTask1A, taskDef, false);

  check(subTask1A, taskDef2, true);
  check(taskDef2, subTask1A, true);

  const subTask1B = taskDef.subTaskDefs[1];
  // and subTask 1B with sub-subTasks 2A
  subTask1B.defineSubTasks(['SubTask 2A']);
  const subTask2A = subTask1B.subTaskDefs[0];

  check(taskDef, subTask2A, false);
  check(subTask2A, taskDef, false);
  check(subTask1A, subTask2A, false);
  check(subTask2A, subTask1A, false);

  check(subTask2A, taskDef2, true);
  check(taskDef2, subTask2A, true);

  const subTask1C = taskDef.subTaskDefs[2];

  t.end();
});
