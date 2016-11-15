# task-utils v3.0.1

Utilities for defining task states, creating task and sub-task definitions, creating tasks (and their sub-tasks) from these definitions and managing tasks on a tasks-by-name map object.

These modules provide a way to attach tasks to objects that can be executed and used to track the state and number of attempts at each task.

Tasks are root/top-level, executable tasks (with a configurable execute function), whereas sub-tasks are internal, non-executable tasks whose states must be managed completely by the execute function of their root task.

Currently includes:
- task-states.js 
    - A TaskState class and subclasses that define the various states of a task or operation
- task-defs.js 
    - A TaskDef class that represents a task or sub-task definition, which can be used to create tasks and sub-tasks
- tasks.js 
    - A Task class that represents a task or sub-task instance
- task-utils.js 
    - Utilities for getting & setting tasks and sub-tasks from/to a "tasks-by-name" map object

This module is exported as a [Node.js](https://nodejs.org/) module.

## Installation

Using npm:
```bash
$ {sudo -H} npm i -g npm
$ npm i --save task-utils
```

In Node.js:

* To use the task state classes and subclasses
```js
const states = require('task-utils/task-states');

// TaskState constructors
const TaskState = states.TaskState;

// TaskState direct subclasses
const Unstarted = states.Unstarted; // rather use TaskState.UNSTARTED singleton
const Success = states.Success;
const Failure = states.Failure;
const Rejection = states.Rejection;

// Success subclasses
const Succeeded = states.Succeeded; // rather use TaskState.SUCCEEDED singleton

// Failure subclasses
const Failed = states.Failed;

// Rejection subclasses
const Rejected = states.Rejected;
const Discarded = states.Discarded;
const Abandoned = states.Abandoned;

// Example unstarted state
const unstarted = TaskState.UNSTARTED; // or more wasteful: new Unstarted();

// Example success states
const success = new Success('MySuccessCode');
const succeeded = TaskState.SUCCEEDED; // or more wasteful: new Succeeded();

// Example failure states
const failure = new Failure('MyFailureCode', new Error('Kaboom'));
const failed = new Failed(new Error('Another error'));

// Example rejection states
const rejection = new Rejection('MyRejectionCode', 'My reason for rejection', new Error('My optional error'));
const rejected = new Rejected('My reason for rejecting', new Error('Another optional error'));
const discarded = new Discarded('My reason for discarding');
const abandoned = new Abandoned('My reason for abandoning');
```

* To use the task definition class (TaskDef)
```js
const taskDefs = require('task-utils/tasks-defs');
const TaskDef = taskDefs.TaskDef;

// To create a new top-level task definition
const taskADef = TaskDef.defineTask('TaskA', execute);

// ... with 3 sub-task definitions
const subTaskA1Def = taskADef.defineSubTask('SubTaskA1');
const subTaskDefs = taskADef.defineSubTasks(['SubTaskA2', 'SubTaskA3']);

// ... and with 1 sub-sub-task on SubTaskA1
const subSubTaskA1aDef = subTaskA1Def.defineSubTask('SubSubTaskA1a');
```

* To use the task class (Task)
```js
const Tasks = require('task-utils/tasks');
const Task = Tasks.Task;

// To create a new task (and any & all of its sub-tasks)
// e.g. using task definition taskADef as defined above, this would create a new task (named TaskA) 
// with 3 new sub-tasks (named SubTaskA1, SubTaskA2 & SubTaskA3) under the new task  
// and 1 new sub-sub-task (named SubSubTaskA1a) under sub-task SubTaskA1
const taskA = Task.createTask(taskADef);
```

* To use the task utilities
```js
const taskUtils = require('task-utils/tasks');

const tasksByName = {}; // or any object to which you are attaching tasks

// To set a task into a tasks-by-name map object
taskUtils.setTask(tasksByName, 'TaskA', taskA);

// To get a task from a tasks-by-name map object
const tA = taskUtils.getTask(tasksByName, 'TaskA');

// To get a sub-task from a tasks-by-name map object
const subTaskA3 = taskUtils.getSubTask(tasksByName, 'TaskA', 'SubTaskA3');

// To get a sub-sub-task from a tasks-by-name map object
const subSubTaskA1a = taskUtils.getSubTask(tasksByName, 'TaskA', ['SubTaskA1', 'SubSubTaskA1a']);

// To get all (top-level) tasks from a tasks-by-name map object
const tasks = taskUtils.getTasks(tasksByName);

// To get all tasks and all of their sub-tasks recursively from a tasks-by-name map object
const tasksAndSubTasks = taskUtils.getTasksAndSubTasks(tasksByName);
```

## Unit tests
This module's unit tests were developed with and must be run with [tape](https://www.npmjs.com/package/tape). The unit tests have been tested on [Node.js v4.3.2](https://nodejs.org/en/blog/release/v4.3.2/).  

Install tape globally if you want to run multiple tests at once:
```bash
$ npm install tape -g
```

Run all unit tests with:
```bash
$ npm test
```
or with tape:
```bash
$ tape test/*.js
```

See the [package source](https://github.com/byron-dupreez/task-utils) for more details.

## Changes

### 3.0.1
- Changes to `tasks.js` module:
  - Renamed `wrapExecuteTask` function to `defaultTaskExecuteFactory`
  - Added `_frozen` and `_error` properties to Task class
  - Added get `error` method to Task class
  - Added `getOrAddSubTask` method to Task class
  - Added optional `recursively` argument to `incrementAttempts` method on Task class
  - Added optional `result` arguments to `succeed` and `success` methods on Task class
  - Changed `fail` and `failure` methods to set new `_error` property
  - Added `freeze` and `isFrozen` methods to Task class
  - Removed unused `copyStateToSlaveTasks` method from Task class
  - Changed static `createMasterTask` method to ensure that slave tasks have same definitions as master task
  - Changed `defaultTaskExecuteFactory` function:
    - To recursively increment the number of attempts on a task's sub-tasks
    - To a static method on Task class
  - Added a static `taskExecuteFactory` method to Task class that defaults to `defaultTaskExecuteFactory`
    and can be changed to use an alternative task execute factory
  - Changed `completeTaskIfStillUnstarted` and `failTaskIfNotRejectedNorFailed` functions:
    - To static methods on Task class
    - To accept an optional `logger` argument
    - To catch and log warnings & errors when state changes are attempted after a task is frozen
  - Minor changes to unit tests to synchronize with code changes
  - Added unit tests for static `createMasterTask` method on Task class
- Updated `core-functions` dependency to version 2.0.3

### 3.0.0
- Changes and fixes to `task-states` module
  - Fixed defect in `Rejected` subclass
  - Changes to TaskState API:
    - Added `incomplete` read-only property
    - Changed `isFinalised` method to `finalisd` read-only property
- Changes and fixes to `tasks` module
  - Fixed defects in `createNewTasksUpdatedFromPriorVersions` function
  - Changes to Task API in `tasks` module:
    - Removed unneeded `attemptIncrements` read-only property
    - Added `incomplete` read-only property
    - Changed `isUnstarted` method to `unstarted` read-only property to match TaskState
    - Changed `isFinalised` method to `finalisd` read-only property to match TaskState
    - Added static `getTasksAndSubTasks` function to Task
    - Added static `forEach` function to Task
  - Added more unit tests
- Changes and fixes to `task-utils` module
  - Fixed defect in `getTasksAndSubTasks` function blocking use of task-likes
  - Added `forEach` function
  - Added more unit tests

### 2.0.0
- Added new `tasks` module
- Added new `task-defs` module
- Added rejection subclasses to `task-states` module 
- Substantial refactoring of `task-states` module
- Major refactoring/rewrite of old `task-utils` code
    - 2.0.0 API is completely different to 1.0.x versions

### 1.0.1
- Fixed incorrect github link in README.md (no code changes)

### 1.0.0
- Initial commit
- Created README.md
- Added tasks and statuses and their unit tests
