## Changes

### 7.0.7
- Changes to `task-factory` module:
  - Used `ignoreUnhandledRejection` to attach a `catch` clause to `donePromise` in case it's never used by caller
  - Changed logging level of `FinalisedError` from `WARN` to `ERROR`

### 7.0.6
- Updated dependencies

### 7.0.5
- Added `.npmignore`
- Renamed `release_notes.md` to `CHANGES.md`
- Updated dependencies

### 7.0.4
- Updated `core-functions` dependency to version 3.0.22

### 7.0.3
- Updated `core-functions` dependency to version 3.0.20

### 7.0.2
- Renamed dummy first exports (`exports._ = '_'; //IDE workaround`) of most modules to (`exports._$_ = '_$_';`) to avoid 
  potential future collisions with `lodash` & `underscore`
- Updated `core-functions` dependency to version 3.0.19

### 7.0.1
- Minor tweak to reduce some unnecessary logging

### 7.0.0
- Changes to `core` module & `StateType` enum:
  - Renamed `UNSTARTED`, `STARTED`, `COMPLETED`, `TIMED_OUT`, `FAILED` & `REJECTED` properties to corresponding new
    `Unstarted`, `Started`, `Completed`, `TimedOut`, `Failed` & `Rejected` properties with values that match their 
    corresponding `TaskState` names
  - Replaced all usages of the original `StateType` properties with their corresponding new `StateType` properties, e.g. 
    replaced all usages of `StateType.TIMED_OUT` property with `StateType.TimedOut`
  - For backward compatibility: Re-added deprecated versions of the original `StateType` property names with changed 
    values that now also match their corresponding `TaskState` names
  - Added a `cleanType` function as a static method to `StateType` enum
- Changes to `task-states` module & `TaskState` class:
  - Renamed `kind` property to `type`
  - For backward compatibility: Re-added a `kind` getter
  - Added a more compact `toJSON` method that omits the task's "redundant" `name` if it's the same as its `type`
  - Replaced all usages of the original `StateType` properties with their corresponding new `StateType` properties, e.g. 
    replaced all usages of `StateType.TIMED_OUT` property with `StateType.TimedOut`
  - Changed `TaskState` constructor to use the new `StateType.cleanType` function
  - Changed `fromStateLikeProperties` function to use the new `StateType.cleanType` function & to treat a missing or 
    blank `name` argument as if it was set to the cleaned `type` argument (to handle changes to `StateType` values & 
    output from the new `toJSON` method)
  - Changed `toTaskStateFromStateLike` function to handle new `type` property & still survive a legacy `kind` property
- Changes to `task-defs` module & `TaskDef` class:
  - Replaced the `executable` property with an optional `managed` property, which is ONLY set when `true`
  - Added an `executable` getter for backward compatibility
  - Removed unused `isExecutable`, `isNotExecutable` & `isInternal` methods
  - Cleaned up comments to use 'managed' terminology instead of 'internal'
- Changes to `tasks` module & `Task` class:
  - Replaced `executable` property with an optional `managed` property, which is ONLY set when `true`
  - Added an `executable` getter for backward compatibility
  - Removed unused `isExecutable`, `isNotExecutable` & `isInternal` methods
  - Changed the `toJSON` method to create more compact strings that: exclude the `executable` property; ONLY include the 
    new `managed` property if it's true; and replace the `totalAttempts` property with `total`
  - Patched `createSubTask` method to copy the given `taskDefSettings` to avoid mutating them
  - Cleaned up comments to use 'managed' terminology instead of 'internal'
- Changes to `task-factory` module & `TaskFactory` class:
  - Added `isTaskLikeManaged` static method to handle a new optional `managed` property & still survive a legacy 
    `executable` property

### 6.0.13
- Changes to `tasks` module:
  - Added optional boolean `recursively` and `skipSlaves` arguments to the `beganAt` & `endedAt` methods & changed them 
    to also update the task's sub-tasks if `recursively` is true & its slave tasks if `skipSlaves` is false
  - Changed `start` method to invoke `beganAt` with `recursively` false and `skipSlaves` true to avoid multiple updates
  - Minor optimizations to `calculateEnded` & `calculateTook` functions    
- Changes to `task-factory` module:
  - Added an optional `donePromiseFlattenOpts` property to the `options` argument passed to `TaskFactory` constructor
  - Added a `donePromiseFlattenOpts` property to `TaskFactory` instances
  - Changed `executeAndUpdateTask` inner function to resolve `outcome.toPromise()` once & pass it to `updateTask` method
  - Changed `updateTask` method to:
    - Accept & `flatten` the passed `promise` to a `donePromise` using the factory's `logger` & `donePromiseFlattenOpts` properties
    - Invoke `endedAt` with explicit `recursively` false and `skipSlaves` false
    - Log state & time taken at a trace-level to facilitate suppression of this logging
    - Replaced more instances of logging of `error.stack` with logging of just the error
- Updated `core-functions` dependency to version 3.0.17

### 6.0.12
- Replaced all logging of `error.stack` with logging of just the error
- Updated `core-functions` dependency to version 3.0.15

### 6.0.11
- Added dummy first exports (`exports._ = '_'; //IDE workaround`) to most modules as a temporary workaround for IDE issue

### 6.0.10
- Changed almost all modules' exports to modifications of the default `exports` object instead of replacing the default `module.exports` object
- Updated `core-functions` dependency to 3.0.13

### 6.0.9
- Updated `core-functions` dependency to 3.0.11

### 6.0.8
- Updated `core-functions` dependency to 3.0.10
- Changes to `core` module:
  - Deleted `TimeoutError` & replaced it with new `TimeoutError` in `core-functions/errors` module
  - Changed `FrozenError` & `FinalisedError` to better match standard `Error` contract
- Removed some console logging

### 6.0.7
- Updated `core-functions` dependency to 3.0.9

### 6.0.6
- Updated `core-functions` dependency to 3.0.8

### 6.0.5
- Moved test devDependencies to package.json & removed test/package.json
- Updated `core-functions` dependency to 3.0.7

### 6.0.4
- Changes to `task-utils.test.js` test module:
  - Switched test examples back to using prior & shorter `ones` & `alls` properties instead of `processOneTasks` & `processAllTasks`

### 6.0.3
- Changes to `tasks` module:
  - Added `revertAttempts` method to enable reversal of the current number of attempts back to the initial number of 
    attempts that was cached just before the task was last started
  - Changed `timeout` & `timeoutAs` methods to use new `revertAttempts` method instead of manual decrements

### 6.0.2 
- Merged in changes from 4.0.8
- Changes to `task-defs` module:
  - Added new optional `skipAddToParent` option to `settings` parameter of `TaskDef` `constructor`
  - Changed constructor behaviour to NOT check for distinct sub-task names & to NOT add the sub-task to its parent's 
    sub-tasks when the `settings.skipAddToParent` option is passed as true
  - Added new `unusable` property with `get` & `set` accessors and an underlying `_unusable` property to `TaskDef` class
- Changes to `tasks` module:
  - Added new `detachSubTask` function to enable a sub-task to be detached from its parent task
  - Changed `getOrCreateSubTask` function to replace an existing unusable sub-task with a usable version by detaching 
    the old unusable sub-task, creating the new sub-task via `createSubTask` & updating the new from the old
  - & to create a 
    new sub-task, both with new sub-task definitions created with defaulted to true if 
    not explicitly set
  - Changed `createSubTask` function to default new `settings.skipAddToParent` option to true if not explicitly set
  - Added new `isFullyFinalisedOrUnusable` function
  - Changed `updateFromPriorVersion` function to NOT mark missing sub-tasks as `abandoned` and to instead rely on new 
    `unusable` properties
  - Added read-only `unusable` property with `get` accessor that delegates to its task definition's `unusable` property
- Changes to `task-factory` module:  
  - Changed `reincarnateTasks` function to NOT mark missing sub-tasks as `abandoned` and to instead recreate them as 
    unusable tasks, first updated from their prior versions & then reset
  - Changed `reconstructTaskDefsFromRootTaskLike` function to properly generate placeholder `doNotExecute` functions 
    (which are also now marked with `placeholder` properties set to true) using the new inner `generatePlaceholderFunction` 
    function and to mark all reconstructed task definitions & sub-task definitions as `unusable`

### 6.0.2-alpha1
- Started integrating unusable task definition changes from 4.0.8

### 6.0.1
- Changes to `tasks` module & `Task` class:
  - Fixed behaviour of `reject`, `discard`, `abandon` & `rejectAs` methods to first recurse through sub-tasks, to ONLY 
    allow the state change if the task is incomplete AND every one of it sub-task is fully finalised & to return the 
    number of tasks & sub-tasks actually rejected. Rationale for change: Should NOT be able to reject a task with 
    incomplete sub-tasks
  - Added new `discardIfOverAttempted` method, which is a variation of the `discard` method, that first recurses through 
    the task's sub-tasks, ONLY allows the state change if the task is incomplete, OVER-ATTEMPTED AND every one of its 
    sub-task is fully finalised & finally returns the number of tasks & sub-tasks actually rejected
- Changes to `task-factory` module:
  - Changed the behaviour of the `updateTask` function to use `Try.findFailure` to do a much deeper search for a Failure 
    instead of only checking the top-level result for a Failure
- Changes to `task-utils` module:
  - Added new `isAnyTaskNotFullyFinalised` function
- Changes to `core` module:
  - Added `compareStateTypes` function for sorting state types from "least advanced" to "most advanced"
- Changes to `task-states` module:
  - Added `compareStates` function for sorting states from "least advanced" to "most advanced"
- More changes to `tasks` module & `Task` class:
  - Changed behaviour of `setSlaveTasks` method to:
    - Set the master task's began & ended date-times to those of its slave task with the most recent began date-time
    - Set the master task's state to the "least advanced" state of all of its slave tasks (if its undefined or unstarted)
  - Removed redundant dependency on `deep-equal` module
- Updated `core-functions` dependency to version 3.0.4
- Upgraded to Node 6.10.3

### 6.0.0
- Renamed `errors` module to `core` module:
  - Added `StateType` enum to represent the underlying types/kinds of states
  - Added `ReturnMode` enum to represent the different types of return modes that can be used to handle values returned 
    and errors thrown by tasks' `execute` methods
- Changes to `task-states` module:
  - Changes to `TaskState` class:
    - Renamed `_name` property to `name`
    - Added a new StateType `kind` property (see `StateType` enum in `core` module for valid values)
    - Removed `_completed`, `_timedOut` & `_rejected` properties, which were all replaced by the new StateType `kind` property
    - Renamed `_error` property to `error` 
    - Renamed `_reason` property to `reason`
    - Changed `TaskState` constructor to take a single StateType `kind` argument instead of the original three `completed`, 
      `timedOut` & `rejected` arguments
    - Removed `name`, `error` & `reason` getters, which were no longer needed after the rename of the `_name`, `_error` 
      and `_reason` properties
    - Re-implemented `unstarted`, `started`, `completed`, `failed`, `timedOut`, `rejected`, `incomplete` & `finalised` 
      getters to use the new StateType `kind` property
    - Removed `toJSON` method (redundant after rename & change of properties)
  - Changed constructors of all `TaskState` subclasses to pass the appropriate StateType `kind` argument to their 
    superclass constructor
  - Renamed the old `toTaskState` function to `fromLegacyStateLikeProperties`
  - Added a new `fromStateLikeProperties` function that only accepts the new state properties: `name`; `kind`; `error`; 
    and `reason`
  - Changed the `toTaskStateFromStateLike` function to use the new version of the `fromStateLikeProperties` function if 
    the given state-like has a `kind` property; otherwise to use the `fromLegacyStateLikeProperties` function if the 
    given state-like has a legacy `completed`, `timedOut` or `rejected` property; otherwise to return undefined 
- Changes to `task-utils` module:
  - Renamed `replaceTasksWithNewTasksUpdatedFromOld` function to `reviveTasks`
  - Added `onlyRecreateExisting` option to `opts` argument of `reviveTasks` function
  - Removed `logger` argument from `configureTaskFactory` function, since now incorporated into its `settings` argument
  - Replaced `logger` argument of `constructTaskFactory` function with new `settings` argument
- Changes to `task-factory` module & `TaskFactory` class:
  - Changes to `TaskFactory` constructor:
    - Replaced first `logger` argument with more generic `settings` argument (non-backward compatible change), which 
      enables configuration of the `logger` & a default `describeItem` function
    - Renamed second `opts` argument to `options`
  - Added a new optional `describeItem` function property to the `TaskFactory` class
  - Replaced boolean `returnSuccessOrFailure` property with `returnMode` property
  - Changed the `generateExecute` function to use the new `returnMode` properties of the `TaskFactory` & `Task` 
    classes and to also support the new `ReturnMode.PROMISE` return mode, which wraps the value returned in a resolved 
    Promise or the error thrown in a rejected Promise
  - Changed the `generateExecute` function to use the new optional `describeItem` function property to generate a short 
    description of a task's `execute` arguments to use for logging & to pass to the `updateTask` method
  - Changed the `updateTask` method to accept an extra `startTimeInMs` argument to use to calculate `end` time
  - Changed the `updateTask`, `completeTaskIfNecessary` & `failTaskIfNecessary` methods to accept an extra `describeItem`
    argument to use for logging
  - Changed the `updateTask` method to trigger the new `endedAt` method on its given task
  - Changed the `updateTask` method to use the `core-functions/promises` module's new `flatten` function instead of the 
    `every` function to resolve the execution done promise for the task
  - Removed dead `extractPotentialPromises` function
  - Renamed `createNewTasksUpdatedFromPriorVersions` method to `reincarnateTasks`
    - Added `onlyRecreateExisting` option to `opts` argument of `reincarnateTasks` method
  - Renamed `copyStateAttemptsAndLastExecutedAt` method to `copyStateAttemptsAndExecutionTimes`
    - Updated `copyStateAttemptsAndExecutionTimes` method to set a task's `_began`, `_took` & `_ended` properties
- Changes to `tasks` module & `Task` class:
  - Renamed `_lastExecutedAt` property of `Task` class to `_began`
  - Renamed `lastExecutedAt` getter of `Task` class to `began`
  - Added new `ended` getter and `_ended` property to `Task` class
  - Added new `took` getter and `_took` property to `Task` class
  - Added new static `calculateEnded` & `calculateTook` utility functions to `Task` class
  - Added new `beganAt` method to `Task` class to set the new `_began` & `_took` properties
  - Changed `start` method to use new `beganAt` method
  - Added new `endedAt` method to `Task` class to set the new `_ended` & `_took` properties
  - Replaced boolean `returnSuccessOrFailure` property with `returnMode` property
  - Added a convenience `stateType` method to return the StateType `kind` of a task's `state`  
  - Updated & optimised `toJSON` method to reflect `began`, `took` & optionally `ended` properties & omit empty `subTasks`
    - Patched static `isTaskLike` & `forEachTaskLike` methods to handle omitted `subTasks` properties
  - Renamed `updateLastExecutedAt` method to `updateBegin` & then commented it out, since not currently used
  - Changed `updateFromPriorVersion` method to update new `_began`, `_took` & `_ended` properties
  - Changes to `complete` and `succeed` methods:
    - Replaced 2nd `overrideTimedOut` boolean argument with a more generic object `opts` argument, which currently only 
      accepts an `overrideTimedOut` property. For backward compatibility, any boolean `opts` argument will be treated as 
      a legacy `overrideTimedOut` argument
  - Changes to `completeAs` method:
    - Replaced 3rd `overrideTimedOut` boolean argument with a more generic object `opts` argument, which currently only 
      accepts an `overrideTimedOut` property. For backward compatibility, any boolean `opts` argument will be treated as
      a legacy `overrideTimedOut` argument
  - Changes to `timeout` method:
    - Replaced 2nd `overrideCompleted` boolean argument with a more generic object `opts` argument, which now accepts 
      `overrideCompleted`, `overrideUnstarted` and `reverseAttempt` properties. For backward compatibility, any boolean 
      `opts` argument will be treated as a legacy `overrideCompleted` argument
  - Changes to `timeoutAs` method:
    - Replaced 3rd `overrideCompleted` boolean argument with a more generic object `opts` argument, which now accepts 
      `overrideCompleted`, `overrideUnstarted` and `reverseAttempt` properties. For backward compatibility, any boolean 
      `opts` argument will be treated as a legacy `overrideCompleted` argument
  - Changes to `timeout` and `timeoutAs` methods:
    - When the new `overrideUnstarted` option is set to:
      - `false` (the default), then the timeout will actually be suppressed if the task is still unstarted; or
      - `true`, then the timeout will be applied (even if the task is still unstarted.
    - When the new `reverseAttempt` option is set to:
      - `true`, then the timeout will "reverse the attempt" by decrementing the number of attempts, but ONLY if the task 
        was started; or
      - `false` (the default), then the timeout will leave the number of attempts as is
  - Added new `taskDefSettings` arguments to the `createSubTask` & `getOrCreateSubTask` methods between their `execute` 
    & `opts` arguments
- Changes to `task-defs` module:
  - Added new optional `settings` argument to `TaskDef` constructor & to static `defineTask` & `defineSubTasks` methods 
    to enable configuration of a custom `describeItem` function to be used for logging
  - Added new `describeItem` property to `TaskDef` class
- Updated `core-functions` dependency to version 3.0.2

### 5.0.2
- Updates to `README.md`

### 5.0.1
- Changes to `task-utils` module:
  - Added new `configureTaskFactory`, `isTaskFactoryConfigured`, `constructTaskFactory` & `getDefaultTaskFactoryOpts`
    functions
  - Re-exported `FrozenError` & `FinalisedError` for convenience

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