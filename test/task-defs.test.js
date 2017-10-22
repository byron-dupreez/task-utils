'use strict';

/**
 * Unit tests for task-utils/tasks.js
 * @author Byron du Preez
 */

const test = require('tape');

// The test subject
const TaskDef = require('../task-defs');
const ensureAllTaskDefsDistinct = TaskDef.ensureAllTaskDefsDistinct;
const areSubTaskNamesDistinct = TaskDef.areSubTaskNamesDistinct;

const Strings = require('core-functions/strings');
const stringify = Strings.stringify;

// const states = require('../task-states');

function genDescribeItem(maxArgLength) {
  // An arbitrary describeItem function
  function describeItem() {
    const n = arguments.length;
    const args = new Array(n);
    for (let i = 0; i < n; ++i) {
      const arg = arguments[i];
      const isObject = arg && typeof arg === 'object';
      const isString = typeof arg === 'string';
      const s = JSON.stringify(arg);
      const suffix = s && s.length > maxArgLength ? ' ...' + (isObject ? '}' : isString ? '"' : '') : '';
      args[i] = s ? s.length > 0 && maxArgLength > 0 ? s.substring(0, maxArgLength) + suffix : s : `${s}`;
    }
    return n > 0 ? `on (${args.join(", ")})` : '';
  }

  return describeItem;
}

function execute1() {
  console.log(`Executing execute1 on task (${this.name})`);
}
function execute2() {
  console.log(`Executing execute2 on task (${this.name})`);
}

function checkExecutable(t, taskDef, expectedExecutable) {
  t.equal(taskDef.executable, expectedExecutable, `${taskDef.name}.executable must be ${expectedExecutable}`);
  const expectedManaged = expectedExecutable ? undefined : true;
  t.equal(taskDef.managed, expectedManaged, `${taskDef.name}.managed must be ${expectedManaged}`);
}

function checkDefineSubTask(parent, name, execute, t, mustPass, mustBeExecutable) {
  const prefix = `${stringify(parent ? parent.name : parent)}.defineSubTask(${name}, ${stringify(execute)})`;
  try {
    const taskDef = parent.defineSubTask(name, execute);
    if (mustPass) {
      t.pass(`${prefix} must pass`);
      t.ok(taskDef, 'taskDef must be created');
    } else {
      t.fail(`${prefix} must fail - (${JSON.stringify(taskDef)})`);
      t.notOk(taskDef, 'taskDef must not be created');
    }

    const taskName = Strings.trim(name);
    t.equal(taskDef.name, taskName, `name must be ${taskName}`);

    if (mustBeExecutable)
      t.ok(typeof taskDef.execute === 'function', `${taskDef.name} execute must be a function`);
    else
      t.equal(taskDef.execute, undefined, `${taskDef.name} execute must be undefined`);

    t.equal(taskDef.parent, parent, `${taskDef.name} parent must be ${parent ? parent.name : parent}`);

    checkExecutable(t, taskDef, mustBeExecutable);

    if (taskDef.parent) {
      const self = taskDef.parent.subTaskDefs.find(d => d.name === taskName);
      t.equal(taskDef, self, `Parent (${taskDef.parent.name}) contains new task (${taskName})`);
    }

    return taskDef;

  } catch (err) {
    if (mustPass) {
      t.fail(`${prefix} must pass - (${stringify(err)}) - ${err}`)
    } else {
      t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err}`)
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
      t.ok(taskDefs, 'taskDefs must be created');
    } else {
      t.fail(`${prefix} must fail - (${stringify(taskDefs)})`);
      t.notOk(taskDefs, 'taskDefs must not be created');
    }

    if (mustPass) {
      t.equal(taskDefs.length, names.length, 'taskDefs.length must be names.length');

      for (let i = 0; i < names.length; ++i) {
        const name = names[i];
        const taskDef = taskDefs[i];

        const taskName = Strings.trim(name);
        t.equal(taskDef.name, taskName, `name must be ${taskName}`);
        t.equal(taskDef.execute, undefined, `execute must be undefined`);
        t.equal(taskDef.parent, parent, `parent must be ${parent ? parent.name : parent}`);

        checkExecutable(t, taskDef, mustBeExecutable);

        if (taskDef.parent) {
          const self = taskDef.parent.subTaskDefs.find(d => d.name === taskName);
          t.equal(taskDef, self, `Parent (${taskDef.parent.name}) contains new task (${taskName})`);
        }
      }
    }
    return taskDefs;

  } catch (err) {
    if (mustPass) {
      t.fail(`${prefix} must pass - (${stringify(err)}) - ${err}`)
    } else {
      t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err}`)
    }
    return undefined;
  }
}

function checkGetRoot(t, taskDef, expected, mustPass) {
  const prefix = `getRootTaskDef(${JSON.stringify(taskDef)})`;
  try {
    const root = TaskDef.getRootTaskDef(taskDef);
    if (mustPass) {
      t.pass(`${prefix} must pass`);
    } else {
      t.fail(`${prefix} must fail - (${JSON.stringify(root)})`)
    }

    t.deepEqual(root, expected, `root (${root ? root.name : root} must be ${expected ? expected.name : expected}`);

    if (root && root instanceof TaskDef) {
      t.ok(root.execute, `execute must be defined`);
      t.equal(root.parent, undefined, `parent must be undefined`);
      checkExecutable(t, root, true);
    }
    return root;

  } catch (err) {
    if (mustPass) {
      t.fail(`${prefix} must pass - (${err}) - ${err}`)
    } else {
      t.pass(`${prefix} must fail - (${err})`); // ${err}`)
    }
    return undefined;
  }
}

test('new TaskDef', t => {

  function checkNewTaskDef(t, name, execute, parent, settings, mustPass, mustBeExecutable) {
    const prefix = `new TaskDef(${name}, ${stringify(execute ? execute.name ? execute.name : '<anon>' : execute)}, ${stringify(parent ? parent.name : parent)}, ${stringify(settings)})`;
    try {
      const taskDef = new TaskDef(name, execute, parent, settings);
      if (mustPass) {
        t.pass(`${prefix} must pass`);
        t.ok(taskDef, 'taskDef must be created');
      } else {
        t.fail(`${prefix} must fail - (${JSON.stringify(taskDef)})`);
        t.notOk(taskDef, 'taskDef must not be created');
      }

      const taskName = Strings.trim(name);
      t.equal(taskDef.name, taskName, `name must be ${taskName}`);
      t.equal(taskDef.execute, execute, `execute must be ${stringify(execute)}`);
      t.equal(taskDef.parent, parent, `parent must be ${parent ? parent.name : parent}`);
      t.equal(taskDef.describeItem, settings ? settings.describeItem : undefined, `describeItem must be ${stringify(settings.describeItem)}`);

      checkExecutable(t, taskDef, mustBeExecutable);

      if (taskDef.parent) {
        const self = taskDef.parent.subTaskDefs.find(d => d.name === taskName);
        t.equal(taskDef, self, `Parent (${taskDef.parent.name}) contains new task (${taskName})`);
      }

      return taskDef;

    } catch (err) {
      if (mustPass) {
        t.fail(`${prefix} must pass - (${stringify(err)}) - ${err}`)
      } else {
        t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err}`)
      }
      return undefined;
    }
  }

  const settings = {describeItem: genDescribeItem(10)};

  const taskDefA = checkNewTaskDef(t, 'TaskA', execute1, undefined, settings, true, true);

  // Task with non-string or blank name
  checkNewTaskDef(t, undefined, execute1, undefined, settings, false, true);
  checkNewTaskDef(t, null, execute1, undefined, settings, false, true);
  checkNewTaskDef(t, {name: 'Bob'}, execute1, undefined, settings, false, true);
  checkNewTaskDef(t, 1, execute1, undefined, settings, false, true);
  checkNewTaskDef(t, '', execute1, undefined, settings, false, true);
  checkNewTaskDef(t, ' \n \t \r ', execute1, undefined, settings, false, true);

  // Task with invalid execute
  checkNewTaskDef(t, 'TaskB1', undefined, undefined, settings, false, true);
  checkNewTaskDef(t, 'TaskB2', null, undefined, settings, false, true);
  checkNewTaskDef(t, 'TaskB3', 'WRONG', undefined, settings, false, true);

  // Check trimming of name
  checkNewTaskDef(t, '   TaskB   ', execute2, undefined, settings, true, true);

  // SubTask with parent & without execute
  const subTaskDefB = checkNewTaskDef(t, 'SubTaskB', undefined, taskDefA, settings, true, false);

  //console.log(`taskDefA=${stringify(taskDefA)}`);
  //console.log(`subTaskDefB=${stringify(subTaskDefB)}`);
  t.equal(taskDefA.subTaskDefs.length, 1, `TaskDef (${taskDefA.name}) subTaskDefs length must be 1`);

  /*const subTaskDefC =*/
  checkNewTaskDef(t, 'SubTaskC', undefined, taskDefA, settings, true, false);

  t.equal(taskDefA.subTaskDefs.length, 2, `TaskDef (${taskDefA.name}) subTaskDefs length must be 2`);

  // Prevent duplicate subTask def names
  checkNewTaskDef(t, 'SubTaskB', undefined, taskDefA, settings, false, true);
  checkNewTaskDef(t, 'SubTaskC', undefined, taskDefA, settings, false, false);

  t.equal(taskDefA.subTaskDefs.length, 2, `TaskDef (${taskDefA.name}) subTaskDefs length must be 2`);

  // SubTask with execute
  const subTaskDefX = checkNewTaskDef(t, 'SubTaskX', execute1, taskDefA, settings, true, true);

  // SubTask with a subTask parent
  const subTaskDefD = checkNewTaskDef(t, 'SubTaskD', undefined, subTaskDefB, settings, true, false);
  // SubTask with a subTask parent with a subTask parent
  const subTaskDefE = checkNewTaskDef(t, 'SubTaskE', undefined, subTaskDefD, settings, true, false);
  const subTaskDefF = checkNewTaskDef(t, 'SubTaskF', undefined, subTaskDefD, settings, true, false);

  t.equal(taskDefA.subTaskDefs.length, 3, `TaskDef (${taskDefA.name}) subTaskDefs length must be 3`);
  t.equal(subTaskDefB.subTaskDefs.length, 1, `TaskDef (${subTaskDefB.name}) subTaskDefs length must be 1`);
  t.equal(subTaskDefD.subTaskDefs.length, 2, `TaskDef (${subTaskDefD.name}) subTaskDefs length must be 2`);
  t.equal(subTaskDefE.subTaskDefs.length, 0, `TaskDef (${subTaskDefE.name}) subTaskDefs length must be 0`);
  t.equal(subTaskDefF.subTaskDefs.length, 0, `TaskDef (${subTaskDefF.name}) subTaskDefs length must be 0`);

  // SubTask with parent & execute
  checkNewTaskDef(t, 'SubTaskX1', execute2, subTaskDefX, settings, true, true);
  t.equal(subTaskDefX.subTaskDefs.length, 1, `SubTaskX (${subTaskDefX.name}) subTaskDefs length must be 1`);

  t.end();
});

test('defineTask', t => {
  function checkDefineTask(t, name, execute, mustPass, mustBeExecutable) {
    const prefix = `defineTask(${name}, ${stringify(execute ? execute.name ? execute.name : '<anon>' : execute)})`;
    try {
      const taskDef = TaskDef.defineTask(name, execute);
      if (mustPass) {
        t.pass(`${prefix} must pass`);
        t.ok(taskDef, 'taskDef must be created');
      } else {
        t.fail(`${prefix} must fail - (${stringify(taskDef)})`);
        t.notOk(taskDef, 'taskDef must not be created');
      }

      const taskName = Strings.trim(name);
      t.equal(taskDef.name, taskName, `taskDef.name must be ${taskName}`);
      t.equal(taskDef.execute, execute, `taskDef.execute must be ${stringify(execute)}`);
      t.equal(taskDef.parent, undefined, `taskDef.parent must be undefined`);

      checkExecutable(t, taskDef, mustBeExecutable);

      if (taskDef.parent) {
        const self = taskDef.parent.subTaskDefs.find(d => d.name === taskName);
        t.equal(taskDef, self, `Parent (${taskDef.parent.name}) contains new task (${taskName})`);
      }

      return taskDef;

    } catch (err) {
      if (mustPass) {
        t.fail(`${prefix} must pass - (${stringify(err)}) - ${err}`)
      } else {
        t.pass(`${prefix} must fail - (${stringify(err)})`); // ${err}`)
      }
      return undefined;
    }
  }

  /*const taskDefA =*/
  checkDefineTask(t, 'TaskDA', execute1, true, true);

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
})
;

test('defineSubTask - define non-executable, managed sub-tasks', t => {
  const taskDef = TaskDef.defineTask('Task 1', execute1);
  t.equal(taskDef.subTaskDefs.length, 0, `TaskDef (${taskDef.name}) subTaskDefs length must be 0`);

  // SubTask with non-string or blank name
  checkDefineSubTask(taskDef, undefined, undefined, t, false, false);
  checkDefineSubTask(taskDef, null, undefined, t, false, false);
  checkDefineSubTask(taskDef, {name: 'Bob'}, undefined, t, false, false);
  checkDefineSubTask(taskDef, 1, undefined, t, false, false);
  checkDefineSubTask(taskDef, '', undefined, t, false, false);
  checkDefineSubTask(taskDef, ' \n \t \r ', undefined, t, false, false);

  // Check trimming of name
  const subTask1A = checkDefineSubTask(taskDef, '   SubTask 1A   ', undefined, t, true, false);
  t.equal(subTask1A.subTaskDefs.length, 0, `SubTaskDef (${subTask1A.name}) subTaskDefs length must be 0`);
  t.equal(taskDef.subTaskDefs.length, 1, `SubTaskDef (${taskDef.name}) subTaskDefs length must be 1`);

  // Check cannot be duplicate name
  checkDefineSubTask(taskDef, '   SubTask 1A   ', undefined, t, false, false);
  t.equal(taskDef.subTaskDefs.length, 1, `SubTaskDef (${taskDef.name}) subTaskDefs length must be 1`);

  // SubTask with subTask parent
  const subTask1B = checkDefineSubTask(taskDef, 'SubTask 1B', undefined, t, true, false);
  t.equal(subTask1B.subTaskDefs.length, 0, `SubTaskDef (${subTask1B.name}) subTaskDefs length must be 0`);
  t.equal(taskDef.subTaskDefs.length, 2, `SubTaskDef (${taskDef.name}) subTaskDefs length must be 2`);

  const subTask2A = checkDefineSubTask(subTask1B, 'SubTask 2A', undefined, t, true, false);
  t.equal(subTask2A.subTaskDefs.length, 0, `SubTaskDef (${subTask2A.name}) subTaskDefs length must be 0`);
  t.equal(subTask1B.subTaskDefs.length, 1, `SubTaskDef (${subTask1B.name}) subTaskDefs length must be 1`);

  const subTask2B = checkDefineSubTask(subTask1B, 'SubTask 2B', undefined, t, true, false);
  t.equal(subTask2B.subTaskDefs.length, 0, `SubTaskDef (${subTask2B.name}) subTaskDefs length must be 0`);
  t.equal(subTask1B.subTaskDefs.length, 2, `SubTaskDef (${subTask1B.name}) subTaskDefs length must be 2`);

  const subTask3B = checkDefineSubTask(subTask2B, 'SubTask 3B', undefined, t, true, false);
  t.equal(subTask3B.subTaskDefs.length, 0, `SubTaskDef (${subTask3B.name}) subTaskDefs length must be 0`);
  t.equal(subTask2A.subTaskDefs.length, 0, `SubTaskDef (${subTask2A.name}) subTaskDefs length must be 0`);
  t.equal(subTask2B.subTaskDefs.length, 1, `SubTaskDef (${subTask2B.name}) subTaskDefs length must be 1`);
  t.equal(subTask1B.subTaskDefs.length, 2, `SubTaskDef (${subTask1B.name}) subTaskDefs length must be 2`);
  t.equal(taskDef.subTaskDefs.length, 2, `SubTaskDef (${taskDef.name}) subTaskDefs length must be 2`);

  t.end();
});

test('defineSubTask - define executable sub-tasks', t => {
  const taskDef = TaskDef.defineTask('Task 1', execute1);
  t.equal(taskDef.subTaskDefs.length, 0, `TaskDef (${taskDef.name}) subTaskDefs length must be 0`);

  // SubTask with non-string or blank name
  checkDefineSubTask(taskDef, undefined, execute2, t, false, true);
  checkDefineSubTask(taskDef, null, execute2, t, false, true);
  checkDefineSubTask(taskDef, {name: 'Bob'}, execute2, t, false, true);
  checkDefineSubTask(taskDef, 1, execute2, t, false, true);
  checkDefineSubTask(taskDef, '', execute2, t, false, true);
  checkDefineSubTask(taskDef, ' \n \t \r ', execute2, t, false, true);

  // Check trimming of name
  const subTask1A = checkDefineSubTask(taskDef, '   SubTask 1A   ', execute2, t, true, true);
  t.equal(subTask1A.subTaskDefs.length, 0, `SubTaskDef (${subTask1A.name}) subTaskDefs length must be 0`);
  t.equal(taskDef.subTaskDefs.length, 1, `SubTaskDef (${taskDef.name}) subTaskDefs length must be 1`);

  // Check cannot be duplicate name
  checkDefineSubTask(taskDef, '   SubTask 1A   ', execute2, t, false, true);
  t.equal(taskDef.subTaskDefs.length, 1, `SubTaskDef (${taskDef.name}) subTaskDefs length must be 1`);

  // SubTask with subTask parent
  const subTask1B = checkDefineSubTask(taskDef, 'SubTask 1B', execute2, t, true, true);
  t.equal(subTask1B.subTaskDefs.length, 0, `SubTaskDef (${subTask1B.name}) subTaskDefs length must be 0`);
  t.equal(taskDef.subTaskDefs.length, 2, `SubTaskDef (${taskDef.name}) subTaskDefs length must be 2`);

  const subTask2A = checkDefineSubTask(subTask1B, 'SubTask 2A', execute2, t, true, true);
  t.equal(subTask2A.subTaskDefs.length, 0, `SubTaskDef (${subTask2A.name}) subTaskDefs length must be 0`);
  t.equal(subTask1B.subTaskDefs.length, 1, `SubTaskDef (${subTask1B.name}) subTaskDefs length must be 1`);

  const subTask2B = checkDefineSubTask(subTask1B, 'SubTask 2B', execute2, t, true, true);
  t.equal(subTask2B.subTaskDefs.length, 0, `SubTaskDef (${subTask2B.name}) subTaskDefs length must be 0`);
  t.equal(subTask1B.subTaskDefs.length, 2, `SubTaskDef (${subTask1B.name}) subTaskDefs length must be 2`);

  const subTask3B = checkDefineSubTask(subTask2B, 'SubTask 3B', execute2, t, true, true);
  t.equal(subTask3B.subTaskDefs.length, 0, `SubTaskDef (${subTask3B.name}) subTaskDefs length must be 0`);
  t.equal(subTask2A.subTaskDefs.length, 0, `SubTaskDef (${subTask2A.name}) subTaskDefs length must be 0`);
  t.equal(subTask2B.subTaskDefs.length, 1, `SubTaskDef (${subTask2B.name}) subTaskDefs length must be 1`);
  t.equal(subTask1B.subTaskDefs.length, 2, `SubTaskDef (${subTask1B.name}) subTaskDefs length must be 2`);
  t.equal(taskDef.subTaskDefs.length, 2, `SubTaskDef (${taskDef.name}) subTaskDefs length must be 2`);

  t.end();
});

test('defineSubTasks - define multiple non-executable, managed sub-tasks', t => {
  const taskDef = TaskDef.defineTask('Task 1', execute1);
  t.equal(taskDef.subTaskDefs.length, 0, `TaskDef (${taskDef.name}) subTaskDefs length `);

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
  t.equal(noSubTasks.length, 0, `No subTasks length must be 0`);

  // Check trimming of name
  const subTasks1 = checkDefineSubTasks(t, ['   SubTask 1A   ', 'SubTask 1B ', ' SubTask 1C'], taskDef, true, false);
  t.equal(subTasks1.length, 3, `SubTaskDefs (${subTasks1.map(t => t.name)}) length must be 3`);
  t.equal(taskDef.subTaskDefs.length, 3, `SubTaskDefs (${taskDef.name}) subTaskDefs length must be 3`);

  // Check cannot be any duplicate name
  checkDefineSubTasks(t, ['SubTask 1A   ', ' SubTask 1B', 'SubTask 1C'], taskDef, false, false);
  t.equal(taskDef.subTaskDefs.length, 3, `SubTaskDefs (${taskDef.name}) subTaskDefs length must be 3`);
  checkDefineSubTasks(t, ['SubTask 1D', 'SubTask 1B', 'SubTask 1C'], taskDef, false, false);
  t.equal(taskDef.subTaskDefs.length, 3, `SubTaskDefs (${taskDef.name}) subTaskDefs length must be 3`);
  checkDefineSubTasks(t, ['SubTask 1D', ' SubTask 1E', 'SubTask 1C'], taskDef, false, false);
  t.equal(taskDef.subTaskDefs.length, 3, `SubTaskDefs (${taskDef.name}) subTaskDefs length must be 3`);

  // Check can add more non-duplicate names
  const subTasks1b = checkDefineSubTasks(t, ['SubTask 1D', ' SubTask 1E', 'SubTask 1F'], taskDef, true, false);
  t.equal(subTasks1b.length, 3, `SubTaskDefs (${subTasks1b.map(t => t.name)}) length must be 3`);
  t.equal(taskDef.subTaskDefs.length, 6, `SubTaskDefs (${taskDef.name}) subTaskDefs length must be 6`);

  // SubTasks with subTask parent
  const subTask1F = taskDef.subTaskDefs[5];
  t.equal(subTask1F.name, 'SubTask 1F');
  const subTasks2 = checkDefineSubTasks(t, ['SubTask 2A', 'SubTask 2B'], subTask1F, true, false);
  t.equal(subTasks2.length, 2, `SubTaskDefs (${subTasks2.map(t => t.name)}) length must be 2`);
  t.equal(subTasks2[0].subTaskDefs.length, 0, `SubTaskDefs (${subTasks2[0].name}) subTaskDefs length must be 0`);
  t.equal(subTasks2[1].subTaskDefs.length, 0, `SubTaskDefs (${subTasks2[1].name}) subTaskDefs length must be 0`);
  t.equal(subTask1F.subTaskDefs.length, 2, `SubTaskDefs (${subTask1F.name}) subTaskDefs length must be 2`);
  t.equal(taskDef.subTaskDefs.length, 6, `SubTaskDefs (${taskDef.name}) subTaskDefs length must be 6`);

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
  /*const subTasks1 =*/
  taskDef.defineSubTasks(['SubTask 1A', 'SubTask 1B', 'SubTask 1C']);
  const subTask1A = taskDef.subTaskDefs[0];
  const subTask1B = taskDef.subTaskDefs[1];
  const subTask1C = taskDef.subTaskDefs[2];
  // and subTask 1B with 2 sub-subTasks 2A,B
  /*const subTasks2 =*/
  subTask1B.defineSubTasks(['SubTask 2A', 'SubTask 2B']);
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
  function noop() {
  }

  // Can only do the following if temporarily allow parent to be updatable (bad)
  // const t1 = new TaskDef('T1', noop, undefined, settings);
  // const t2 = new TaskDef('T2', undefined, t1, settings);
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
    t.equal(areSubTaskNamesDistinct(parent, proposedNames), expected, `areSubTaskNamesDistinct(<${parent.name} ${stringify(parent.subTaskDefs.map(t => t.name))}>, ${stringify(proposedNames)}) must be ${stringify(expected)}`);
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
        t.fail(`${prefix} must fail - (${prefix}`);
      }
    } catch (err) {
      if (mustPass) {
        t.fail(`${prefix} must pass - ${err}`);
      } else {
        t.pass(`${prefix} must fail - ${err}`);
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

  //const subTask1C = taskDef.subTaskDefs[2];

  t.end();
});

// // =====================================================================================================================
// // detachSubTaskDef
// // =====================================================================================================================
//
// test('detachSubTaskDef', t => {
//
//   const taskDef = TaskDef.defineTask('Task 1', execute1);
//
//   const subTaskName = 'SubTask 1A';
//
//   const subTask0 = taskDef.detachSubTaskDef(subTaskName);
//   t.equal(subTask0, undefined, `taskDef.detachSubTaskDef(${subTaskName}) must be undefined`);
//
//   const subTask = taskDef.defineSubTask(subTaskName, execute2);
//
//   t.equal(subTask.parent, taskDef, `subTask.parent must be taskDef`);
//   t.ok(taskDef.subTaskDefs.indexOf(subTask) !== -1, `taskDef.subTaskDefs contains subTask`);
//
//   const subTask1 = taskDef.detachSubTaskDef(subTaskName);
//
//   t.equal(subTask1, subTask, `taskDef.detachSubTaskDef(${subTaskName}) must be subTask`);
//
//   t.equal(subTask.parent, undefined, `subTask.parent must be undefined`);
//   t.ok(taskDef.subTaskDefs.indexOf(subTask) === -1, `taskDef.subTaskDefs does NOT contain subTask`);
//
//   const subTask2 = taskDef.detachSubTaskDef(subTaskName);
//   t.equal(subTask2, undefined, `taskDef.detachSubTaskDef(${subTaskName}) must be undefined`);
//
//   // Re-add same sub-task again
//   const subTask3 = taskDef.defineSubTask(subTaskName, execute2);
//
//   t.notEqual(subTask3, subTask, `subTask3 must not be subTask`);
//   t.notEqual(subTask3, subTask2, `subTask3 must not be subTask2`);
//
//   t.equal(subTask3.parent, taskDef, `subTask3.parent must be taskDef`);
//   t.ok(taskDef.subTaskDefs.indexOf(subTask3) !== -1, `taskDef.subTaskDefs contains subTask3`);
//
//   t.end();
// });