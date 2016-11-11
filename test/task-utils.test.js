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
const replaceTasksWithNewTasksUpdatedFromOld = taskUtils.replaceTasksWithNewTasksUpdatedFromOld;

const taskDefs = require('../task-defs');
const TaskDef = taskDefs.TaskDef;

const Tasks = require('../tasks');
const Task = Tasks.Task;

// const states = require('../task-states');
// // Common state codes
// const SUCCEEDED_CODE = states.SUCCEEDED_CODE;
// // TaskState singletons
// const UNSTARTED = states.UNSTARTED;
// const SUCCEEDED = states.SUCCEEDED;
// // TaskState classes
// //const TaskState = states.TaskState;
// //const Unstarted = states.Unstarted;
// const Success = states.Success;
// const Failure = states.Failure;
// //const Succeeded = states.Succeeded;
// const Failed = states.Failed;
// const toTaskState = states.toTaskState;
// //const isCompleted = states.isCompleted;

const Arrays = require('core-functions/arrays');

const strings = require('core-functions/strings');
const stringify = strings.stringify;

//======================================================================================================================
// getTask
//======================================================================================================================

test('getTask with no tasks returns undefined', t => {
  const t0 = getTask(undefined, 'task1');
  t.notOk(t0, 'task must not be defined');

  const t1 = getTask(null, 'task1');
  t.notOk(t1, 'task must not be defined');

  const tasks = {};
  const t2 = getTask(tasks, 'task1');
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

test('getTask with a real Task returns it', t => {
  const msg = {
    id: '123',
    message: 'Yo',
    myTasks: {
      ones: {
        arb1: 'Arbitrary 1'
      },
      alls: {
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
  const origTask = Task.createTask(taskDef);

  // Set the named task on the processOneTasks object
  const processOneTasks = msg.myTasks.ones;

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
      ones: {
        arb1: 'Arbitrary 1'
      },
      alls: {
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
  const origTask = Task.createTask(taskDef);

  // Convert original task into a task-like
  const origTaskLike = JSON.parse(JSON.stringify(origTask));

  // Set the named task-like on the processOneTasks object
  const processOneTasks = msg.myTasks.ones;
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
      ones: {
        arb1: 'Arbitrary 1'
      },
      alls: {
        arb2: 'Arbitrary 2'
      },
      arb: 'Arbitrary'
    }
  };

  // Create a real task
  const taskName = 'Task 1a';
  const taskDef = TaskDef.defineTask(taskName, () => {
  });
  const task0 = Task.createTask(taskDef);

  // Set the named task on the processOneTasks object
  const processOneTasks = msg.myTasks.ones;
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
      ones: {
        arb1: 'Arbitrary 1'
      },
      alls: {
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

  const origTask = Task.createTask(taskDef);

  // Set the named task on the processOneTasks object
  const processOneTasks = msg.myTasks.ones;

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
      ones: {
        arb1: 'Arbitrary 1'
      },
      alls: {
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

  const origTask = Task.createTask(taskDef);

  // Convert original task into a task-like
  const origTaskLike = JSON.parse(JSON.stringify(origTask));

  // Set the named task on the processOneTasks object
  const processOneTasks = msg.myTasks.ones;

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

  const origTask = Task.createTask(taskDef);

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

function checkReplaceTasks(t, tasksByName, activeTaskDefs, desc, origTaskDefs, origTasks, origTaskLikes, expectedNames) {
  const expectedNamesSorted = expectedNames.sort();

  //console.log(`################### origTaskLikes = ${stringify(origTaskLikes)}`);
  const orig = Task.getTasksAndSubTasks(origTaskLikes);
  //console.log(`################### orig = ${stringify(orig)}`);
  const origNamesSorted = orig.map(t => t.name).sort();
  const before = getTasksAndSubTasks(tasksByName);
  const beforeNamesSorted = before.map(t => t.name).sort();
  before.forEach(task => {
    //t.notOk(task instanceof Task, ` replaceTasks BEFORE ${task.name} must NOT be instance of Task`);
    t.ok(Task.isTaskLike(task) && !(task instanceof Task), `replaceTasks(${desc}) BEFORE ${task.name} must be task-like, but NOT a Task`);
  });
  t.equal(beforeNamesSorted.length, origNamesSorted.length, `replaceTasks(${desc}) BEFORE all tasks length must be ${origNamesSorted.length}`);
  t.deepEqual(beforeNamesSorted, origNamesSorted, `replaceTasks(${desc}) BEFORE all task names (${stringify(beforeNamesSorted)}) must be ${stringify(origNamesSorted)}`)

  // Replace old with new
  const newTasksAndAbandonedTasks = taskUtils.replaceTasksWithNewTasksUpdatedFromOld(tasksByName, activeTaskDefs);

  const afterTaskNamesSorted = getTasks(tasksByName).map(t => t.name).sort();

  const after = getTasksAndSubTasks(tasksByName);
  const afterNames = after.map(t => t.name); //.sort();
  const afterNamesSorted = afterNames.sort();

  after.forEach(task => {
    t.ok(task instanceof Task, `replaceTasks(${desc}) AFTER ${task.name} must be instance of Task`);
  });

  const origTaskLikeNames = origTaskLikes.map(t => t.name);
  const activeTaskDefNames = activeTaskDefs.map(d => d.name);

  const expectedTaskNames = Arrays.distinct(origTaskLikeNames.concat(activeTaskDefNames)).sort(); //((a,b) => a.length < b.length ? -1 ? a.length === b.length ? a < b : 0 : 1);

  //t.equal(tasks.length, expectedTaskNames.length, `top-level tasks length must be ${activeTaskDefs.length}`);


  t.equal(afterNames.length, expectedNames.length, `replaceTasks(${desc}) AFTER all tasks length must be ${expectedNames.length}`);
  t.deepEqual(afterNamesSorted, expectedNamesSorted, `replaceTasks(${desc}) AFTER all names (${stringify(afterNamesSorted)}) must be ${stringify(expectedNamesSorted)}`)
  t.deepEqual(afterTaskNamesSorted, expectedTaskNames, `replaceTasks(${desc}) AFTER task names (${stringify(afterTaskNamesSorted)}) must be ${stringify(expectedTaskNames)}`)

  //console.log(`****************** new tasks (${desc}) = ${stringify(newTasksAndAbandonedTasks[0])}`);
  //console.log(`****************** abandoned (${desc}) = ${stringify(newTasksAndAbandonedTasks[1])}`);

  return newTasksAndAbandonedTasks;
}

test('replaceTasksWithNewTasksUpdatedFromOld - Scenario 0: No old tasks and no new tasks', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};
  checkReplaceTasks(t, tasksByName, [], 'with none', [], [], [], []);

  t.end();
});

test('replaceTasksWithNewTasksUpdatedFromOld - Scenario 1: No old tasks', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create real tasks
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });

  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  const origTaskDefs = [taskDef1, taskDef2, taskDef3];

  const task1 = Task.createTask(taskDef1);
  const task2 = Task.createTask(taskDef2);
  const task3 = Task.createTask(taskDef3);

  // Convert original tasks into task-likes
  const taskLike1 = JSON.parse(JSON.stringify(task1));
  const taskLike2 = JSON.parse(JSON.stringify(task2));
  const taskLike3 = JSON.parse(JSON.stringify(task3));

  const expectedNames = [
    'Task 1',
    'SubTask 1A', 'SubTask 1A-1', 'SubTask 1A-2',
    'SubTask 1B', 'SubTask 1B-1', 'SubTask 1B-2', 'SubTask 1B-2a', 'SubTask 1B-2b',
    'Task 2',
    'Task 3'];

  // Scenario 1: No old tasks
  const desc = '0 old, 3 new';
  const newTasksAndAbandoned1 = checkReplaceTasks(t, tasksByName, [taskDef1, taskDef2, taskDef3], desc,
    origTaskDefs, [], [], expectedNames);

  const newTasks1 = newTasksAndAbandoned1[0];
  const abandoned1 = newTasksAndAbandoned1[1];

  t.equal(newTasks1.length, 3, '3 new tasks');
  t.equal(abandoned1.length, 0, '0 abandoned');

  // Check states
  const t1 = newTasks1.find(t => t.name === 'Task 1');
  t.ok(t1, `${t1.name} must be one of the new tasks`);
  t1.forEach(task => {
    t.ok(task.unstarted, `${task.name} must be unstarted`);
  });
  const t2 = newTasks1.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t2.forEach(task => {
    t.ok(task.unstarted, `${task.name} must be unstarted`);
  });
  const t3 = newTasks1.find(t => t.name === 'Task 3');
  t.ok(t3, `${t3.name} must be one of the new tasks`);
  t3.forEach(task => {
    t.ok(task.unstarted, `${task.name} must be unstarted`);
  });


  t.end();
});

test('replaceTasksWithNewTasksUpdatedFromOld - Scenario 2: All old tasks are still active tasks', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create real tasks
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });

  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  const origTaskDefs = [taskDef1, taskDef2, taskDef3];

  const task1 = Task.createTask(taskDef1);
  const task2 = Task.createTask(taskDef2);
  const task3 = Task.createTask(taskDef3);

  const origTasks = [task1, task2, task3];

  // Convert original tasks into task-likes
  const taskLike1 = JSON.parse(JSON.stringify(task1));
  const taskLike2 = JSON.parse(JSON.stringify(task2));
  const taskLike3 = JSON.parse(JSON.stringify(task3));

  // Check with Task hierarchy
  const expectedNames = [
    'Task 1',
    'SubTask 1A', 'SubTask 1A-1', 'SubTask 1A-2',
    'SubTask 1B', 'SubTask 1B-1', 'SubTask 1B-2', 'SubTask 1B-2a', 'SubTask 1B-2b',
    'Task 2',
    'Task 3'];

  // Scenario 2: All old tasks are still active tasks
  tasksByName[taskName1] = taskLike1;
  tasksByName[taskName2] = taskLike2;
  tasksByName[taskName3] = taskLike3;

  const desc = '3 old, 3 new';
  const newTasksAndAbandoned2 = checkReplaceTasks(t, tasksByName, [taskDef1, taskDef2, taskDef3], desc,
    origTaskDefs, origTasks, [taskLike1, taskLike2, taskLike3], expectedNames);

  const newTasks2 = newTasksAndAbandoned2[0];
  const abandoned2 = newTasksAndAbandoned2[1];

  t.equal(newTasks2.length, 3, '3 new tasks');
  t.equal(abandoned2.length, 0, '0 abandoned');

  // Check states
  const t1 = newTasks2.find(t => t.name === 'Task 1');
  t.ok(t1, `${t1.name} must be one of the new tasks`);
  t1.forEach(task => {
    t.ok(task.unstarted, `${task.name} must be unstarted`);
  });
  const t2 = newTasks2.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t2.forEach(task => {
    t.ok(task.unstarted, `${task.name} must be unstarted`);
  });
  const t3 = newTasks2.find(t => t.name === 'Task 3');
  t.ok(t3, `${t3.name} must be one of the new tasks`);
  t3.forEach(task => {
    t.ok(task.unstarted, `${task.name} must be unstarted`);
  });


  t.end();
});

test('replaceTasksWithNewTasksUpdatedFromOld - Scenario 3: Active task definitions excludes task 1, so task 1 must become abandoned', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create real tasks
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });

  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  const origTaskDefs = [taskDef1, taskDef2, taskDef3];

  const task1 = Task.createTask(taskDef1);
  const task2 = Task.createTask(taskDef2);
  const task3 = Task.createTask(taskDef3);

  const origTasks = [task1, task2, task3];

  // Convert original tasks into task-likes
  const taskLike1 = JSON.parse(JSON.stringify(task1));
  const taskLike2 = JSON.parse(JSON.stringify(task2));
  const taskLike3 = JSON.parse(JSON.stringify(task3));

  // Check with Task hierarchy
  const origTaskLikes = [taskLike1, taskLike2, taskLike3];

  const expectedNames = [
    'Task 1',
    'SubTask 1A', 'SubTask 1A-1', 'SubTask 1A-2',
    'SubTask 1B', 'SubTask 1B-1', 'SubTask 1B-2', 'SubTask 1B-2a', 'SubTask 1B-2b',
    'Task 2',
    'Task 3'];

  // Scenario 3: Change active task definitions to exclude task 1, which should cause it to become abandoned
  tasksByName[taskName1] = taskLike1;
  tasksByName[taskName2] = taskLike2;
  tasksByName[taskName3] = taskLike3;

  const desc = '3 old, 2 new';
  const newTasksAndAbandoned3 = checkReplaceTasks(t, tasksByName, [taskDef2, taskDef3], desc, origTaskDefs, origTasks, origTaskLikes, expectedNames);

  const newTasks3 = newTasksAndAbandoned3[0];
  const abandoned3 = newTasksAndAbandoned3[1];
  t.equal(newTasks3.length, 2, `2 new tasks`);
  t.equal(abandoned3.length, 1, `1 abandoned`);

  // Check states
  const t1 = abandoned3.find(t => t.name === 'Task 1');
  t.ok(t1, `${t1.name} must be one of the abandoned`);
  t1.forEach(task => {
    t.ok(task.isAbandoned(), `${task.name} must be abandoned`);
  });
  const t2 = newTasks3.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t2.forEach(task => {
    t.ok(task.unstarted, `${task.name} must be unstarted`);
  });
  const t3 = newTasks3.find(t => t.name === 'Task 3');
  t.ok(t3, `${t3.name} must be one of the new tasks`);
  t3.forEach(task => {
    t.ok(task.unstarted, `${task.name} must be unstarted`);
  });

  t.end();
});

test('replaceTasksWithNewTasksUpdatedFromOld - Scenario 4: Old finalised tasks must not be reset to unstarted, but old failed tasks must be reset', t => {
  const tasksByName = {arb1: 'Arbitrary 1'};

  // Create real tasks
  const taskName1 = 'Task 1';
  const taskDef1 = TaskDef.defineTask(taskName1, () => {
  });
  const taskName2 = 'Task 2';
  const taskDef2 = TaskDef.defineTask(taskName2, () => {
  });
  const taskName3 = 'Task 3';
  const taskDef3 = TaskDef.defineTask(taskName3, () => {
  });

  const task1SubTaskDefs = taskDef1.defineSubTasks(['SubTask 1A', 'SubTask 1B']);
  task1SubTaskDefs[0].defineSubTasks(['SubTask 1A-1', 'SubTask 1A-2']);

  const subTask1BSubTaskDefs = task1SubTaskDefs[1].defineSubTasks(['SubTask 1B-1', 'SubTask 1B-2']);
  subTask1BSubTaskDefs[1].defineSubTasks(['SubTask 1B-2a', 'SubTask 1B-2b']);

  const origTaskDefs = [taskDef1, taskDef2, taskDef3];

  const task1 = Task.createTask(taskDef1);

  // Fail task 1 recursively
  task1.forEach(task => {
    task.fail(new Error('Planned failure'))
    task.incrementAttempts();
  });
  task1.forEach(task => {
    t.ok(task.isFailure() && task.failed, `BEFORE ${task.name} must be Failure and failed`);
  });

  const task2 = Task.createTask(taskDef2);

  // Finalise task 2 with rejection
  task2.incrementAttempts();
  task2.incrementAttempts();
  task2.reject('Rejected task 2A', undefined, true);

  const task3 = Task.createTask(taskDef3);

  // Finalise task 3 with success
  task3.incrementAttempts();
  task3.incrementAttempts();
  task3.incrementAttempts();
  task3.succeed();


  const origTasks = [task1, task2, task3];

  // Convert original tasks into task-likes
  const taskLike1 = JSON.parse(JSON.stringify(task1));
  const taskLike2 = JSON.parse(JSON.stringify(task2));
  const taskLike3 = JSON.parse(JSON.stringify(task3));

  // Check with Task hierarchy
  const origTaskLikes = [taskLike1, taskLike2, taskLike3];

  const expectedNames = [
    'Task 1',
    'SubTask 1A', 'SubTask 1A-1', 'SubTask 1A-2',
    'SubTask 1B', 'SubTask 1B-1', 'SubTask 1B-2', 'SubTask 1B-2a', 'SubTask 1B-2b',
    'Task 2',
    'Task 3'];

  // Scenario 4: Old finalised tasks must not be reset to unstarted, but old failed tasks must be reset
  tasksByName[taskName1] = taskLike1;
  tasksByName[taskName2] = taskLike2;
  tasksByName[taskName3] = taskLike3;

  const desc = '3 old (1 failed, 2 finalised)';
  const newTasksAndAbandoned4 = checkReplaceTasks(t, tasksByName, [taskDef1, taskDef2, taskDef3], desc, origTaskDefs,
    origTasks, origTaskLikes, expectedNames);

  const newTasks4 = newTasksAndAbandoned4[0];
  const abandoned4 = newTasksAndAbandoned4[1];
  t.equal(newTasks4.length, 3, `3 new tasks`);
  t.equal(abandoned4.length, 0, `0 abandoned`);

  // Check states
  const t1 = newTasks4.find(t => t.name === 'Task 1');
  t.ok(t1, `${t1.name} must be one of the new tasks`);
  t1.forEach(task => {
    t.ok(task.unstarted, `AFTER ${task.name} must be unstarted`);
    t.equal(task.attempts, 1, `AFTER ${task.name} attempts must be 1`);
  });
  const t2 = newTasks4.find(t => t.name === 'Task 2');
  t.ok(t2, `${t2.name} must be one of the new tasks`);
  t2.forEach(task => {
    t.ok(task.rejected, `AFTER ${task.name} must be rejected`);
    t.ok(task.isRejected(), `AFTER ${task.name} must be Rejected`);
    t.equal(task.attempts, 2, `AFTER ${task.name} attempts must be 2`);
  });
  const t3 = newTasks4.find(t => t.name === 'Task 3');
  t.ok(t3, `${t3.name} must be one of the new tasks`);
  t3.forEach(task => {
    t.ok(task.isSuccess() && task.completed, `${task.name} must be Success and completed`);
    t.equal(task.attempts, 3, `AFTER ${task.name} attempts must be 3`);
  });

  t.end();
});