'use strict';

/**
 * Unit tests for task-utils/task-utils.js
 * @author Byron du Preez
 */

const test = require("tape");

// Test subject
const taskUtils = require('../task-utils');
const getTask = taskUtils.getTask;
const getSubTask = taskUtils.getSubTask;
const getTasks = taskUtils.getTasks;
const getTasksAndSubTasks = taskUtils.getTasksAndSubTasks;
const setTask = taskUtils.setTask;
const reviveTasks = taskUtils.reviveTasks;
const isTaskFactoryConfigured = taskUtils.isTaskFactoryConfigured;
const configureTaskFactory = taskUtils.configureTaskFactory;
const constructTaskFactory = taskUtils.constructTaskFactory;
const getDefaultTaskFactoryOpts = taskUtils.getDefaultTaskFactoryOpts;

const core = require('../core');
const ReturnMode = core.ReturnMode;

const TaskDef = require('../task-defs');
const TaskFactory = require('../task-factory');
const Task = require('../tasks');

// const states = require('../task-states');

const Arrays = require('core-functions/arrays');
// const Booleans = require('core-functions/booleans');
// const isTrueOrFalse = Booleans.isTrueOrFalse;

const strings = require('core-functions/strings');
const stringify = strings.stringify;

const taskFactory1 = new TaskFactory({logger: console, describeItem: genDescribeItem(10)}, {returnMode: ReturnMode.NORMAL});
// const taskFactory2 = new TaskFactory({logger: console, describeItem: genDescribeItem(10)}, {returnMode: ReturnMode.SUCCESS_OR_FAILURE});

class SimpleTaskFactory extends TaskFactory {
  generateExecute(task, execute) {
    return execute.bind(task);
  }
}

function createTaskFactory(settings, options) {
  return new TaskFactory(settings, options)
}
function createNonTaskFactory(settings, options) {
  return {logger: settings && settings.logger ? settings.logger : console, opts: options};
}
function createTaskFactoryThrows(settings, options) {
  throw new Error(`Planned error (${stringify(settings)}, ${stringify(options)})`);
}
function createSimpleTaskFactory(settings, options) {
  return new SimpleTaskFactory(settings, options)
}

const usableCreateTaskFactoryFunctions = [undefined, null, createTaskFactory, createSimpleTaskFactory];
const unusableCreateTaskFactoryFunctions = ['Bob', createNonTaskFactory, createTaskFactoryThrows];
const describeItemFunctions = [undefined, genDescribeItem(7)];

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

//======================================================================================================================
// getTask
//======================================================================================================================

test('getTask with no tasks returns undefined', t => {
  const t0 = getTask(undefined, 'task1');
  t.notOk(t0, 'task must not be defined');

  const t1 = getTask(null, 'task1');
  t.notOk(t1, 'task must not be defined');

  const tasksByName = {};
  const t2 = getTask(tasksByName, 'task1');
  t.notOk(t2, 'task must not be defined');

  const obj = {myTasks: {}};
  const t3 = getTask(obj.myTasks, 'task1');
  t.notOk(t3, 'task must not be defined');
  t.end();
});

test('getTask with an empty object "task" returns it', t => {
  const o = {myTasks: {task1: {}}};
  const task = getTask(o.myTasks, 'task1');
  t.ok(task, 'task1 must be defined');
  t.equal(task, o.myTasks.task1, `task1 ${stringify(task)} must be ${stringify(o.myTasks.task1)}`);
  t.end();
});

test('getTask with multiple "tasks" returns each', t => {
  const o = {myTasks: {'Task A': {}, 'Task B': {}, 'Task C': {}}};
  t.equal(getTask(o.myTasks, 'Task A'), o.myTasks['Task A'], 'Task A must match');
  t.equal(getTask(o.myTasks, 'Task B'), o.myTasks['Task B'], 'Task B must match');
  t.equal(getTask(o.myTasks, 'Task C'), o.myTasks['Task C'], 'Task C must match');
  t.end();
});

test('getTask with other tasks returns undefined', t => {
  const o = {myTasks: {'Task A': {}, 'Task B': {}, 'Task C': {}}};
  const task = getTask(o.myTasks, 'Task X');
  t.equal(task, undefined, 'Task X must be undefined');
  t.end();
});

/**
 * Creates a task using the given
 * @param {TaskDef} taskDef
 * @param {TaskFactory|undefined} [factory]
 * @param {TaskOpts|undefined} [opts]
 * @returns {Task}
 */
function createTask(taskDef, factory, opts) {
  factory = factory ? factory : taskFactory1;
  return factory.createTask(taskDef, opts);
}

test('getTask with a real Task returns it', t => {
  const msg = {
    id: '123',
    message: 'Yo',
    myTasks: {
      processOneTasks: {
        arb1: 'Arbitrary 1'
      },
      processManyTasks: {
        arb2: 'Arbitrary 2'
      },
      arb: 'Arbitrary'
    }
  };

  // Create a real task
  const taskName = 'Task 1';
  const taskDef = TaskDef.defineTask(taskName, () => {
  });
  taskDef.defineSubTasks(['SubTask 1a', 'SubTask 1b']);
  const origTask = createTask(taskDef);

  // Set the named task on the processOneTasks object
  const processOneTasks = msg.myTasks.processOneTasks;

  processOneTasks[taskName] = origTask;

  // Get should return the task just registered
  const task = getTask(processOneTasks, taskName);

  t.ok(task, `${task.name} must be defined`);
  t.equal(task, origTask, `${task.name} ${stringify(task)} must be ${stringify(origTask)}`);

  t.end();
});

test('getTask with a Task-like returns it', t => {
  const msg = {
    id: '123',
    message: 'Yo',
    myTasks: {
      processOneTasks: {
        arb1: 'Arbitrary 1'
      },
      processManyTasks: {
        arb2: 'Arbitrary 2'
      },
      arb: 'Arbitrary'
    }
  };

  // Create a real task
  const taskName = 'Task 1a';
  const taskDef = TaskDef.defineTask(taskName, () => {
  });
  taskDef.defineSubTasks(['SubTask 1a', 'SubTask 1b']);
  const origTask = createTask(taskDef);

  // Convert original task into a task-like
  const origTaskLike = JSON.parse(JSON.stringify(origTask));

  // Set the named task-like on the processOneTasks object
  const processOneTasks = msg.myTasks.processOneTasks;
  processOneTasks[taskName] = origTaskLike;

  // Get should return the task just registered
  const taskLike = getTask(processOneTasks, taskName);

  t.ok(taskLike, `Task-like ${taskLike.name} must be defined`);
  t.equal(taskLike, origTaskLike, `${taskLike.name} ${stringify(taskLike)} must be ${stringify(origTaskLike)}`);

  t.end();
});

//======================================================================================================================
// getTasks
//======================================================================================================================

test('getTasks with tasks and one task-like returns it', t => {
  const o = {myTasks: {Task1: {name: 'Task1', executable: true, subTasks: []}}};
  const tasks = getTasks(o.myTasks, 'tasks');
  t.ok(tasks, 'tasks must be defined');
  t.equal(tasks.length, 1, 'tasks.length must match');
  t.equal(o.myTasks.Task1, tasks[0], 'Task1 must match');
  t.end();
});

test('getTasks with tasks and multiple task-likes returns them', t => {
  const o = {
    myTasks: {
      Task1: {name: 'Task1', executable: true, subTasks: []},
      Task2: {name: 'Task2', executable: false, subTasks: []},
      Task3: {name: 'Task3', executable: true, subTasks: []}
    }
  };
  const tasks = getTasks(o.myTasks, 'tasks');
  t.ok(tasks, 'tasks must be defined');
  t.equal(tasks.length, 3, 'tasks.length must be 3');

  t.equal(o.myTasks.Task1, tasks.find(t => t.name === 'Task1'), 'Task1 must match');
  t.equal(o.myTasks.Task2, tasks.find(t => t.name === 'Task2'), 'Task2 must match');
  t.equal(o.myTasks.Task3, tasks.find(t => t.name === 'Task3'), 'Task3 must match');
  t.end();
});

test('getTasks with non-task-likes returns none', t => {
  const o = {
    myTasks: {
      Task1: {name: 'Task0', executable: true, subTasks: []}, // wrong name
      Task2: {name: 'Task2', executable: undefined, subTasks: []}, // executable is not true or false
      Task3: {name: 'Task3', executable: true, subTasks: {}}, // subTasks is not an array
      Task4: {name: '', executable: true, subTasks: []}, // name is blank
      Task5: {executable: true, subTasks: []}, // no name name
      Task6: {name: 'Task6', subTasks: []}, // no executable
      Task7: {name: 'Task7', executable: false}, // no subTasks
    }
  };
  const tasks = getTasks(o, 'tasks');
  t.ok(tasks, 'tasks must be defined');
  t.equal(tasks.length, 0, 'tasks.length must be 0');

  t.end();
});

test('getTasks with real tasks returns them', t => {
  const msg = {
    id: '123',
    message: 'Yo',
    myTasks: {
      processOneTasks: {
        arb1: 'Arbitrary 1'
      },
      processManyTasks: {
        arb2: 'Arbitrary 2'
      },
      arb: 'Arbitrary'
    }
  };

  // Create a real task
  const taskName = 'Task 1a';
  const taskDef = TaskDef.defineTask(taskName, () => {
  });
  const task0 = createTask(taskDef);

  // Set the named task on the processOneTasks object
  const processOneTasks = msg.myTasks.processOneTasks;
  setTask(processOneTasks, taskName, task0);

  // Get should return the task just registered
  const task = getTask(processOneTasks, taskName);

  t.ok(task, `${task.name} must be defined`);
  t.equal(task, processOneTasks[taskName], `${task.name} ${stringify(task)} must be ${stringify(processOneTasks[taskName])}`);

  t.end();
});

//======================================================================================================================
// setTask
//======================================================================================================================
test('setTask', t => {
  function check(tasksByName, taskName, task) {
    setTask(tasksByName, taskName, task);
    const actual = getTask(tasksByName, taskName);
    t.deepEqual(actual, task, `setTask (${stringify(actual)}) must be (${stringify(task)})`);
  }

  const o = {};
  // Clear the named task property
  check(o, 'TaskA', undefined);
  check(o, 'TaskB', null);

  // Set the named task property to just about any arbitrary non-task value
  check(o, 'TaskC', []);
  check(o, 'TaskD', 123);
  check(o, 'TaskE', 'Any');
  check(o, 'TaskF', {});

  // Set the named sta a valid task-like object
  check(o, 'TaskX', {name: 'TaskX', executable: true, subTasks: []});
  check(o, 'TaskY', {name: 'TaskYYY', executable: false, subTasks: []});
  check(o, 'TaskZ', {name: 'TaskZ', executable: false});

  t.end();
});

//======================================================================================================================
// getSubTask
//======================================================================================================================

test('getSubTask with no task and no sub-tasks returns undefined', t => {
  const t0 = getSubTask(undefined, 'task1', 'subTask1');
  t.notOk(t0, 'subTask1 must not be defined');

  const t1 = getSubTask(null, 'task1', 'subTask1');
  t.notOk(t1, 'subTask1 must not be defined');

  const t2 = getSubTask({}, 'task1', 'subTask1');
  t.notOk(t2, 'subTask1 must not be defined');

  const obj = {myTasks: {}};
  const t3 = getSubTask(obj.myTasks, 'task1', 'subTask1');
  t.notOk(t3, 'subTask1 must not be defined');
  t.end();
});

test('getSubTask with task, but no sub-tasks returns undefined', t => {
  const tasks = {task1: {}};
  const t1 = getSubTask(tasks, 'task1', 'subTask1');
  t.notOk(t1, 'subTask1 must not be defined');

  const obj = {myTasks: {task1: {}}};
  const t2 = getSubTask(obj.myTasks, 'task1', 'subTask1');
  t.notOk(t2, 'subTask1 must not be defined');
  t.end();
});

test('getSubTask with a "task" and simplistic "sub-task" returns it', t => {
  const o = {
    myTasks: {
      task1: {name: 'task1', subTasks: [{name: 'subTask1', subTasks: []}]}
    }
  };
  const subTask = getSubTask(o.myTasks, 'task1', 'subTask1');
  t.ok(subTask, 'task1 must be defined');

  const expected = o.myTasks.task1.subTasks[0];
  t.equal(subTask, expected, `task1 ${stringify(subTask)} must be ${stringify(expected)}`);
  t.end();
});

test('getSubTask with multiple "tasks" and "sub-tasks" returns each', t => {
  const o = {
    myTasks: {
      'Task A': {name: 'Task A', subTasks: [{name: 'Sub-task A1'}]},
      'Task B': {name: 'Task B', subTasks: [{name: 'Sub-task B1'}, {name: 'Sub-task B2'}]},
      'Task C': {name: 'Task C', subTasks: [{name: 'Sub-task C1'}, {name: 'Sub-task C2'}, {name: 'Sub-task C3'}]}
    }
  };
  t.equal(getSubTask(o.myTasks, 'Task A', 'Sub-task A1'), o.myTasks['Task A'].subTasks[0], 'Sub-task A1 must match');

  t.equal(getSubTask(o.myTasks, 'Task B', 'Sub-task B1'), o.myTasks['Task B'].subTasks[0], 'Sub-task B1 must match');
  t.equal(getSubTask(o.myTasks, 'Task B', 'Sub-task B2'), o.myTasks['Task B'].subTasks[1], 'Sub-task B2 must match');

  t.equal(getSubTask(o.myTasks, 'Task C', 'Sub-task C1'), o.myTasks['Task C'].subTasks[0], 'Sub-task C1 must match');
  t.equal(getSubTask(o.myTasks, 'Task C', 'Sub-task C2'), o.myTasks['Task C'].subTasks[1], 'Sub-task C2 must match');
  t.equal(getSubTask(o.myTasks, 'Task C', 'Sub-task C3'), o.myTasks['Task C'].subTasks[2], 'Sub-task C3 must match');

  t.equal(getSubTask(o.myTasks, 'Task A', 'Sub-task B1'), undefined, 'Task A Sub-task B1 must be undefined');
  t.equal(getSubTask(o.myTasks, 'Task B', 'Sub-task C1'), undefined, 'Task B Sub-task C1 must be undefined');
  t.equal(getSubTask(o.myTasks, 'Task C', 'Sub-task A1'), undefined, 'Task C Sub-task A1 must be undefined');

  t.equal(getSubTask(o.myTasks, 'Task D', 'Sub-task A1'), undefined, 'Task D Sub-task A1 must be undefined');

  t.end();
});

test('getSubTask with real sub-Tasks and sub-sub-Tasks returns them', t => {
  function check(tasksByName, taskName, subTaskName, expected) {
    const subTask = getSubTask(tasksByName, taskName, subTaskName);
    t.deepEqual(subTask, expected, `getSubTask(${taskName}, ${stringify(subTaskName)}) must be ${stringify(expected ? expected.name : expected)}`);
  }

  const msg = {
    id: '123',
    message: 'Yo',
    myTasks: {
      processOneTasks: {
        arb1: 'Arbitrary 1'
      },
      processManyTasks: {
        arb2: 'Arbitrary 2'
      },
      arb: 'Arbitrary'
    }
  };

  // Create a real task
  const taskName = 'Task 1';
  const taskDef = TaskDef.defineTask(taskName, () => {
  });
  const subTaskDefs = taskDef.defineSubTasks(['SubTask 1', 'SubTask 2']);
  subTaskDefs[0].defineSubTasks(['SubTask 1.1', 'SubTask 1.2']);

  const subSubTaskDefs = subTaskDefs[1].defineSubTasks(['SubTask 2.1', 'SubTask 2.2']);
  subSubTaskDefs[1].defineSubTasks(['SubTask 2.2.1', 'SubTask 2.2.2']);

  const origTask = createTask(taskDef);

  // Set the named task on the processOneTasks object
  const processOneTasks = msg.myTasks.processOneTasks;

  processOneTasks[taskName] = origTask;

  // Get should return the sub-task registered
  check(processOneTasks, taskName, 'SubTask 1', origTask.getSubTask('SubTask 1'));
  check(processOneTasks, taskName, 'SubTask 2', origTask.getSubTask('SubTask 2'));

  check(processOneTasks, taskName, ['SubTask 1'], origTask.getSubTask('SubTask 1'));
  check(processOneTasks, taskName, ['SubTask 2'], origTask.getSubTask('SubTask 2'));

  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 1.1'], origTask.getSubTask('SubTask 1').getSubTask('SubTask 1.1'));
  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 1.2'], origTask.getSubTask('SubTask 1').getSubTask('SubTask 1.2'));

  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 2.1'], origTask.getSubTask('SubTask 2').getSubTask('SubTask 2.1'));
  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 2.2'], origTask.getSubTask('SubTask 2').getSubTask('SubTask 2.2'));

  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 2.2', 'SubTask 2.2.1'], origTask.getSubTask('SubTask 2').getSubTask('SubTask 2.2').getSubTask('SubTask 2.2.1'));
  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 2.2', 'SubTask 2.2.2'], origTask.getSubTask('SubTask 2').getSubTask('SubTask 2.2').getSubTask('SubTask 2.2.2'));

  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 2.1'], undefined);
  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 2.2'], undefined);
  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 2.2', 'SubTask 2.2.1'], undefined);
  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 2.2', 'SubTask 2.2.2'], undefined);
  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 1.1'], undefined);
  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 1.2'], undefined);

  check(processOneTasks, 'Task 99', [], undefined);
  check(processOneTasks, 'Task 99', ['SubTask 99'], undefined);
  check(processOneTasks, taskName, ['SubTask 99'], undefined);
  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 99'], undefined);
  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 2.1', 'SubTask 99'], undefined);
  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 2.2', 'SubTask 2.2.2', 'SubTask 99'], undefined);
  t.end();
});

test('getSubTask with sub-task-likes and sub-sub-task-likes returns them', t => {
  function check(tasksByName, taskName, subTaskName, expected) {
    const subTask = getSubTask(tasksByName, taskName, subTaskName);
    t.deepEqual(subTask, expected, `getSubTask(${taskName}, ${stringify(subTaskName)}) must be ${stringify(expected ? expected.name : expected)}`);
  }

  const msg = {
    id: '123',
    message: 'Yo',
    myTasks: {
      processOneTasks: {
        arb1: 'Arbitrary 1'
      },
      processManyTasks: {
        arb2: 'Arbitrary 2'
      },
      arb: 'Arbitrary'
    }
  };

  // Create a real task
  const taskName = 'Task 1';
  const taskDef = TaskDef.defineTask(taskName, () => {
  });
  const subTaskDefs = taskDef.defineSubTasks(['SubTask 1', 'SubTask 2']);
  subTaskDefs[0].defineSubTasks(['SubTask 1.1', 'SubTask 1.2']);

  const subSubTaskDefs = subTaskDefs[1].defineSubTasks(['SubTask 2.1', 'SubTask 2.2']);
  subSubTaskDefs[1].defineSubTasks(['SubTask 2.2.1', 'SubTask 2.2.2']);

  const origTask = createTask(taskDef);

  // Convert original task into a task-like
  const origTaskLike = JSON.parse(JSON.stringify(origTask));

  // Set the named task on the processOneTasks object
  const processOneTasks = msg.myTasks.processOneTasks;

  processOneTasks[taskName] = origTaskLike;

  // Get should return the sub-task registered
  check(processOneTasks, taskName, 'SubTask 1', origTaskLike.subTasks[0]);
  check(processOneTasks, taskName, 'SubTask 2', origTaskLike.subTasks[1]);

  check(processOneTasks, taskName, ['SubTask 1'], origTaskLike.subTasks[0]);
  check(processOneTasks, taskName, ['SubTask 2'], origTaskLike.subTasks[1]);

  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 1.1'], origTaskLike.subTasks[0].subTasks[0]);
  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 1.2'], origTaskLike.subTasks[0].subTasks[1]);

  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 2.1'], origTaskLike.subTasks[1].subTasks[0]);
  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 2.2'], origTaskLike.subTasks[1].subTasks[1]);

  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 2.2', 'SubTask 2.2.1'], origTaskLike.subTasks[1].subTasks[1].subTasks[0]);
  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 2.2', 'SubTask 2.2.2'], origTaskLike.subTasks[1].subTasks[1].subTasks[1]);

  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 2.1'], undefined);
  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 2.2'], undefined);
  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 2.2', 'SubTask 2.2.1'], undefined);
  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 2.2', 'SubTask 2.2.2'], undefined);
  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 1.1'], undefined);
  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 1.2'], undefined);

  check(processOneTasks, 'Task 99', [], undefined);
  check(processOneTasks, 'Task 99', ['SubTask 99'], undefined);
  check(processOneTasks, taskName, ['SubTask 99'], undefined);
  check(processOneTasks, taskName, ['SubTask 1', 'SubTask 99'], undefined);
  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 2.1', 'SubTask 99'], undefined);
  check(processOneTasks, taskName, ['SubTask 2', 'SubTask 2.2', 'SubTask 2.2.2', 'SubTask 99'], undefined);
  t.end();
});


//======================================================================================================================
// getTasksAndSubTasks
//======================================================================================================================

test('getTasksAndSubTasks with tasks or task-likes returns them', t => {
  function check(tasksByName, desc, expectedLength, expectedTaskNames) {
    const tasksAndSubTasks = getTasksAndSubTasks(tasksByName);

    const tasksAndSubTasksNames = tasksAndSubTasks.map(t => t.name); //.sort();
    const expectedNames = expectedTaskNames; //.sort();

    t.equal(tasksAndSubTasks.length, expectedLength, `getTasksAndSubTasks(${desc}) length must be ${expectedLength}`);
    t.deepEqual(tasksAndSubTasksNames, expectedNames, `getTasksAndSubTasks(${desc}) names (${stringify(tasksAndSubTasksNames)}) must be ${stringify(expectedNames)}`)
  }

  // Set the named task on the tasks-by-name object
  const tasksByName = {arb1: 'Arbitrary 1'};
  check(tasksByName, 'with none', 0, []);

  // Create a real task
  const taskName = 'Task 1';
  const taskDef = TaskDef.defineTask(taskName, () => {
  });

  const subTaskDefs = taskDef.defineSubTasks(['SubTask 1', 'SubTask 2']);
  subTaskDefs[0].defineSubTasks(['SubTask 1.1', 'SubTask 1.2']);

  const subSubTaskDefs = subTaskDefs[1].defineSubTasks(['SubTask 2.1', 'SubTask 2.2']);
  subSubTaskDefs[1].defineSubTasks(['SubTask 2.2.1', 'SubTask 2.2.2']);

  const origTask = createTask(taskDef);

  // Check with Task hierarchy
  tasksByName[taskName] = origTask;

  const expectedTaskNames = ['Task 1', 'SubTask 1', 'SubTask 1.1', 'SubTask 1.2', 'SubTask 2', 'SubTask 2.1', 'SubTask 2.2', 'SubTask 2.2.1', 'SubTask 2.2.2'];

  check(tasksByName, 'with Tasks', 9, expectedTaskNames);

  // Convert original task into a task-like
  const origTaskLike = JSON.parse(JSON.stringify(origTask));

  t.ok(!(origTaskLike instanceof Task && Task.isTaskLike(origTaskLike)), 'origTaskLike must be task-like, but not a Task');

  tasksByName[taskName] = origTaskLike;

  check(tasksByName, 'with task-likes', 9, expectedTaskNames);

  t.end();
});

//======================================================================================================================
// getTasksAndSubTasks
//======================================================================================================================
function checkReviveTasks(t, tasksByName, activeTaskDefs, opts, desc, origTaskLikes, expectedNames) {
  const onlyRecreateExisting = opts && opts.onlyRecreateExisting;
  const expectedNamesSorted = expectedNames.sort();

  //console.log(`################### origTaskLikes = ${stringify(origTaskLikes)}`);
  const orig = Task.getTasksAndSubTasks(origTaskLikes);
  //console.log(`################### orig = ${stringify(orig)}`);
  const origNamesSorted = orig.map(t => t.name).sort();
  const before = getTasksAndSubTasks(tasksByName);
  const beforeNamesSorted = before.map(t => t.name).sort();
  before.forEach(task => {
    //t.notOk(task instanceof Task, ` reviveTasks BEFORE ${task.name} must NOT be instance of Task`);
    t.ok(Task.isTaskLike(task) && !(task instanceof Task), `reviveTasks(${desc}) BEFORE ${task.name} must be task-like, but NOT a Task`);
  });
  t.equal(beforeNamesSorted.length, origNamesSorted.length, `reviveTasks(${desc}) BEFORE all tasks length must be ${origNamesSorted.length}`);
  t.deepEqual(beforeNamesSorted, origNamesSorted, `reviveTasks(${desc}) BEFORE all task names (${stringify(beforeNamesSorted)}) must be ${stringify(origNamesSorted)}`);

  // Replace old with new
  const newTasksAndAbandonedTasks = taskUtils.reviveTasks(tasksByName, activeTaskDefs, taskFactory1, opts);

  const afterTaskNamesSorted = getTasks(tasksByName).map(t => t.name).sort();

  const after = getTasksAndSubTasks(tasksByName);
  const afterNames = after.map(t => t.name); //.sort();
  const afterNamesSorted = afterNames.sort();

  after.forEach(task => {
    t.ok(task instanceof Task, `reviveTasks(${desc}) AFTER ${task.name} must be instance of Task`);
  });

  const origTaskLikeNames = origTaskLikes.map(t => t.name);
  const activeTaskDefNames = activeTaskDefs.map(d => d.name);

  const expectedTaskNames = onlyRecreateExisting ? Arrays.distinct(origTaskLikeNames).sort() :
    Arrays.distinct(origTaskLikeNames.concat(activeTaskDefNames)).sort();
  //((a,b) => a.length < b.length ? -1 ? a.length === b.length ? a < b : 0 : 1);

  //t.equal(tasks.length, expectedTaskNames.length, `top-level tasks length must be ${activeTaskDefs.length}`);


  t.equal(afterNames.length, expectedNames.length, `reviveTasks(${desc}) AFTER all tasks length must be ${expectedNames.length}`);
  t.deepEqual(afterNamesSorted, expectedNamesSorted, `reviveTasks(${desc}) AFTER all names (${stringify(afterNamesSorted)}) must be ${stringify(expectedNamesSorted)}`);
  t.deepEqual(afterTaskNamesSorted, expectedTaskNames, `reviveTasks(${desc}) AFTER task names (${stringify(afterTaskNamesSorted)}) must be ${stringify(expectedTaskNames)}`);

  //console.log(`****************** new tasks (${desc}) = ${stringify(newTasksAndAbandonedTasks[0])}`);
  //console.log(`****************** abandoned (${desc}) = ${stringify(newTasksAndAbandonedTasks[1])}`);

  return newTasksAndAbandonedTasks;
}

test('reviveTasks - Scenario 0: No old tasks and no new tasks', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};
  const opts = undefined;
  checkReviveTasks(t, tasksByName, [], opts, 'with none', [], []);

  t.end();
});

test('reviveTasks - Scenario 1: No old tasks', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create task definitions
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });
  const taskName4 = 'Task 4';
  const taskDef4 = TaskDef.defineTask(taskName4, () => {
  });

  // Add sub-task definitions to task 1
  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  // Add sub-task definitions to task 4
  const task4SubTaskDefs = taskDef4.defineSubTasks(['SubTask 4A', 'SubTask 4B']);
  task4SubTaskDefs[0].defineSubTasks(['SubTask 4A-1', 'SubTask 4A-2']);

  const subTask4BSubTaskDefs = task4SubTaskDefs[1].defineSubTasks(['SubTask 4B-1', 'SubTask 4B-2']);
  subTask4BSubTaskDefs[1].defineSubTasks(['SubTask 4B-2a', 'SubTask 4B-2b']);

  const expectedNames = [
    'Task 1',
    'SubTask 1A', 'SubTask 1A-1', 'SubTask 1A-2',
    'SubTask 1B', 'SubTask 1B-1', 'SubTask 1B-2', 'SubTask 1B-2a', 'SubTask 1B-2b',
    'Task 2',
    'Task 3',
    'Task 4',
    'SubTask 4A', 'SubTask 4A-1', 'SubTask 4A-2',
    'SubTask 4B', 'SubTask 4B-1', 'SubTask 4B-2', 'SubTask 4B-2a', 'SubTask 4B-2b'
  ];

  // Scenario 1: No old tasks
  const desc = '0 old, 4 new';
  const opts = undefined;
  const newTasksAndAbandoned = checkReviveTasks(t, tasksByName, [taskDef1, taskDef2, taskDef3, taskDef4], opts, desc, [], expectedNames);

  const newTasks = newTasksAndAbandoned[0];
  const abandoned = newTasksAndAbandoned[1];

  t.equal(newTasks.length, 4, '4 new tasks');
  t.equal(abandoned.length, 0, '0 abandoned');

  // Check states
  const t1 = newTasks.find(t => t.name === 'Task 1');
  t.ok(t1, `${t1.name} must be one of the new tasks`);
  t1.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t2 = newTasks.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t2.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t3 = newTasks.find(t => t.name === 'Task 3');
  t.ok(t3, `${t3.name} must be one of the new tasks`);
  t3.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t4 = newTasks.find(t => t.name === 'Task 4');
  t.ok(t4, `${t4.name} must be one of the new tasks`);
  t4.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  t.end();
});

test('reviveTasks - Scenario 2.0: All old tasks are still active tasks (AND opts is undefined)', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create task definitions
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });
  const taskName4 = 'Task 4';
  const taskDef4 = TaskDef.defineTask(taskName4, () => {
  });

  // Add sub-task definitions to task 1
  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  // Add sub-task definitions to task 4
  const task4SubTaskDefs = taskDef4.defineSubTasks(['SubTask 4A', 'SubTask 4B']);
  task4SubTaskDefs[0].defineSubTasks(['SubTask 4A-1', 'SubTask 4A-2']);

  const subTask4BSubTaskDefs = task4SubTaskDefs[1].defineSubTasks(['SubTask 4B-1', 'SubTask 4B-2']);
  subTask4BSubTaskDefs[1].defineSubTasks(['SubTask 4B-2a', 'SubTask 4B-2b']);

  // Create tasks from definitions
  const task1 = createTask(taskDef1);
  const task2 = createTask(taskDef2);
  const task3 = createTask(taskDef3);
  const task4 = createTask(taskDef4);

  // Convert original tasks into task-likes
  const taskLike1 = JSON.parse(JSON.stringify(task1));
  const taskLike2 = JSON.parse(JSON.stringify(task2));
  const taskLike3 = JSON.parse(JSON.stringify(task3));
  const taskLike4 = JSON.parse(JSON.stringify(task4));

  // Check with Task hierarchy
  const expectedNames = [
    'Task 1',
    'SubTask 1A', 'SubTask 1A-1', 'SubTask 1A-2',
    'SubTask 1B', 'SubTask 1B-1', 'SubTask 1B-2', 'SubTask 1B-2a', 'SubTask 1B-2b',
    'Task 2',
    'Task 3',
    'Task 4',
    'SubTask 4A', 'SubTask 4A-1', 'SubTask 4A-2',
    'SubTask 4B', 'SubTask 4B-1', 'SubTask 4B-2', 'SubTask 4B-2a', 'SubTask 4B-2b'
  ];

  // Scenario 2: All old tasks are still active tasks
  tasksByName[taskName1] = taskLike1;
  tasksByName[taskName2] = taskLike2;
  tasksByName[taskName3] = taskLike3;
  tasksByName[taskName4] = taskLike4;

  const desc = '4 old, 4 new';
  const opts = undefined;
  const newTasksAndAbandoned = checkReviveTasks(t, tasksByName, [taskDef1, taskDef2, taskDef3, taskDef4], opts, desc, [taskLike1, taskLike2, taskLike3, taskLike4], expectedNames);

  const newTasks = newTasksAndAbandoned[0];
  const abandoned = newTasksAndAbandoned[1];

  t.equal(newTasks.length, 4, '4 new tasks');
  t.equal(abandoned.length, 0, '0 abandoned');

  // Check states
  const t1 = newTasks.find(t => t.name === 'Task 1');
  t.ok(t1, `${t1.name} must be one of the new tasks`);
  t1.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t2 = newTasks.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t2.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t3 = newTasks.find(t => t.name === 'Task 3');
  t.ok(t3, `${t3.name} must be one of the new tasks`);
  t3.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t4 = newTasks.find(t => t.name === 'Task 4');
  t.ok(t4, `${t4.name} must be one of the new tasks`);
  t4.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  t.end();
});

test('reviveTasks - Scenario 2.1: All old tasks are still active tasks (AND explicit opts.onlyRecreateExisting is false)', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create task definitions
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });
  const taskName4 = 'Task 4';
  const taskDef4 = TaskDef.defineTask(taskName4, () => {
  });

  // Add sub-task definitions to task 1
  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  // Add sub-task definitions to task 4
  const task4SubTaskDefs = taskDef4.defineSubTasks(['SubTask 4A', 'SubTask 4B']);
  task4SubTaskDefs[0].defineSubTasks(['SubTask 4A-1', 'SubTask 4A-2']);

  const subTask4BSubTaskDefs = task4SubTaskDefs[1].defineSubTasks(['SubTask 4B-1', 'SubTask 4B-2']);
  subTask4BSubTaskDefs[1].defineSubTasks(['SubTask 4B-2a', 'SubTask 4B-2b']);

  // Create tasks from definitions
  const task1 = createTask(taskDef1);
  const task2 = createTask(taskDef2);
  const task3 = createTask(taskDef3);
  const task4 = createTask(taskDef4);

  // Convert original tasks into task-likes
  const taskLike1 = JSON.parse(JSON.stringify(task1));
  const taskLike2 = JSON.parse(JSON.stringify(task2));
  const taskLike3 = JSON.parse(JSON.stringify(task3));
  const taskLike4 = JSON.parse(JSON.stringify(task4));

  // Check with Task hierarchy
  const expectedNames = [
    'Task 1',
    'SubTask 1A', 'SubTask 1A-1', 'SubTask 1A-2',
    'SubTask 1B', 'SubTask 1B-1', 'SubTask 1B-2', 'SubTask 1B-2a', 'SubTask 1B-2b',
    'Task 2',
    'Task 3',
    'Task 4',
    'SubTask 4A', 'SubTask 4A-1', 'SubTask 4A-2',
    'SubTask 4B', 'SubTask 4B-1', 'SubTask 4B-2', 'SubTask 4B-2a', 'SubTask 4B-2b'
  ];

  // Scenario 2: All old tasks are still active tasks
  tasksByName[taskName1] = taskLike1;
  tasksByName[taskName2] = taskLike2;
  tasksByName[taskName3] = taskLike3;
  tasksByName[taskName4] = taskLike4;

  const desc = '4 old, 4 new';
  const opts = {onlyRecreateExisting: false};
  const newTasksAndAbandoned = checkReviveTasks(t, tasksByName, [taskDef1, taskDef2, taskDef3, taskDef4], opts, desc, [taskLike1, taskLike2, taskLike3, taskLike4], expectedNames);

  const newTasks = newTasksAndAbandoned[0];
  const abandoned = newTasksAndAbandoned[1];

  t.equal(newTasks.length, 4, '4 new tasks');
  t.equal(abandoned.length, 0, '0 abandoned');

  // Check states
  const t1 = newTasks.find(t => t.name === 'Task 1');
  t.ok(t1, `${t1.name} must be one of the new tasks`);
  t1.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t2 = newTasks.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t2.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t3 = newTasks.find(t => t.name === 'Task 3');
  t.ok(t3, `${t3.name} must be one of the new tasks`);
  t3.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t4 = newTasks.find(t => t.name === 'Task 4');
  t.ok(t4, `${t4.name} must be one of the new tasks`);
  t4.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  t.end();
});

test('reviveTasks - Scenario 2.2: All old tasks are still active tasks (AND explicit opts.onlyRecreateExisting is true)', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create task definitions
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });
  const taskName4 = 'Task 4';
  const taskDef4 = TaskDef.defineTask(taskName4, () => {
  });

  // Add sub-task definitions to task 1
  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  // Add sub-task definitions to task 4
  const task4SubTaskDefs = taskDef4.defineSubTasks(['SubTask 4A', 'SubTask 4B']);
  task4SubTaskDefs[0].defineSubTasks(['SubTask 4A-1', 'SubTask 4A-2']);

  const subTask4BSubTaskDefs = task4SubTaskDefs[1].defineSubTasks(['SubTask 4B-1', 'SubTask 4B-2']);
  subTask4BSubTaskDefs[1].defineSubTasks(['SubTask 4B-2a', 'SubTask 4B-2b']);

  // Create tasks from definitions
  const task1 = createTask(taskDef1);
  const task2 = createTask(taskDef2);
  const task3 = createTask(taskDef3);
  const task4 = createTask(taskDef4);

  // Convert original tasks into task-likes
  const taskLike1 = JSON.parse(JSON.stringify(task1));
  const taskLike2 = JSON.parse(JSON.stringify(task2));
  const taskLike3 = JSON.parse(JSON.stringify(task3));
  const taskLike4 = JSON.parse(JSON.stringify(task4));

  // Check with Task hierarchy
  const expectedNames = [
    'Task 1',
    'SubTask 1A', 'SubTask 1A-1', 'SubTask 1A-2',
    'SubTask 1B', 'SubTask 1B-1', 'SubTask 1B-2', 'SubTask 1B-2a', 'SubTask 1B-2b',
    'Task 2',
    'Task 3',
    'Task 4',
    'SubTask 4A', 'SubTask 4A-1', 'SubTask 4A-2',
    'SubTask 4B', 'SubTask 4B-1', 'SubTask 4B-2', 'SubTask 4B-2a', 'SubTask 4B-2b'
  ];

  // Scenario 2: All old tasks are still active tasks
  tasksByName[taskName1] = taskLike1;
  tasksByName[taskName2] = taskLike2;
  tasksByName[taskName3] = taskLike3;
  tasksByName[taskName4] = taskLike4;

  const desc = '4 old, 4 new';
  const opts = {onlyRecreateExisting: true}; // NB: opts.onlyRecreateExisting must be true in this case
  const newTasksAndAbandoned = checkReviveTasks(t, tasksByName, [taskDef1, taskDef2, taskDef3, taskDef4], opts, desc, [taskLike1, taskLike2, taskLike3, taskLike4], expectedNames);

  const newTasks = newTasksAndAbandoned[0];
  const abandoned = newTasksAndAbandoned[1];

  t.equal(newTasks.length, 4, '4 new tasks');
  t.equal(abandoned.length, 0, '0 abandoned');

  // Check states
  const t1 = newTasks.find(t => t.name === 'Task 1');
  t.ok(t1, `${t1.name} must be one of the new tasks`);
  t1.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t2 = newTasks.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t2.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t3 = newTasks.find(t => t.name === 'Task 3');
  t.ok(t3, `${t3.name} must be one of the new tasks`);
  t3.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t4 = newTasks.find(t => t.name === 'Task 4');
  t.ok(t4, `${t4.name} must be one of the new tasks`);
  t4.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  t.end();
});

test('reviveTasks - Scenario 2.4: Some (2 of 4) active tasks do NOT exist as old tasks, BUT opts.onlyRecreateExisting is false, so all 4 of 4 will be created/revived', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create task definitions
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });
  const taskName4 = 'Task 4';
  const taskDef4 = TaskDef.defineTask(taskName4, () => {
  });

  // Add sub-task definitions to task 1
  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  // Add sub-task definitions to task 4
  const task4SubTaskDefs = taskDef4.defineSubTasks(['SubTask 4A', 'SubTask 4B']);
  task4SubTaskDefs[0].defineSubTasks(['SubTask 4A-1', 'SubTask 4A-2']);

  const subTask4BSubTaskDefs = task4SubTaskDefs[1].defineSubTasks(['SubTask 4B-1', 'SubTask 4B-2']);
  subTask4BSubTaskDefs[1].defineSubTasks(['SubTask 4B-2a', 'SubTask 4B-2b']);

  // Create tasks from definitions
  const task1 = createTask(taskDef1);
  const task3 = createTask(taskDef3);

  // Convert original tasks into task-likes
  const taskLike1 = JSON.parse(JSON.stringify(task1));
  const taskLike3 = JSON.parse(JSON.stringify(task3));

  // Check with Task hierarchy
  const expectedNames = [
    'Task 1',
    'SubTask 1A', 'SubTask 1A-1', 'SubTask 1A-2',
    'SubTask 1B', 'SubTask 1B-1', 'SubTask 1B-2', 'SubTask 1B-2a', 'SubTask 1B-2b',
    'Task 2',
    'Task 3',
    'Task 4',
    'SubTask 4A', 'SubTask 4A-1', 'SubTask 4A-2',
    'SubTask 4B', 'SubTask 4B-1', 'SubTask 4B-2', 'SubTask 4B-2a', 'SubTask 4B-2b'
  ];

  // Scenario 2: All old tasks are still active tasks
  tasksByName[taskName1] = taskLike1;
  tasksByName[taskName3] = taskLike3;

  const desc = '2 old, 4 new';
  const opts = {onlyRecreateExisting: false}; // NB: opts.onlyRecreateExisting must be false in this case
  const newTasksAndAbandoned = checkReviveTasks(t, tasksByName, [taskDef1, taskDef2, taskDef3, taskDef4], opts, desc,
    [taskLike1, taskLike3], expectedNames);

  const newTasks = newTasksAndAbandoned[0];
  const abandoned = newTasksAndAbandoned[1];

  t.equal(newTasks.length, 4, '4 new tasks');
  t.equal(abandoned.length, 0, '0 abandoned');

  // Check states
  const t1 = newTasks.find(t => t.name === 'Task 1');
  t.ok(t1, `${t1.name} must be one of the new tasks`);
  t1.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t2 = newTasks.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t2.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t3 = newTasks.find(t => t.name === 'Task 3');
  t.ok(t3, `${t3.name} must be one of the new tasks`);
  t3.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t4 = newTasks.find(t => t.name === 'Task 4');
  t.ok(t4, `${t4.name} must be one of the new tasks`);
  t4.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  t.end();
});

test('reviveTasks - Scenario 2.5: Some (2 of 4) active tasks do NOT exist as old tasks AND opts.onlyRecreateExisting is true, so ONLY 2 of 4 will be revived', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create task definitions
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });
  const taskName4 = 'Task 4';
  const taskDef4 = TaskDef.defineTask(taskName4, () => {
  });

  // Add sub-task definitions to task 1
  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  // Add sub-task definitions to task 4
  const task4SubTaskDefs = taskDef4.defineSubTasks(['SubTask 4A', 'SubTask 4B']);
  task4SubTaskDefs[0].defineSubTasks(['SubTask 4A-1', 'SubTask 4A-2']);

  const subTask4BSubTaskDefs = task4SubTaskDefs[1].defineSubTasks(['SubTask 4B-1', 'SubTask 4B-2']);
  subTask4BSubTaskDefs[1].defineSubTasks(['SubTask 4B-2a', 'SubTask 4B-2b']);

  // Create tasks from ONLY only 2 of the 4 definitions
  const task2 = createTask(taskDef2);
  const task4 = createTask(taskDef4);

  // Convert original tasks into task-likes
  const taskLike2 = JSON.parse(JSON.stringify(task2));
  const taskLike4 = JSON.parse(JSON.stringify(task4));

  // Check with Task hierarchy
  const expectedNames = [
    'Task 2',
    'Task 4',
    'SubTask 4A', 'SubTask 4A-1', 'SubTask 4A-2',
    'SubTask 4B', 'SubTask 4B-1', 'SubTask 4B-2', 'SubTask 4B-2a', 'SubTask 4B-2b'
  ];

  // Scenario 2.5: All old tasks are still active tasks
  tasksByName[taskName2] = taskLike2;
  tasksByName[taskName4] = taskLike4;

  const desc = '2 old, 4 new';
  const opts = {onlyRecreateExisting: true}; // NB: opts.onlyRecreateExisting must be true in this case
  const newTasksAndAbandoned = checkReviveTasks(t, tasksByName, [taskDef1, taskDef2, taskDef3, taskDef4], opts, desc,
    [taskLike2, taskLike4], expectedNames);

  const newTasks = newTasksAndAbandoned[0];
  const abandoned = newTasksAndAbandoned[1];

  t.equal(newTasks.length, 2, '2 new tasks');
  t.equal(abandoned.length, 0, '0 abandoned');

  // Check states
  const t1 = newTasks.find(t => t.name === 'Task 1');
  t.notOk(t1, `Task 1 must NOT be one of the new tasks`);

  const t2 = newTasks.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t2.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  const t3 = newTasks.find(t => t.name === 'Task 3');
  t.notOk(t3, `Task 3 must NOT be one of the new tasks`);

  const t4 = newTasks.find(t => t.name === 'Task 4');
  t.ok(t4, `${t4.name} must be one of the new tasks`);
  t4.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });

  t.end();
});


test('reviveTasks - Scenario 2.6: All (4 of 4) active tasks do NOT exist as old tasks AND opts.onlyRecreateExisting is true, so 0 of 4 will be revived', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create task definitions
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });
  const taskName4 = 'Task 4';
  const taskDef4 = TaskDef.defineTask(taskName4, () => {
  });

  // Add sub-task definitions to task 1
  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  // Add sub-task definitions to task 4
  const task4SubTaskDefs = taskDef4.defineSubTasks(['SubTask 4A', 'SubTask 4B']);
  task4SubTaskDefs[0].defineSubTasks(['SubTask 4A-1', 'SubTask 4A-2']);

  const subTask4BSubTaskDefs = task4SubTaskDefs[1].defineSubTasks(['SubTask 4B-1', 'SubTask 4B-2']);
  subTask4BSubTaskDefs[1].defineSubTasks(['SubTask 4B-2a', 'SubTask 4B-2b']);

  // Check with Task hierarchy
  const expectedNames = [];

  const desc = '0 old, 4 new';
  const opts = {onlyRecreateExisting: true}; // NB: opts.onlyRecreateExisting must be true in this case
  const newTasksAndAbandoned = checkReviveTasks(t, tasksByName, [taskDef1, taskDef2, taskDef3, taskDef4], opts, desc,
    [], expectedNames);

  const newTasks = newTasksAndAbandoned[0];
  const abandoned = newTasksAndAbandoned[1];

  t.equal(newTasks.length, 0, '0 new tasks');
  t.equal(abandoned.length, 0, '0 abandoned');

  // Check states
  const t1 = newTasks.find(t => t.name === 'Task 1');
  t.notOk(t1, `Task 1 must NOT be one of the new tasks`);

  const t2 = newTasks.find(t => t.name === 'Task 2');
  t.notOk(t2, `Task 2 must NOT be one of the new tasks`);

  const t3 = newTasks.find(t => t.name === 'Task 3');
  t.notOk(t3, `Task 3 must NOT be one of the new tasks`);

  const t4 = newTasks.find(t => t.name === 'Task 4');
  t.notOk(t4, `Task 4 must NOT be one of the new tasks`);

  t.end();
});

test('reviveTasks - Scenario 3: Active task definitions excludes task 1 & 4, so task 1 & 4 must become abandoned', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create task definitions
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });
  const taskName4 = 'Task 4';
  const taskDef4 = TaskDef.defineTask(taskName4, () => {
  });

  // Add sub-task definitions to task 1
  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  // Add sub-task definitions to task 4
  const task4SubTaskDefs = taskDef4.defineSubTasks(['SubTask 4A', 'SubTask 4B']);
  task4SubTaskDefs[0].defineSubTasks(['SubTask 4A-1', 'SubTask 4A-2']);

  const subTask4BSubTaskDefs = task4SubTaskDefs[1].defineSubTasks(['SubTask 4B-1', 'SubTask 4B-2']);
  subTask4BSubTaskDefs[1].defineSubTasks(['SubTask 4B-2a', 'SubTask 4B-2b']);

  // Create tasks from definitions
  const task1 = createTask(taskDef1);
  const task2 = createTask(taskDef2);
  const task3 = createTask(taskDef3);
  const task4 = createTask(taskDef4);

  // Convert original tasks into task-likes
  const taskLike1 = JSON.parse(JSON.stringify(task1));
  const taskLike2 = JSON.parse(JSON.stringify(task2));
  const taskLike3 = JSON.parse(JSON.stringify(task3));
  const taskLike4 = JSON.parse(JSON.stringify(task4));

  // Check with Task hierarchy
  const origTaskLikes = [taskLike1, taskLike2, taskLike3, taskLike4];

  const expectedNames = [
    'Task 1',
    'SubTask 1A', 'SubTask 1A-1', 'SubTask 1A-2',
    'SubTask 1B', 'SubTask 1B-1', 'SubTask 1B-2', 'SubTask 1B-2a', 'SubTask 1B-2b',
    'Task 2',
    'Task 3',
    'Task 4',
    'SubTask 4A', 'SubTask 4A-1', 'SubTask 4A-2',
    'SubTask 4B', 'SubTask 4B-1', 'SubTask 4B-2', 'SubTask 4B-2a', 'SubTask 4B-2b'
  ];

  // Scenario 3: Change active task definitions to exclude task 1, which should cause it to become abandoned
  tasksByName[taskName1] = taskLike1;
  tasksByName[taskName2] = taskLike2;
  tasksByName[taskName3] = taskLike3;
  tasksByName[taskName4] = taskLike4;

  const desc = '4 old, 2 new';
  const opts = undefined;
  const newTasksAndAbandoned = checkReviveTasks(t, tasksByName, [taskDef2, taskDef3], opts, desc, origTaskLikes, expectedNames);

  const newTasks = newTasksAndAbandoned[0];
  const abandoned = newTasksAndAbandoned[1];
  t.equal(newTasks.length, 2, `2 new tasks`);
  t.equal(abandoned.length, 2, `2 abandoned`);

  // Check states
  const t1 = abandoned.find(t => t.name === 'Task 1');
  t.ok(t1, `${t1.name} must be one of the abandoned`);
  t1.forEach(st => {
    t.ok(st.isAbandoned(), `${st.name} must be abandoned`);
  });
  const t2 = newTasks.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t2.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });
  const t3 = newTasks.find(t => t.name === 'Task 3');
  t.ok(t3, `${t3.name} must be one of the new tasks`);
  t3.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
  });
  const t4 = abandoned.find(t => t.name === 'Task 4');
  t.ok(t4, `${t4.name} must be one of the abandoned`);
  t4.forEach(st => {
    t.ok(st.isAbandoned(), `${st.name} must be abandoned`);
  });

  t.end();
});

test('reviveTasks - Scenario 4: Old finalised tasks must not be reset to unstarted, but old failed or timed out tasks must be reset', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create task definitions
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });
  const taskName4 = 'Task 4';
  const taskDef4 = TaskDef.defineTask(taskName4, () => {
  });

  // Add sub-task definitions to task 1
  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  // Add sub-task definitions to task 2
  const task2SubTaskDefs = taskDef2.defineSubTasks(['SubTask 2A', 'SubTask 2B']);
  task2SubTaskDefs[0].defineSubTasks(['SubTask 2A-1', 'SubTask 2A-2']);

  const subTask2BSubTaskDefs = task2SubTaskDefs[1].defineSubTasks(['SubTask 2B-1', 'SubTask 2B-2']);
  subTask2BSubTaskDefs[1].defineSubTasks(['SubTask 2B-2a', 'SubTask 2B-2b']);

  // Add sub-task definitions to task 3
  const task3SubTaskDefs = taskDef3.defineSubTasks(['SubTask 3A', 'SubTask 3B']);
  task3SubTaskDefs[0].defineSubTasks(['SubTask 3A-1', 'SubTask 3A-2']);

  const subTask3BSubTaskDefs = task3SubTaskDefs[1].defineSubTasks(['SubTask 3B-1', 'SubTask 3B-2']);
  subTask3BSubTaskDefs[1].defineSubTasks(['SubTask 3B-2a', 'SubTask 3B-2b']);

  // Add sub-task definitions to task 4
  const task4SubTaskDefs = taskDef4.defineSubTasks(['SubTask 4A', 'SubTask 4B']);
  task4SubTaskDefs[0].defineSubTasks(['SubTask 4A-1', 'SubTask 4A-2']);

  const subTask4BSubTaskDefs = task4SubTaskDefs[1].defineSubTasks(['SubTask 4B-1', 'SubTask 4B-2']);
  subTask4BSubTaskDefs[1].defineSubTasks(['SubTask 4B-2a', 'SubTask 4B-2b']);

  // Create tasks from definitions
  const task1 = createTask(taskDef1);

  // Fail task 1 recursively
  task1.fail(new Error('Planned failure'), true);
  task1.incrementAttempts(true);

  task1.forEach(task => {
    t.ok(task.failed, `BEFORE ${task.name} must be failed`);
  });

  const task2 = createTask(taskDef2);

  // Finalise task 2 with rejection
  task2.incrementAttempts(true);
  task2.incrementAttempts(true);
  task2.reject('Rejected task 2A', undefined, true);

  const task3 = createTask(taskDef3);

  // Finalise task 3 with success
  task3.incrementAttempts(true);
  task3.incrementAttempts(true);
  task3.incrementAttempts(true);
  task3.succeed(undefined, {overrideTimedOut: true}, true);

  const task4 = createTask(taskDef4);

  // Timeout task 4 recursively
  task4.timeout(new Error('Planned timeout'), {
    overrideCompleted: true,
    overrideUnstarted: true,
    reverseAttempt: true
  }, true);
  task4.incrementAttempts(true);
  task4.incrementAttempts(true);
  task4.incrementAttempts(true);
  task4.incrementAttempts(true);

  task4.forEach(task => {
    t.ok(task.timedOut, `BEFORE ${task.name} must be timed out`);
  });

  // Convert original tasks into task-likes
  const taskLike1 = JSON.parse(JSON.stringify(task1));
  const taskLike2 = JSON.parse(JSON.stringify(task2));
  const taskLike3 = JSON.parse(JSON.stringify(task3));
  const taskLike4 = JSON.parse(JSON.stringify(task4));

  // Check with Task hierarchy
  const origTaskLikes = [taskLike1, taskLike2, taskLike3, taskLike4];

  const expectedNames = [
    'Task 1',
    'SubTask 1A', 'SubTask 1A-1', 'SubTask 1A-2',
    'SubTask 1B', 'SubTask 1B-1', 'SubTask 1B-2', 'SubTask 1B-2a', 'SubTask 1B-2b',
    'Task 2',
    'SubTask 2A', 'SubTask 2A-1', 'SubTask 2A-2',
    'SubTask 2B', 'SubTask 2B-1', 'SubTask 2B-2', 'SubTask 2B-2a', 'SubTask 2B-2b',
    'Task 3',
    'SubTask 3A', 'SubTask 3A-1', 'SubTask 3A-2',
    'SubTask 3B', 'SubTask 3B-1', 'SubTask 3B-2', 'SubTask 3B-2a', 'SubTask 3B-2b',
    'Task 4',
    'SubTask 4A', 'SubTask 4A-1', 'SubTask 4A-2',
    'SubTask 4B', 'SubTask 4B-1', 'SubTask 4B-2', 'SubTask 4B-2a', 'SubTask 4B-2b'
  ];

  // Scenario 4: Old finalised tasks must not be reset to unstarted, but old failed tasks must be reset
  tasksByName[taskName1] = taskLike1;
  tasksByName[taskName2] = taskLike2;
  tasksByName[taskName3] = taskLike3;
  tasksByName[taskName4] = taskLike4;

  const desc = '4 old (1 failed, 2 finalised, 1 timed out)';
  const opts = undefined;
  const newTasksAndAbandoned = checkReviveTasks(t, tasksByName, [taskDef1, taskDef2, taskDef3, taskDef4], opts, desc, origTaskLikes, expectedNames);

  const newTasks = newTasksAndAbandoned[0];
  const abandoned = newTasksAndAbandoned[1];
  t.equal(newTasks.length, 4, `4 new tasks`);
  t.equal(abandoned.length, 0, `0 abandoned`);

  // Check states
  const t1 = newTasks.find(t => t.name === 'Task 1');
  t.ok(t1, `${t1.name} must be one of the new tasks`);
  t1.forEach(st => {
    t.ok(st.unstarted, `AFTER ${st.name} must be unstarted`);
    t.equal(st.attempts, 1, `AFTER ${st.name} attempts must be 1`);
  });

  const t2 = newTasks.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t2.forEach(st => {
    t.ok(st.rejected, `AFTER ${st.name} must be rejected`);
    t.ok(st.isRejected(), `AFTER ${st.name} must be Rejected`);
    t.equal(st.attempts, 2, `AFTER ${st.name} attempts must be 2`);
  });

  const t3 = newTasks.find(t => t.name === 'Task 3');
  t.ok(t3, `${t3.name} must be one of the new tasks`);
  t3.forEach(st => {
    t.ok(st.completed, `${st.name} must be completed`);
    t.equal(st.attempts, 3, `AFTER ${st.name} attempts must be 3`);
  });

  const t4 = newTasks.find(t => t.name === 'Task 4');
  t.ok(t4, `${t4.name} must be one of the new tasks`);
  t4.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
    t.equal(st.attempts, 4, `AFTER ${st.name} attempts must be 4`);
  });

  t.end();
});

test('reviveTasks - Scenario 5: Old finalised tasks with incomplete sub-tasks must be fully or partially reset to unstarted', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create task definitions
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });
  const taskName4 = 'Task 4';
  const taskDef4 = TaskDef.defineTask(taskName4, () => {
  });

  // Add sub-task definitions to task 1
  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  // Add sub-task definitions to task 2
  const task2SubTaskDefs = taskDef2.defineSubTasks(['SubTask 2A', 'SubTask 2B']);
  task2SubTaskDefs[0].defineSubTasks(['SubTask 2A-1', 'SubTask 2A-2']);

  const subTask2BSubTaskDefs = task2SubTaskDefs[1].defineSubTasks(['SubTask 2B-1', 'SubTask 2B-2']);
  subTask2BSubTaskDefs[1].defineSubTasks(['SubTask 2B-2a', 'SubTask 2B-2b']);

  // Add sub-task definitions to task 3
  const task3SubTaskDefs = taskDef3.defineSubTasks(['SubTask 3A', 'SubTask 3B']);
  task3SubTaskDefs[0].defineSubTasks(['SubTask 3A-1', 'SubTask 3A-2']);

  const subTask3BSubTaskDefs = task3SubTaskDefs[1].defineSubTasks(['SubTask 3B-1', 'SubTask 3B-2']);
  subTask3BSubTaskDefs[1].defineSubTasks(['SubTask 3B-2a', 'SubTask 3B-2b']);

  // Add sub-task definitions to task 4
  const task4SubTaskDefs = taskDef4.defineSubTasks(['SubTask 4A', 'SubTask 4B']);
  task4SubTaskDefs[0].defineSubTasks(['SubTask 4A-1', 'SubTask 4A-2']);

  const subTask4BSubTaskDefs = task4SubTaskDefs[1].defineSubTasks(['SubTask 4B-1', 'SubTask 4B-2']);
  subTask4BSubTaskDefs[1].defineSubTasks(['SubTask 4B-2a', 'SubTask 4B-2b']);

  // Create tasks from definitions
  const task1 = createTask(taskDef1);

  // Fail task 1 recursively and then mark itself as completed
  task1.fail(new Error('Planned fail 1'), true);
  task1.incrementAttempts(true);
  task1.complete(undefined, {overrideTimedOut: true}, false);

  task1.subTasks.forEach(task => {
    t.ok(task.failed, `BEFORE ${task.name} must be failed`);
  });
  t.ok(task1.completed, `BEFORE ${task1.name} must be completed`);

  const task2 = createTask(taskDef2);

  // Fail task 2 recursively and then mark itself as rejected
  task2.fail(new Error('Planned fail 2'), true);
  task2.subTasks.forEach(subTask => t.ok(subTask.failed, `BEFORE ${subTask.name} must be failed`));
  task2.incrementAttempts(true);
  task2.incrementAttempts(true);

  // task2.reject('Rejected task 2', undefined, true);
  task2.subTasks.forEach(subTask => {
    subTask.reject(`Rejected task 2 sub-task ${subTask.name}`, undefined, true);
    t.ok(subTask.rejected, `BEFORE ${subTask.name} must be rejected`);
  });
  t.ok(task2.failed, `BEFORE ${task2.name} must still be rejected`);

  const task3 = createTask(taskDef3);
  // task3.start(new Date(), true);

  // Timeout task 3 recursively and then mark itself as rejected
  task3.timeout(new Error('Planned timeout 3'), {
    overrideCompleted: true,
    overrideUnstarted: true,
    reverseAttempt: true
  }, true);
  task3.subTasks.forEach(subTask => t.ok(subTask.timedOut, `BEFORE ${subTask.name} must be timed out`));

  task3.incrementAttempts(true);
  task3.incrementAttempts(true);
  task3.incrementAttempts(true);
  // task3.reject('Rejected task 3', undefined, true);
  task3.subTasks.forEach(subTask => subTask.reject(`Rejected task 3 sub-task ${subTask.name}`, undefined, true));

  t.ok(task3.timedOut, `BEFORE ${task3.name} must still be timed out`);
  task3.subTasks.forEach(subTask => t.ok(subTask.rejected, `BEFORE ${subTask.name} must be rejected`));

  const task4 = createTask(taskDef4);

  // Timeout task 4 recursively and then mark itself as completed
  task4.timeout(new Error('Planned timeout 4'), {
    overrideCompleted: true,
    overrideUnstarted: true,
    reverseAttempt: true
  }, true);
  task4.incrementAttempts(true);
  task4.incrementAttempts(true);
  task4.incrementAttempts(true);
  task4.incrementAttempts(true);
  task4.complete(undefined, {overrideTimedOut: true}, false);

  task4.subTasks.forEach(task => {
    t.ok(task.timedOut, `BEFORE ${task.name} must be timed out`);
  });
  t.ok(task4.completed, `BEFORE ${task4.name} must be completed`);


  // Convert original tasks into task-likes
  const taskLike1 = JSON.parse(JSON.stringify(task1));
  const taskLike2 = JSON.parse(JSON.stringify(task2));
  const taskLike3 = JSON.parse(JSON.stringify(task3));
  const taskLike4 = JSON.parse(JSON.stringify(task4));

  // Check with Task hierarchy
  const origTaskLikes = [taskLike1, taskLike2, taskLike3, taskLike4];

  const expectedNames = [
    'Task 1',
    'SubTask 1A', 'SubTask 1A-1', 'SubTask 1A-2',
    'SubTask 1B', 'SubTask 1B-1', 'SubTask 1B-2', 'SubTask 1B-2a', 'SubTask 1B-2b',
    'Task 2',
    'SubTask 2A', 'SubTask 2A-1', 'SubTask 2A-2',
    'SubTask 2B', 'SubTask 2B-1', 'SubTask 2B-2', 'SubTask 2B-2a', 'SubTask 2B-2b',
    'Task 3',
    'SubTask 3A', 'SubTask 3A-1', 'SubTask 3A-2',
    'SubTask 3B', 'SubTask 3B-1', 'SubTask 3B-2', 'SubTask 3B-2a', 'SubTask 3B-2b',
    'Task 4',
    'SubTask 4A', 'SubTask 4A-1', 'SubTask 4A-2',
    'SubTask 4B', 'SubTask 4B-1', 'SubTask 4B-2', 'SubTask 4B-2a', 'SubTask 4B-2b'
  ];

  // Scenario 5: Old finalised tasks with incomplete sub-tasks must be fully or partially reset to unstarted
  tasksByName[taskName1] = taskLike1;
  tasksByName[taskName2] = taskLike2;
  tasksByName[taskName3] = taskLike3;
  tasksByName[taskName4] = taskLike4;

  const desc = '4 old (1 C+Fs, 1 R+Fs, 1 R+Ts, 1 C+Ts)';
  const opts = undefined;
  const newTasksAndAbandoned = checkReviveTasks(t, tasksByName, [taskDef1, taskDef2, taskDef3, taskDef4], opts, desc, origTaskLikes, expectedNames);

  const newTasks = newTasksAndAbandoned[0];
  const abandoned = newTasksAndAbandoned[1];
  t.equal(newTasks.length, 4, `4 new tasks`);
  t.equal(abandoned.length, 0, `0 abandoned`);

  // Check states
  const t1 = newTasks.find(t => t.name === 'Task 1');
  t.ok(t1, `${t1.name} must be one of the new tasks`);
  t.ok(t1.unstarted, `AFTER ${t1.name} must be unstarted now`);
  //t.ok(t1.completed, `AFTER ${t1.name} must still be completed`);
  t1.subTasks.forEach(st => {
    t.ok(st.unstarted, `AFTER ${st.name} must be unstarted`);
    t.equal(st.attempts, 1, `AFTER ${st.name} attempts must be 1`);
  });

  const t2 = newTasks.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t.ok(t2.unstarted, `AFTER ${t2.name} must be unstarted now`);
  t2.subTasks.forEach(st => {
    t.ok(st.rejected, `AFTER ${st.name} must still be rejected`);
    t.ok(st.isRejected(), `AFTER ${st.name} must still be Rejected`);
    t.equal(st.attempts, 2, `AFTER ${st.name} attempts must be 2`);
  });

  const t3 = newTasks.find(t => t.name === 'Task 3');
  t.ok(t3, `${t3.name} must be one of the new tasks`);
  t.ok(t3.unstarted, `AFTER ${t3.name} must be unstarted now`);
  t3.subTasks.forEach(st => {
    t.ok(st.rejected, `AFTER ${st.name} must still be rejected`);
    t.ok(st.isRejected(), `AFTER ${t3.name} must still be Rejected`);
    t.equal(st.attempts, 3, `AFTER ${st.name} attempts must be 3`);
  });

  const t4 = newTasks.find(t => t.name === 'Task 4');
  t.ok(t4, `${t4.name} must be one of the new tasks`);
  t.ok(t4.unstarted, `AFTER ${t4.name} must be unstarted now`);
  //t.ok(t4.completed, `AFTER ${t4.name} must still be completed`);
  t4.subTasks.forEach(st => {
    t.ok(st.unstarted, `${st.name} must be unstarted`);
    t.equal(st.attempts, 4, `AFTER ${st.name} attempts must be 4`);
  });

  t.end();
});

// =====================================================================================================================
// getDefaultTaskFactoryOpts
// =====================================================================================================================

test('getDefaultTaskFactoryOpts', t => {
  const loadedOpts = require('../default-factory-opts.json');
  const defaultOpts = getDefaultTaskFactoryOpts();
  t.ok(defaultOpts, `defaultOpts must be defined`);
  t.ok(typeof defaultOpts === "object", `defaultOpts must be an object`);
  t.notEqual(defaultOpts, loadedOpts, `defaultOpts must NOT be loadedOpts`);
  if (!ReturnMode.isValid(loadedOpts.returnMode)) {
    t.equal(defaultOpts.returnMode, loadedOpts.returnMode, `defaultOpts.returnMode must be ${loadedOpts.returnMode}`);
  } else {
    t.equal(defaultOpts.returnMode, ReturnMode.NORMAL, `defaultOpts.returnMode must be ${ReturnMode.NORMAL}`);
  }
  t.end();
});

// =====================================================================================================================
// isTaskFactoryConfigured
// =====================================================================================================================

test('isTaskFactoryConfigured', t => {
  const context = {};
  t.equal(isTaskFactoryConfigured(context), false, `context.taskFactory must not be configured yet`);
  context.taskFactory = new Error('Ha!');
  t.equal(isTaskFactoryConfigured(context), false, `context.taskFactory with a non-TaskFactory (${context.taskFactory}) must be considered to be not configured yet`);
  context.taskFactory = new TaskFactory();
  t.equal(isTaskFactoryConfigured(context), true, `context.taskFactory with a TaskFactory must be considered to be configured`);
  t.end();
});

// =====================================================================================================================
// constructTaskFactory
// =====================================================================================================================

test('constructTaskFactory', t => {
  function check(createTaskFactory, logger, describeItem, options, expectedReturnMode) {
    const settings = logger || describeItem ? {logger: logger, describeItem: describeItem} : undefined;
    const actual = constructTaskFactory(createTaskFactory, settings, options);
    const prefix = `constructTaskFactory(${stringify(createTaskFactory)}, ${stringify(settings)}, ${stringify(options)})`;
    t.ok(actual instanceof TaskFactory, `${prefix} must be an instance of TaskFactory`);
    if (createTaskFactory === createSimpleTaskFactory) {
      t.ok(actual instanceof SimpleTaskFactory, `${prefix} must be an instance of SimpleTaskFactory`);
    }
    const expectedLogger = logger ? logger : console;
    t.equal(actual.logger, expectedLogger, `${prefix}.logger must be ${stringify(expectedLogger)}`);
    t.equal(actual.returnMode, expectedReturnMode, `${prefix}.returnMode must be ${expectedReturnMode}`);
  }

  function checkThrows(createTaskFactory, logger, describeItem, options) {
    const settings = logger || describeItem ? {logger: logger, describeItem: describeItem} : undefined;
    const prefix = `constructTaskFactory(${stringify(createTaskFactory)}, ${stringify(settings)}, ${stringify(options)})`;
    t.throws(() => constructTaskFactory(createTaskFactory, settings, options), Error, `${prefix} must throw an error`);
  }

  for (let d = 0; d < describeItemFunctions.length; ++d) {
    const describeItem = describeItemFunctions[d];

    for (let i = 0; i < usableCreateTaskFactoryFunctions.length; ++i) {
      const createTaskFactory = usableCreateTaskFactoryFunctions[i];
      check(createTaskFactory, undefined, describeItem, undefined, ReturnMode.NORMAL);
      check(createTaskFactory, console, describeItem, undefined, ReturnMode.NORMAL);
      check(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, undefined, ReturnMode.NORMAL);

      check(createTaskFactory, undefined, describeItem, {returnMode: ReturnMode.NORMAL}, ReturnMode.NORMAL);
      check(createTaskFactory, console, describeItem, {returnMode: ReturnMode.NORMAL}, ReturnMode.NORMAL);
      check(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, {returnMode: ReturnMode.NORMAL}, ReturnMode.NORMAL);

      check(createTaskFactory, undefined, describeItem, {returnMode: ReturnMode.PROMISE}, ReturnMode.PROMISE);
      check(createTaskFactory, console, describeItem, {returnMode: ReturnMode.PROMISE}, ReturnMode.PROMISE);
      check(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, {returnMode: ReturnMode.PROMISE}, ReturnMode.PROMISE);

      check(createTaskFactory, undefined, describeItem, {returnMode: ReturnMode.SUCCESS_OR_FAILURE}, ReturnMode.SUCCESS_OR_FAILURE);
      check(createTaskFactory, console, describeItem, {returnMode: ReturnMode.SUCCESS_OR_FAILURE}, ReturnMode.SUCCESS_OR_FAILURE);
      check(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, {returnMode: ReturnMode.SUCCESS_OR_FAILURE}, ReturnMode.SUCCESS_OR_FAILURE);
    }

    for (let i = 0; i < unusableCreateTaskFactoryFunctions.length; ++i) {
      const createTaskFactory = unusableCreateTaskFactoryFunctions[i];
      checkThrows(createTaskFactory, undefined, describeItem, undefined);
      checkThrows(createTaskFactory, console, describeItem, undefined);
      checkThrows(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, undefined);

      checkThrows(createTaskFactory, undefined, describeItem, {returnMode: ReturnMode.NORMAL});
      checkThrows(createTaskFactory, console, describeItem, {returnMode: ReturnMode.NORMAL});
      checkThrows(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, {returnMode: ReturnMode.NORMAL});

      checkThrows(createTaskFactory, undefined, describeItem, {returnMode: ReturnMode.PROMISE});
      checkThrows(createTaskFactory, console, describeItem, {returnMode: ReturnMode.PROMISE});
      checkThrows(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, {returnMode: ReturnMode.PROMISE});

      checkThrows(createTaskFactory, undefined, describeItem, {returnMode: ReturnMode.SUCCESS_OR_FAILURE});
      checkThrows(createTaskFactory, console, describeItem, {returnMode: ReturnMode.SUCCESS_OR_FAILURE});
      checkThrows(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, {returnMode: ReturnMode.SUCCESS_OR_FAILURE});
    }
  }

  t.end();
});

// =====================================================================================================================
// configureTaskFactory
// =====================================================================================================================

test('configureTaskFactory', t => {
  function check(createTaskFactory, logger, describeItem, options, expectedReturnMode) {
    const context = {};
    const settings = createTaskFactory || logger || describeItem ?
      {createTaskFactory: createTaskFactory, logger: logger, describeItem: describeItem} : undefined;
    const actualContext = configureTaskFactory(context, settings, options);
    const prefix = `configureTaskFactory(context, ${stringify(settings)}, ${stringify(options)})`;
    t.equal(actualContext, context, `${prefix} must return the given context`);
    const actualTaskFactory = actualContext.taskFactory;
    //t.ok(actualTaskFactory, `${prefix}.taskFactory must be defined`);
    t.ok(actualTaskFactory instanceof TaskFactory, `${prefix}.taskFactory must be an instance of TaskFactory`);
    if (createTaskFactory === createSimpleTaskFactory) {
      t.ok(actualTaskFactory instanceof SimpleTaskFactory, `${prefix}.taskFactory must be an instance of SimpleTaskFactory`);
    }
    const expectedLogger = logger ? logger : console;
    t.equal(actualTaskFactory.logger, expectedLogger, `${prefix}.taskFactory.logger must be ${stringify(expectedLogger)}`);
    t.equal(actualTaskFactory.returnMode, expectedReturnMode, `${prefix}.taskFactory.returnMode must be ${expectedReturnMode}`);
  }

  function checkThrows(createTaskFactory, logger, describeItem, options) {
    const context = {};
    const settings = createTaskFactory || logger || describeItem ?
      {createTaskFactory: createTaskFactory, logger: logger, describeItem: describeItem} : undefined;
    const prefix = `configureTaskFactory(context, ${stringify(settings)}, ${stringify(options)})`;
    t.throws(() => configureTaskFactory(context, settings, options), Error, `${prefix} must throw an error`);
  }

  for (let d = 0; d < describeItemFunctions.length; ++d) {
    const describeItem = describeItemFunctions[d];

    for (let i = 0; i < usableCreateTaskFactoryFunctions.length; ++i) {
      const createTaskFactory = usableCreateTaskFactoryFunctions[i];
      check(createTaskFactory, undefined, describeItem, undefined, ReturnMode.NORMAL);
      check(createTaskFactory, console, describeItem, undefined, ReturnMode.NORMAL);
      check(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, undefined, ReturnMode.NORMAL);

      check(createTaskFactory, undefined, describeItem, {returnMode: ReturnMode.NORMAL}, ReturnMode.NORMAL);
      check(createTaskFactory, console, describeItem, {returnMode: ReturnMode.NORMAL}, ReturnMode.NORMAL);
      check(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, {returnMode: ReturnMode.NORMAL}, ReturnMode.NORMAL);

      check(createTaskFactory, undefined, describeItem, {returnMode: ReturnMode.PROMISE}, ReturnMode.PROMISE);
      check(createTaskFactory, console, describeItem, {returnMode: ReturnMode.PROMISE}, ReturnMode.PROMISE);
      check(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, {returnMode: ReturnMode.PROMISE}, ReturnMode.PROMISE);

      check(createTaskFactory, undefined, describeItem, {returnMode: ReturnMode.SUCCESS_OR_FAILURE}, ReturnMode.SUCCESS_OR_FAILURE);
      check(createTaskFactory, console, describeItem, {returnMode: ReturnMode.SUCCESS_OR_FAILURE}, ReturnMode.SUCCESS_OR_FAILURE);
      check(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, {returnMode: ReturnMode.SUCCESS_OR_FAILURE}, ReturnMode.SUCCESS_OR_FAILURE);
    }

    for (let i = 0; i < unusableCreateTaskFactoryFunctions.length; ++i) {
      const createTaskFactory = unusableCreateTaskFactoryFunctions[i];
      checkThrows(createTaskFactory, undefined, describeItem, undefined);
      checkThrows(createTaskFactory, console, describeItem, undefined);
      checkThrows(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, undefined);

      checkThrows(createTaskFactory, undefined, describeItem, {returnMode: ReturnMode.NORMAL});
      checkThrows(createTaskFactory, console, describeItem, {returnMode: ReturnMode.NORMAL});
      checkThrows(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, {returnMode: ReturnMode.NORMAL});

      checkThrows(createTaskFactory, undefined, describeItem, {returnMode: ReturnMode.PROMISE});
      checkThrows(createTaskFactory, console, describeItem, {returnMode: ReturnMode.PROMISE});
      checkThrows(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, {returnMode: ReturnMode.PROMISE});

      checkThrows(createTaskFactory, undefined, describeItem, {returnMode: ReturnMode.SUCCESS_OR_FAILURE});
      checkThrows(createTaskFactory, console, describeItem, {returnMode: ReturnMode.SUCCESS_OR_FAILURE});
      checkThrows(createTaskFactory, new console.Console(process.stdout, process.stderr), describeItem, {returnMode: ReturnMode.SUCCESS_OR_FAILURE});
    }
  }

  t.end();
});
