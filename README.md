# task-utils v5.0.0

Utilities for defining task states, creating task and sub-task definitions, creating tasks (and their sub-tasks) from these definitions and managing tasks on a tasks-by-name map object.

These modules provide a way to attach tasks to objects that can be executed and used to track the state and number of attempts at each task.

Tasks are root/top-level, executable tasks (with a configurable execute function), whereas sub-tasks are internal, non-executable tasks whose states must be managed completely by the execute function of their root task.

Currently includes:
- task-states.js 
  - A TaskState class and its subclasses with static utilities for defining the state of a task or operation.
- task-defs.js 
  - A TaskDef class with static utilities for creating task definitions and sub-task definitions, which can be used to 
    define new executable tasks and non-executable sub-tasks.
- tasks.js 
  - A Task class with static utilities for creating executable tasks and non-executable sub-tasks that can be used to 
    track the state of tasks or operations.
- task-utils.js 
    - Utilities for accessing and managing tasks and sub-tasks stored in a "tasks-by-name" map object

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
// TaskState constructor
const TaskState = states.TaskState;
// TimeoutError constructor
const TimeoutError = states.TimeoutError;

// TaskState direct subclasses
const Unstarted = states.Unstarted; // rather use TaskState.instances.Unstarted singleton
const Started = states.Started; // rather use TaskState.instances.Started singleton
const CompletedState = states.CompletedState;
const TimedOutState = states.TimedOutState;
const FailedState = states.FailedState;
const RejectedState = states.RejectedState;

// CompletedState subclasses
const Completed = states.Completed; // rather use TaskState.instances.Completed singleton
const Succeeded = states.Succeeded; // rather use TaskState.instances.Succeeded singleton

// TimedOutState subclasses
const TimedOut = states.TimedOut;

// FailedState subclasses
const Failed = states.Failed;

// RejectedState subclasses
const Rejected = states.Rejected;
const Discarded = states.Discarded;
const Abandoned = states.Abandoned;

// Example unstarted state
const unstarted = TaskState.instances.Unstarted; // or more wasteful: new Unstarted();

// Example started state
const started = TaskState.instances.Started; // or more wasteful: new Started();

// Example completed states
const completed = TaskState.instances.Completed; // or more wasteful: new Completed();
const succeeded = TaskState.instances.Succeeded; // or more wasteful: new Succeeded();

const customCompletedState = new CompletedState('MyCompletedState');

// Example timed out states
const timedOut = new TimedOut();
const timedOut2 = new TimedOut(new Error('My optional error that triggered timeout ...'));

const customTimedOutState = new TimedOutState('MyTimedOutState');
const customTimedOutState2 = new TimedOutState('MyTimedOutState', new TimeoutError('My optional error that triggered timeout ...'));

// Example failure states
const failed = new Failed(new Error('Another error'));

const customFailedState = new FailedState('MyFailedState', new Error('Kaboom'));

// Example rejection states
const rejected = new Rejected('My reason for rejecting', new Error('My optional error that triggered reject ...'));
const discarded = new Discarded('My reason for discarding');
const abandoned = new Abandoned('My reason for abandoning');

const customRejectedState = new RejectedState('MyRejectionState', 'My reason for rejecting', new Error('My optional error'));
```

* To use the task definition class (TaskDef)
```js
const TaskDef = require('task-utils/tasks-defs');

// To create a new top-level task definition
const taskADef = TaskDef.defineTask('TaskA', execute);

// ... with 3 sub-task definitions
const subTaskA1Def = taskADef.defineSubTask('SubTaskA1', execute2); // executable sub-task
const subTaskDefs = taskADef.defineSubTasks(['SubTaskA2', 'SubTaskA3']); // non-executable, internal sub-tasks

// ... and with 1 sub-sub-task on SubTaskA1
const subSubTaskA1aDef = subTaskA1Def.defineSubTask('SubSubTaskA1a');
```

* To use the task class (Task) & task factory (TaskFactory)
```js
// First import the TaskFactory & Task classes
const TaskFactory = require('task-utils/task-factory');
const Task = require('task-utils/tasks');

const logger = console; // or, better yet, use a logger created using `logging-utils` module
const factoryOpts = {}; // or {returnSuccessOrFailure: true} to change default `execute` behaviour to only return Success or Failure outcomes
const taskFactory = new TaskFactory(logger, factoryOpts);

// To create a new task (and any & all of its sub-tasks)
// e.g. using task definition taskADef as defined above, this would create a new task (named TaskA) 
// with 3 new sub-tasks (named SubTaskA1, SubTaskA2 & SubTaskA3) under the new task  
// and 1 new sub-sub-task (named SubSubTaskA1a) under sub-task SubTaskA1
const taskOpts = {}; // use this to set the task's optional `returnSuccessOrFailure` property, which if set to true or false, will override the factory's `returnSuccessOrFailure` property for this task
const taskA = taskFactory.createTask(taskADef, taskOpts);
```

* To use the task utilities
```js
const taskUtils = require('task-utils/task-utils');

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

## Migrating from version 4.x to 5.0.0
- Replace all requires of `task-defs` module with:
  ```js
  const TaskDef = require('task-utils/task-defs');
  ```
- Replace all requires of `tasks` module with:
  ```js
  const Task = require('task-utils/tasks');
  ```
- Depending on your usage, you probably need to `require` & use the new `task-factory` module:
  ```js
  const TaskFactory = require('task-utils/task-factory');
  // ... 
  const logger = console; // or, better yet, use a logger created using `logging-utils` module
  const factoryOpts = {}; // or {returnSuccessOrFailure: true} to change default `execute` behaviour to only return Success or Failure outcomes
  const taskFactory = new TaskFactory(logger, factoryOpts);
  ```
- Replace any `Task.createTask` calls with `taskFactory.createTask` calls  
- Replace any `Task.createMasterTask` calls with `taskFactory.createMasterTask` calls  
- Fix any `new Task` calls by additionally passing a `factory` argument (and optional `opts` argument) or, better yet,
  change them to `taskFactory.createTask` calls 

## Changes

### 5.0.0
- Added new `errors` module:
  - Added new `FrozenError` subclass of `Error`
  - Added new `FinalisedError` subclass of `Error`
  - Added `TimeoutError` from `task-states` module
- Added new `task-factory` module:
  - Added a new `TaskFactory` class to eliminate use of statics and make it easier to override task factory functionality
    - Added `createTask` method (taken from `tasks` module), which now also accepts an optional `opts` argument
    - Added `createMasterTask` method (taken from `tasks` module), which now also accepts an optional `opts` argument
  - Major changes and fixes to the original `executeAndUpdateTask` inner function from `Task`, which was moved from the 
    deleted `Task.defaultTaskExecuteFactory` function to the new `generateExecute` method of the `TaskFactory` class
  - Extracted & refactored some of the original `executeAndUpdateTask` inner function logic into a new `updateTask` 
    method of the `TaskFactory` class
  - Changed behaviour of new `executeAndUpdateState` inner function to throw a `FrozenError` if the task is already 
    frozen or throw a `FinalisedError` if the task is already fully finalised (instead of returning undefined)
- Changes to `task-states` module:
  - Moved `TimeoutError` class to new `errors` module
  - Exported new `names` object property that contains the standard TaskState names & also exposed it via `TaskState.names`
  - Exported new `instances` object property that contains the singleton TaskState instances & also exposed it via `TaskState.instances`
  - Replaced all old name constants (e.g. UNSTARTED_NAME) with appropriate `names` properties (e.g. names.Unstarted) 
  - Replaced all old singleton instance constants (e.g. UNSTARTED) with appropriate `instances` properties (e.g. instances.Unstarted) 
  - Added new `Started` state & updated `toTaskState` to also handle started states
  - Added new `started` method to `TaskState` class
  - Modified definition of `unstarted` method on `TaskState` class to enable differentiation between `Unstarted` & 
   `Started` states
  - Added appropriate `toString` methods to the various `TaskState` subclasses
- Changes to `task-defs` module:
  - NB: The `task-defs` module now exports ONLY the `TaskDef` class (instead of an object with a `TaskDef` property)
  - Removed export of `FOR_TESTING_ONLY.ensureAllTaskDefsDistinct` & `FOR_TESTING_ONLY.areSubTaskNamesDistinct` functions
  - Changed `defineTask` function to be only a static method on `TaskDef` class
  - Changed `getRootTaskDef` function to be only a static method on `TaskDef` class
  - Changed `ensureAllTaskDefsDistinct` function to be only a static method on `TaskDef` class
  - Changed `areSubTaskNamesDistinct` function to be only a static method on `TaskDef` class
- Changes to `tasks` module:
  - NB: The `tasks` module now exports ONLY the `Task` class (instead of an object with a `Task` property)
  - Removed export of `FOR_TESTING_ONLY.ensureAllTasksDistinct` & `FOR_TESTING_ONLY.reconstructTaskDefsFromRootTaskLike` functions
  - Changed `ensureAllTasksDistinct` function to be only a static method on `Task` class
  - Changed `areSubTaskNamesDistinct` function to be only a static method on `Task` class
  - Changed `isTaskLike` function to be only a static method on `Task` class
  - Changed `getTasksAndSubTasks` function to be only a static method on `Task` class
  - Changed `getRootTask` function to be only a static method on `Task` class
  - Changed & renamed `forEach` function to be only a static `forEachTaskLike` method on `Task` class (renamed to better
    reflect its functionality and to avoid confusion with existing `forEach` method on `Task` class)
  - Removed all task factory-related functions & migrated them to the new `TaskFactory` class
    - Removed `createTask` function & static method and added it as a method to `TaskFactory` class
    - Removed `createMasterTask` function & static method and added it as a method to `TaskFactory` class
    - Removed `reconstructTasksFromRootTaskLike` function & static method and added it as a method to `TaskFactory` class
    - Removed `reconstructTaskDefsFromRootTaskLike` function & static method and added it as a method to `TaskFactory` class
    - Removed `createNewTasksUpdatedFromPriorVersions` function & static method and added it as a method to `TaskFactory` class
  - Removed all task execute factory-related functions & migrated them to the new `TaskFactory` class
    - Moved & renamed `defaultTaskExecuteFactory` function to `generateExecute` method of `TaskFactory` class
    - Moved & renamed `completeTaskIfStillUnstarted` function to `completeTaskIfNecessary` method of `TaskFactory` class
    - Moved & renamed `failTaskIfNotRejectedNorFailed` function to `failTaskIfNecessary` method of `TaskFactory` class
    - Removed `Task.taskExecuteFactory` & `Task.defaultTaskExecuteFactory` static properties
  - Changes to `Task` class:
    - Added new mandatory `factory` parameter and new optional `opts` parameter to the `Task` constructor, which means 
      that tasks must now be constructed with a `TaskFactory` instance or, preferably, by calling `createTask` on your 
      `TaskFactory` instance
    - Changed `updateFromPriorVersion` method to also accept an optional `opts` parameter
    - Added new immutable `factory`, `returnSuccessOrFailure` and `_opts` properties 
    - Added new writable `_outcome` and `_donePromise` properties and new `outcome` & `donePromise` getters
    - Added new `started` method
    - Changed `start` method to also change state to new `Started` state and to ONLY react if in an unstarted state
    - Added new `decrementAttempts` method
    - Added new `totalAttempts` property
    - Added a new `executed` method, which is used by the overhauled `executeAndUpdateTask` inner function and new 
      `updateTask` method of `TaskFactory` class to set the task's `_outcome` and `_donePromise` properties after
      execution of the task's `execute` method
    - Added new `createSubTask` method
    - Renamed `getOrAddSubTask` method to `getOrCreateSubTask`
- Changes to `task-utils` module:
  - Added re-export of new `Started` `TaskState` subclass
  - Added re-export of new `TaskFactory` class
  - Removed duplicate `forEach` function & replaced usage with `Task.forEachTaskLike` method
  - Added new mandatory `taskFactory` parameter and optional `opts` parameter to `replaceTasksWithNewTasksUpdatedFromOld` function
- Updated `core-functions` dependency to version 3.0.0

### 4.0.7
- Changes to `task-defs` and `tasks` modules:
  - Removed restrictions that prevented creation of executable sub-task definitions and sub-tasks
  - Added `start` method to `Task` class
  - Changed `defaultTaskExecuteFactory` function to NOT recursively increment & update last executed at date-times of sub-tasks
  - Moved all typedefs to `type-defs.js`
- Updated `core-functions` dependency to version 2.0.14

### 4.0.6
- Updated `core-functions` dependency to version 2.0.12

### 4.0.5
- Changes to `task-utils.js` module to simplify usage and reduce the number of explicit imports required:
  - Re-exported `TaskState` class and all of its subclasses and `TimeoutError` class from `task-states.js` module
  - Re-exported `TaskDef` class from `task-defs.js` module
  - Re-exported `Task` class from `tasks.js` module
- Updated comments and README.md to improve/fix the definitions of each of the modules
- Changed `main` module from `tasks.js` to `task-utils.js` in `package.json`

### 4.0.4
- Updated `core-functions` dependency to version 2.0.11

### 4.0.3
- Fixed 'ReferenceError: trim is not defined' defect in `TimeoutError` constructor in `task-states.js` module

### 4.0.2
- Changes to `tasks.js` module:
  - Added an optional `overrideTimedOut` argument to the `complete`, `succeed` and `completeAs` methods to enable the 
    caller to decide whether these methods are allowed to override an existing timed out state or not
  - Added an optional `overrideCompleted` argument to the `timeout` and `timeoutAs` methods to enable the caller to 
    decide whether these methods are allowed to override an existing completed state or not

### 4.0.1
- Fixed defect in this `README.md`

### 4.0.0
- Added support for timeouts to `TaskState` and `Task` classes and cleaned-up their APIs
- Changes to `task-states` module:
  - Added a new `TimeoutError` subclass of `Error`
  - Changes to `TaskStateLike` and `TaskState` typedefs:
    - Renamed `code` property to `name`
    - Added new `timedOut` property
  - Changes to `TaskState` class:
    - Renamed `code` property to `name`
    - Changed all properties to private properties with underscore-prefixed names and with public `get` property accessors 
      with their original names, e.g. old `completed` property was renamed to `_completed` with a `get completed()` accessor 
    - Added a new private `_timedOut` property with a public `get timedOut()` accessor
    - Added a `toJSON` method to output the private, underscore-prefixed properties with their public property names
    - Removed `isSuccess`, `isFailure` and `isRejection` methods
    - Changed `TaskState` constructor to accept a new `timedOut` argument
    - Renamed `Success` subclass to `CompletedState`
    - Added a new `Completed` subclass of the `CompletedState` class
    - Added a new `TimedOutState` subclass 
    - Added a new `TimedOut` subclass of the `TimedOutState` class
    - Renamed `Failure` subclass to `FailedState`
    - Renamed `Rejection` subclass to `RejectedState`
    - Added a new singleton `Completed` state instance as static `COMPLETED` property
    - Added new `COMPLETED_NAME` and `TIMED_OUT_NAME` static constant properties for new state names
- Changes to `tasks` module:
  - Added new get `timedOut` property
  - Removed `isSuccess` and `isFailure` methods
  - Added new `complete`, `timeout`, `timeoutAs` and `rejectAs` methods
  - Renamed `success` method to `completeAs`
  - Renamed `failure` method to `failAs`
  - Added new optional `recursively` argument to `complete`, `succeed`, `completeAs`, `timeout`, `timeoutAs`, `fail`, 
   `failAs` and `rejectedAs` methods
- Updated `core-functions` dependency to version 2.0.10

### 3.0.5
- Updated `core-functions` dependency to version 2.0.9

### 3.0.4
- Updated `core-functions` dependency to version 2.0.8

### 3.0.3
- Updated `core-functions` dependency to version 2.0.7
- Updated `tape` dependency to 4.6.3

### 3.0.2
- Changes to `tasks.js` module:
  - Changed logic to support tracking the last executed at date-time on a task and task-like
  - Added `_lastExecutedAt` property and `lastExecutedAt` getter
  - Added `updateLastExecutedAt` function to update the last executed at date-time on a task and on its sub-tasks (if 
    recursively is true) and on its slave tasks (if its a master task)

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
