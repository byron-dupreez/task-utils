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
const setTask = taskUtils.setTask;
// const getTaskState = taskUtils.getTaskState;
// const getTaskResult = taskUtils.getTaskResult;
// const getTaskProperty = taskUtils.getTaskProperty;
// const getTaskAttempts = taskUtils.getTaskAttempts;
// const incrementTaskAttempts = taskUtils.incrementTaskAttempts;
// const setTaskState = taskUtils.setTaskState;
// const setTaskResult = taskUtils.setTaskResult;
// const setTaskProperty = taskUtils.setTaskProperty;
// const setTaskStateIfNecessary = taskUtils.setTaskStateIfNecessary;
// const resetTaskStateAndResultIfNotComplete = taskUtils.resetTaskStateAndResultIfNotComplete;

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

const strings = require('core-functions/strings');
const stringify = strings.stringify;

// //TO DO remove this workaround later for removal of getOrCreateTask from task-utils.js
// function getOrCreateTask(target, tasksName, taskName) {
//   let task = getTask(target, tasksName, taskName);
//   if (!task) {
//     const taskDef = TaskDef.defineTask(taskName, () => {});
//     task = Task.createTask(taskDef);
//     setTask(target, tasksName, taskName, task);
//   }
//   return task;
// }
// //TO DO remove this workaround for removal of getOrCreateTask from task-utils.js
// function incrementTaskAttempts(target, tasksName, taskName) {
//   getOrCreateTask(target, tasksName, taskName);
//   return taskUtils.incrementTaskAttempts(target, tasksName, taskName);
// }
// //TO DO remove this workaround for removal of getOrCreateTask from task-utils.js
// function setTaskState(target, tasksName, taskName, state, incrementAttempts) {
//   getOrCreateTask(target, tasksName, taskName);
//   return taskUtils.setTaskState(target, tasksName, taskName, state, incrementAttempts);
// }
// //TO DO remove this workaround for removal of getOrCreateTask from task-utils.js
// function setTaskResult(target, tasksName, taskName, result) {
//   getOrCreateTask(target, tasksName, taskName);
//   return taskUtils.setTaskResult(target, tasksName, taskName, result);
// }
// //TO DO remove this workaround for removal of getOrCreateTask from task-utils.js
// function setTaskProperty(target, tasksName, taskName, propertyName, value) {
//   getOrCreateTask(target, tasksName, taskName);
//   return taskUtils.setTaskProperty(target, tasksName, taskName, propertyName, value);
// }

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
      processOneTasks: {
        arb1: 'Arbitrary 1'
      },
      processAllTasks: {
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
      processAllTasks: {
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
      processAllTasks: {
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
  function check(source, taskName, task) {
    setTask(source, taskName, task);
    const actual = getTask(source, taskName);
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
  function check(source, taskName, subTaskName, expected) {
    const subTask = getSubTask(source, taskName, subTaskName);
    t.deepEqual(subTask, expected, `getSubTask(${taskName}, ${stringify(subTaskName)}) must be ${stringify(expected ? expected.name : expected)}`);
  }

  const msg = {
    id: '123',
    message: 'Yo',
    myTasks: {
      processOneTasks: {
        arb1: 'Arbitrary 1'
      },
      processAllTasks: {
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
  function check(source, taskName, subTaskName, expected) {
    const subTask = getSubTask(source, taskName, subTaskName);
    t.deepEqual(subTask, expected, `getSubTask(${taskName}, ${stringify(subTaskName)}) must be ${stringify(expected ? expected.name : expected)}`);
  }

  const msg = {
    id: '123',
    message: 'Yo',
    myTasks: {
      processOneTasks: {
        arb1: 'Arbitrary 1'
      },
      processAllTasks: {
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


// test('getOrCreateTask with no tasks and no task returns new task', t => {
//   const o = {};
//   const task = getOrCreateTask(o, 'tasks', 'task1');
//   t.ok(task, 'task must be defined');
//   t.ok(o.tasks, 'o.tasks must be defined');
//   t.ok(o.tasks.task1, 'o.tasks.task1 must be defined');
//   t.equal(task, o.tasks.task1, 'task must match o.tasks.task1');
//   t.end();
// });
//
// test('getOrCreateTask with defined task returns it', t => {
//   const o = { tasks: { task1: {} } };
//   const task1 = o.tasks.task1;
//   const task = getOrCreateTask(o, 'tasks', 'task1');
//   t.ok(task, 'task must be defined');
//   t.ok(o.tasks, 'o.tasks must be defined');
//   t.ok(o.tasks.task1, 'o.tasks.task1 must be defined');
//   t.equal(task, task1, 'task must match task1');
//   t.equal(task, o.tasks.task1, 'task must match o.tasks.task1');
//   t.end();
// });
//
// test('getTaskState with no tasks and no task & no state, returns undefined', t => {
//   const o = {};
//   const taskState = getTaskState(o, 'tasks', 'task2');
//   t.notOk(taskState, 'task state must not be defined yet');
//   t.notOk(o.tasks, 'o.tasks must not be defined');
//   t.end();
// });
//
// test('getTaskState with tasks, but no task, returns undefined', t => {
//   const o = { tasks: { task1: {} } };
//   const taskName = 'task2';
//   const taskState = getTaskState(o, 'tasks', taskName);
//   t.notOk(taskState, `task ${taskName} state must not be defined yet`);
//   t.notOk(o.tasks[taskName], `o.tasks[${taskName}] must not be defined yet`);
//   t.end();
// });
//
// test('getTaskState with defined task state returns it', t => {
//   const taskName = 'task1';
//   const err = new Error('Smash');
//   const state = new Failed(err);
//   const o = { tasks: { [taskName]: { state: state} } };
//   const taskState = getTaskState(o, 'tasks', taskName);
//   const task = getTask(o, 'tasks', taskName);
//   t.ok(taskState, `task ${taskName} state must be defined`);
//   t.equal(taskState, state, `task ${taskName} state must match`);
//   t.end();
// });
//
// test('getTaskResult with no tasks and no task & no result, returns undefined', t => {
//   const o = {};
//   const taskName = 'task2';
//   const taskResult = getTaskResult(o, 'tasks', taskName);
//   t.notOk(taskResult, `task ${taskName} result must not be defined yet`);
//   t.notOk(o.tasks, 'o.tasks must not be defined');
//   t.end();
// });
//
// test('getTaskResult with tasks, but no task, returns undefined', t => {
//   const o = { tasks: { task1: {} } };
//   const taskName = 'task2';
//   const taskResult = getTaskResult(o, 'tasks', taskName);
//   t.notOk(taskResult, `task ${taskName} result must not be defined yet`);
//   t.notOk(o.tasks[taskName], `o.tasks[${taskName}] must not be defined yet`);
//   t.end();
// });
//
// test('getTaskResult with defined task result returns it', t => {
//   const taskName = 'task1';
//   const result = 'Yo';
//   const o = { tasks: { [taskName]: { result: result} } };
//   const taskResult = getTaskResult(o, 'tasks', taskName);
//   const task = getTask(o, 'tasks', taskName);
//   t.ok(taskResult, `task ${taskName} result must be defined`);
//   t.equal(taskResult, result, `task ${taskName} result must match`);
//   t.end();
// });
//
// test('getTaskAttempts with no tasks and no task & no attempts, returns undefined', t => {
//   const o = {};
//   const taskName = 'task2';
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   t.equal(taskAttempts, 0, `task ${taskName} attempts must be zero`);
//   t.notOk(taskAttempts, `task ${taskName} attempts must not be defined yet`);
//   t.notOk(o.tasks, 'o.tasks must not be defined');
//   t.end();
// });
//
// test('getTaskAttempts with tasks, but no task, returns undefined', t => {
//   const o = { tasks: { task1: {} } };
//   const taskName = 'task2';
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   t.equal(taskAttempts, 0, `task ${taskName} attempts must be zero`);
//   t.notOk(taskAttempts, `task ${taskName} attempts must not be defined yet`);
//   t.notOk(o.tasks[taskName], `o.tasks[${taskName}] must not be defined yet`);
//   t.end();
// });
//
// test('getTaskAttempts with defined task attempts returns it', t => {
//   const taskName = 'task1';
//   const attempts = 77;
//   const o = { tasks: { [taskName]: { attempts: attempts} } };
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   const task = getTask(o, 'tasks', taskName);
//   t.ok(taskAttempts, `task ${taskName} attempts must be defined`);
//   t.equal(taskAttempts, attempts, `task ${taskName} attempts must match`);
//   t.end();
// });
//
// test('getTaskProperty with no tasks and no task & no property value, returns undefined', t => {
//   const o = {};
//   const taskName = 'task2';
//   const propertyName = 'propertyName3';
//   const taskPropertyValue = getTaskProperty(o, 'tasks', taskName, propertyName);
//   t.notOk(taskPropertyValue, `task ${taskName} ${propertyName} value must not be defined yet`);
//   t.notOk(o.tasks, 'o.tasks must not be defined');
//   t.end();
// });
//
// test('getTaskProperty with tasks, but no task, returns undefined', t => {
//   const o = { tasks: { task1: {} } };
//   const taskName = 'task2';
//   const propertyName = 'propertyName5';
//   const taskPropertyValue = getTaskProperty(o, 'tasks', taskName, propertyName);
//   t.notOk(taskPropertyValue, `task ${taskName} ${propertyName} value must not be defined yet`);
//   t.notOk(o.tasks[taskName], `o.tasks[${taskName}] must not be defined yet`);
//   t.end();
// });
//
// test('getTaskProperty with defined task propertyValue returns it', t => {
//   const taskName = 'task1';
//   const propertyName = 'propertyName7';
//   const propertyValue = 'Yo';
//   const o = { tasks: { [taskName]: { [propertyName]: propertyValue} } };
//   const taskPropertyValue = getTaskProperty(o, 'tasks', taskName, propertyName);
//   const task = getTask(o, 'tasks', taskName);
//   t.ok(taskPropertyValue, `task ${taskName} ${propertyName} value must be defined`);
//   t.equal(taskPropertyValue, propertyValue, `task ${taskName} ${propertyName} value must match`);
//   t.end();
// });
//
// test('incrementTaskAttempts with no tasks and no task & no attempts, sets it to one', t => {
//   const o = {};
//   const taskName = 'task2';
//   const o1  = incrementTaskAttempts(o, 'tasks', taskName);
//   t.equal(o1, o, 'same object');
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   t.equal(taskAttempts, 1, `task ${taskName} attempts must be one`);
//   t.ok(o.tasks, 'o.tasks must be defined');
//   t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
//   t.ok(o.tasks[taskName].attempts, `o.tasks[${taskName}].attempts must be defined`);
//   t.end();
// });
//
// test('incrementTaskAttempts with tasks, but no task, sets it to one', t => {
//   const o = { tasks: { task1: {} } };
//   const taskName = 'task2';
//   const o1 = incrementTaskAttempts(o, 'tasks', taskName);
//   t.equal(o1, o, 'same object');
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   t.equal(taskAttempts, 1, `task ${taskName} attempts must be one`);
//   t.ok(o.tasks, 'o.tasks must be defined');
//   t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
//   t.ok(o.tasks[taskName].attempts, `o.tasks[${taskName}].attempts must be defined`);
//   t.end();
// });
//
// test('incrementTaskAttempts with defined task attempts, increments it', t => {
//   const taskName = 'task1';
//   const attempts = 77;
//   const o = { tasks: { [taskName]: { attempts: attempts} } };
//   const o1 = incrementTaskAttempts(o, 'tasks', taskName);
//   t.equal(o1, o, 'same object');
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   t.ok(taskAttempts, `task ${taskName} attempts must be defined`);
//   t.equal(taskAttempts, attempts + 1, `task ${taskName} attempts is original plus one`);
//
//   const o2 = incrementTaskAttempts(o, 'tasks', taskName);
//   t.equal(o2, o, 'same object');
//   const taskAttempts2 = getTaskAttempts(o, 'tasks', taskName);
//   t.equal(taskAttempts2, attempts + 2, `task ${taskName} attempts is original plus two`);
//   t.end();
// });
//
//
// test('setTaskState with no tasks and no task & no state and incrementAttempts true, updates the state and attempts to 1', t => {
//   const o = {};
//   const taskName = 'task2';
//   const state = new Failure('Missing');
//   const o1 = setTaskState(o, 'tasks', taskName, state, true);
//   t.equal(o1, o, 'same object');
//
//   const taskState = getTaskState(o, 'tasks', taskName);
//   t.equal(taskState, state, `task ${taskName} state must match`);
//
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   t.equal(taskAttempts, 1, `task ${taskName} state must be one`);
//
//   t.ok(o.tasks, 'o.tasks must be defined');
//   t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
//   t.ok(o.tasks[taskName].state, `o.tasks[${taskName}].state must be defined`);
//   t.end();
// });
//
// test('setTaskState with tasks, but no task and incrementAttempts true, updates the state and attempts to 1', t => {
//   const o = { tasks: { task1: {} } };
//   const taskName = 'task2';
//   const state = new Success('Exists');
//   const o1 = setTaskState(o, 'tasks', taskName, state, true);
//   t.equal(o1, o, 'same object');
//
//   const taskState = getTaskState(o, 'tasks', taskName);
//   t.equal(taskState, state, `task ${taskName} state must match`);
//
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   t.equal(taskAttempts, 1, `task ${taskName} attempts must be one`);
//
//   t.ok(o.tasks, 'o.tasks must be defined');
//   t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
//   t.ok(o.tasks[taskName].state, `o.tasks[${taskName}].state must be defined`);
//   t.ok(o.tasks[taskName].attempts, `o.tasks[${taskName}].attempts must be defined`);
//   t.end();
// });
//
// test('setTaskState with defined task state and attempts and incrementAttempts true, updates the state and increments the attempts', t => {
//   const taskName = 'task1';
//   const state = new Failed(new Error('Thump'));
//   const attempts = 69;
//   const o = { tasks: { [taskName]: { state: UNSTARTED, attempts: attempts } } };
//   const o1 = setTaskState(o, 'tasks', taskName, state, true);
//   t.equal(o1, o, 'same object');
//
//   const taskState = getTaskState(o, 'tasks', taskName);
//   t.equal(taskState, state, `task ${taskName} state must match`);
//
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   t.ok(taskAttempts, `task ${taskName} attempts must be defined`);
//   t.equal(taskAttempts, attempts + 1, `task ${taskName} attempts is original plus one`);
//
//   // Simulate a reset at start of 2nd run
//   setTaskState(o, 'tasks', taskName, UNSTARTED, false);
//
//   const state2 = SUCCEEDED;
//   const o2 = setTaskState(o, 'tasks', taskName, state2, true);
//   t.equal(o2, o, 'same object');
//
//   const taskState2 = getTaskState(o, 'tasks', taskName);
//   t.equal(taskState2, state2, `task ${taskName} state 2 must match`);
//
//   const taskAttempts2 = getTaskAttempts(o, 'tasks', taskName);
//   t.equal(taskAttempts2, attempts + 2, `task ${taskName} attempts is original plus two`);
//   t.end();
// });
//
// test('setTaskState with no tasks and no task & no state and incrementAttempts false, updates the state only', t => {
//   const o = {};
//   const taskName = 'task2';
//   const state = new Failure('Missing');
//   const o1 = setTaskState(o, 'tasks', taskName, state, false);
//   t.equal(o1, o, 'same object');
//
//   const taskState = getTaskState(o, 'tasks', taskName);
//   t.equal(taskState, state, `task ${taskName} state must match`);
//
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   t.notOk(taskAttempts, `task ${taskName} attempts must not be defined`);
//   t.equal(taskAttempts, 0, `task ${taskName} attempts is zero`);
//
//   t.ok(o.tasks, 'o.tasks must be defined');
//   t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
//   t.ok(o.tasks[taskName].state, `o.tasks[${taskName}].state must be defined`);
//   t.notOk(o.tasks[taskName].attempts, `o.tasks[${taskName}].attempts must not be defined yet`);
//   t.end();
// });
//
// test('setTaskState with tasks, but no task and incrementAttempts false, updates the state only', t => {
//   const o = { tasks: { task1: {} } };
//   const taskName = 'task2';
//   const state = new Success('Exists');
//   const o1 = setTaskState(o, 'tasks', taskName, state, false);
//   t.equal(o1, o, 'same object');
//
//   const taskState = getTaskState(o, 'tasks', taskName);
//   t.equal(taskState, state, `task ${taskName} state must match`);
//
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   t.notOk(taskAttempts, `task ${taskName} attempts must not be defined`);
//   t.equal(taskAttempts, 0, `task ${taskName} attempts is zero`);
//
//   t.ok(o.tasks, 'o.tasks must be defined');
//   t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
//   t.ok(o.tasks[taskName].state, `o.tasks[${taskName}].state must be defined`);
//   t.notOk(o.tasks[taskName].attempts, `o.tasks[${taskName}].attempts must not be defined yet`);
//   t.end();
// });
//
// test('setTaskState with defined task state and attempts and incrementAttempts false, updates the state only', t => {
//   const taskName = 'task1';
//   const state = new Failed(new Error('Thump'));
//   const attempts = 69;
//   const o = { tasks: { [taskName]: { state: state, attempts: attempts } } };
//   const o1 = setTaskState(o, 'tasks', taskName, state, false);
//   t.equal(o1, o, 'same object');
//
//   const taskState = getTaskState(o, 'tasks', taskName);
//   t.equal(taskState, state, `task ${taskName} state must match`);
//
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   t.equal(taskAttempts, attempts, `task ${taskName} attempts still has original value`);
//
//   const state2 = SUCCEEDED;
//   const o2 = setTaskState(o, 'tasks', taskName, state2, false);
//   t.equal(o2, o, 'same object');
//
//   const taskState2 = getTaskState(o, 'tasks', taskName);
//   t.equal(taskState2, state2, `task ${taskName} state must match`);
//
//   const taskAttempts2 = getTaskAttempts(o, 'tasks', taskName);
//   t.equal(taskAttempts2, attempts, `task ${taskName} attempts 2 still has original value`);
//   t.end();
// });
//
// test('setTaskState with defined task state and attempts and incrementAttempts true, updates the state and increments the attempts', t => {
//   const taskName = 'task1';
//   const code = 'Failed';
//   const error = new Error('Thump');
//   const state = new Failed(error);
//   const attempts = 69;
//   const o = { tasks: { [taskName]: { state: UNSTARTED, attempts: attempts } } };
//
//   // Update #1
//   const o1 = setTaskState(o, 'tasks', taskName, toTaskState(code, false, error, false, undefined), true);
//   t.equal(o1, o, 'same object');
//
//   const taskState = getTaskState(o, 'tasks', taskName);
//   t.deepEqual(taskState, state, `task ${taskName} state must match`);
//
//   const taskAttempts = getTaskAttempts(o, 'tasks', taskName);
//   t.ok(taskAttempts, `task ${taskName} attempts must be defined`);
//   t.equal(taskAttempts, attempts + 1, `task ${taskName} attempts is original plus one`);
//
//   // Simulate a new run by resetting the task state back to incomplete
//   setTaskState(o, 'tasks', taskName, UNSTARTED, false);
//
//   const code2 = SUCCEEDED_CODE;
//   const state2 = SUCCEEDED;
//   // Update #2
//   const o2 = setTaskState(o, 'tasks', taskName, toTaskState(code2, true, undefined, false, undefined), false);
//   t.equal(o2, o, 'same object');
//
//   const taskState2 = getTaskState(o, 'tasks', taskName);
//   t.deepEqual(taskState2, state2, `task ${taskName} state 2 must match`);
//
//   const taskAttempts2 = getTaskAttempts(o, 'tasks', taskName);
//   t.equal(taskAttempts2, attempts + 1, `task ${taskName} attempts 2 is still original plus one`);
//   t.end();
// });
//
// test('setTaskResult with no tasks and no task & no result, updates the result', t => {
//   const o = {};
//   const taskName = 'task2';
//   const result = 1.2345;
//   const o1 = setTaskResult(o, 'tasks', taskName, result);
//   t.equal(o1, o, 'same object');
//
//   const taskResult = getTaskResult(o, 'tasks', taskName);
//   t.equal(taskResult, result, `task ${taskName} result must match`);
//
//   t.ok(o.tasks, 'o.tasks must be defined');
//   t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
//   t.ok(o.tasks[taskName].result, `o.tasks[${taskName}].result must be defined`);
//   t.end();
// });
//
// test('setTaskResult with tasks, but no task & no result, updates the result', t => {
//   const o = { tasks: { task1: {} } };
//   const taskName = 'task2';
//   const result = 4.567;
//   const o1 = setTaskResult(o, 'tasks', taskName, result);
//   t.equal(o1, o, 'same object');
//
//   const taskResult = getTaskResult(o, 'tasks', taskName);
//   t.equal(taskResult, result, `task ${taskName} result must match`);
//
//   t.ok(o.tasks, 'o.tasks must be defined');
//   t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
//   t.ok(o.tasks[taskName].result, `o.tasks[${taskName}].result must be defined`);
//   t.end();
// });
//
// test('setTaskResult with defined task result, updates the result', t => {
//   const taskName = 'task1';
//   const result = 7.89;
//   const o = { tasks: { [taskName]: { result: result } } };
//   const o1 = setTaskResult(o, 'tasks', taskName, result);
//   t.equal(o1, o, 'same object');
//
//   const taskResult = getTaskResult(o, 'tasks', taskName);
//   t.equal(taskResult, result, `task ${taskName} result must match`);
//
//   const result2 = result * 2;
//   const o2 = setTaskResult(o, 'tasks', taskName, result2);
//   t.equal(o2, o, 'same object');
//
//   const taskResult2 = getTaskResult(o, 'tasks', taskName);
//   t.equal(taskResult2, result2, `task ${taskName} result 2 must match`);
//   t.end();
// });
//
// test('setTaskProperty with no tasks and no task & no property value, updates the property value', t => {
//   const o = {};
//   const taskName = 'task2';
//   const propertyName = 'propertyName53';
//   const propertyValue = 2.999;
//   const o1 = setTaskProperty(o, 'tasks', taskName, propertyName, propertyValue);
//   t.equal(o1, o, 'same object');
//
//   const taskPropertyValue = getTaskProperty(o, 'tasks', taskName, propertyName);
//   t.equal(taskPropertyValue, propertyValue, `task ${taskName} ${propertyName} value must match`);
//
//   t.ok(o.tasks, 'o.tasks must be defined');
//   t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
//   t.ok(o.tasks[taskName][propertyName], `o.tasks[${taskName}][${propertyName}] value must be defined`);
//   t.end();
// });
//
// test('setTaskProperty with tasks, but no task & no propertyValue, updates the propertyValue', t => {
//   const o = { tasks: { task1: {} } };
//   const taskName = 'task2';
//   const propertyName = 'propertyName54';
//   const propertyValue = 4.999;
//   const o1 = setTaskProperty(o, 'tasks', taskName, propertyName, propertyValue);
//   t.equal(o1, o, 'same object');
//
//   const taskPropertyValue = getTaskProperty(o, 'tasks', taskName, propertyName);
//   t.equal(taskPropertyValue, propertyValue, `task ${taskName} ${propertyName} value must match`);
//
//   t.ok(o.tasks, 'o.tasks must be defined');
//   t.ok(o.tasks[taskName], `o.tasks[${taskName}] must be defined`);
//   t.ok(o.tasks[taskName][propertyName], `o.tasks[${taskName}][${propertyName}] value must be defined`);
//   t.end();
// });
//
// test('setTaskProperty with defined task propertyValue, updates the propertyValue', t => {
//   const taskName = 'task1';
//   const propertyName = 'propertyName55';
//   const propertyValue = 7.999;
//   const o = { tasks: { [taskName]: { propertyValue: propertyValue } } };
//   const o1 = setTaskProperty(o, 'tasks', taskName, propertyName, propertyValue);
//   t.equal(o1, o, 'same object');
//
//   const taskPropertyValue = getTaskProperty(o, 'tasks', taskName, propertyName);
//   t.equal(taskPropertyValue, propertyValue, `task ${taskName} ${propertyName} value must match`);
//
//   const propertyValue2 = propertyValue * 2;
//   const o2 = setTaskProperty(o, 'tasks', taskName, propertyName, propertyValue2);
//   t.equal(o2, o, 'same object');
//
//   const taskPropertyValue2 = getTaskProperty(o, 'tasks', taskName, propertyName);
//   t.equal(taskPropertyValue2, propertyValue2, `task ${taskName} ${propertyName} value must match`);
//   t.end();
// });


