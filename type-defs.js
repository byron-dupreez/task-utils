/**
 * @typedef {Object} TaskStateLike - a task state-like object.
 * @property {string} name - the name of the state
 * @property {StateType} type - the type of this state
 * @property {string|undefined} [error] - an optional error with which a task was failed, timed out or rejected
 * @property {string|undefined} [reason] - an optional reason given for rejecting a task
 */

/**
 * @typedef {Object} LegacyTaskStateLike - a legacy task state-like object.
 * @property {string} name - the name of the state
 * @property {boolean} completed - whether to consider a task with this state as completed or not
 * @property {boolean} timedOut - whether to consider a task with this state as timed out (or failed due to a timeout) or not
 * @property {string|undefined} [error] - an optional error with which a task was failed, timed out or rejected
 * @property {boolean} rejected - whether to consider a task with this state as rejected/abandoned/discarded or not
 * @property {string|undefined} [reason] - an optional reason given for rejecting a task
 */

/**
 * @typedef {TaskStateLike} TaskState - a TaskState instance that represents the state of a task or operation.
 */

/**
 * @typedef {CompletedState|Completed|Succeeded} AnyCompletedState - an instance of any of the CompletedState subclasses that represents a completed state of a task or operation.
 */

/**
 * @typedef {TimedOutState|TimedOut} AnyTimedOutState - an instance of any of the TimedOutState subclasses that represents a timed out state of a task or operation.
 */

/**
 * @typedef {FailedState|Failed} AnyFailedState - an instance of any of the FailedState subclasses that represents a failed state of a task or operation.
 */

/**
 * @typedef {RejectedState|Rejected|Discarded|Abandoned} AnyRejectedState - an instance of any of the RejectedState subclasses that represents a rejected state of a task or operation.
 */

/**
 * @typedef {TaskState|Unstarted|Started|AnyCompletedState|AnyTimedOutState|AnyFailedState|AnyRejectedState} AnyTaskState - an instance of any of the TaskState subclasses that represents the state of a task or operation.
 */

/**
 * @typedef {function(...args): string} DescribeItem - an optional function to use to extract a short description of the
 * current item/target/subject from the arguments passed to a task's execute function for logging purposes.
 * NB: The arguments of a `describeItem` function MUST match those of its corresponding `execute` function, since it
 * will be called with the same arguments within the generated `execute` wrapper function
 */

/**
 * @typedef {Object} TaskDefSettings - settings to use to configure a task definition (i.e. TaskDef instance)
 * @property {boolean|undefined} [skipAddToParent] - whether to skip adding the sub-task definition to its parent's list of sub-task definitions (if true) or not (if false) - defaults to false, i.e. adds to parent
 * @property {DescribeItem|undefined} [describeItem] - an optional function to use to extract a short description of the current item/target/subject from the arguments passed to a task's execute function for logging purposes
 */

/**
 * @typedef {Object} TaskDef - a task definition, which is used to construct tasks
 * @property {string} name - the name that will be assigned to any task created using this definition
 * @property {Function|undefined} [execute] - the optional function to be executed when any task created using this definition is executed
 * @property {TaskDef|undefined} [parent] - an optional parent task (or sub-task) definition
 * @property {boolean|undefined} [managed] - whether this defines non-executable, [externally] managed tasks OR executable, self-managed tasks (defaults to false, i.e. executable)
 * @property {boolean|undefined} [executable] - whether this defines executable, self-managed tasks or non-executable, [externally] managed tasks ("antonym" for `managed`)
 * @property {TaskDef[]} subTaskDefs - an array of zero or more executable and/or non-executable, managed sub-task definitions, which can be used to define executable and/or non-executable, managed sub-tasks
 * @property {DescribeItem|undefined} [describeItem] - an optional function to use to extract a short description of the current item/target/subject from the arguments passed to a task's execute function for logging purposes
 */

/**
 * @typedef {Object} TaskFactorySettings - settings to use to construct a task factory
 * @property {BasicLogger|console} logger - the logger or logger-like object to use for logging
 * @property {DescribeItem|undefined} [describeItem] - an optional default function to use to extract a short description of the current item/target/subject from the arguments passed to a task's execute function for logging purposes
 */

/**
 * @typedef {Object} TaskFactoryOptions - options to use to construct a task factory
 * @property {ReturnMode|undefined} [returnMode] - whether to generate task `execute` methods that only return a Promise
 * (if returnMode is PROMISE); or a `Success` or `Failure` outcome (if returnMode is SUCCESS_OR_FAILURE); or return or
 * throw normally (if returnMode is NORMAL or anything else)
 * @property {FlattenOpts} [donePromiseFlattenOpts] - optional `flatten` options to be used by generated task `execute` methods to flatten a result into a `donePromise`
 */

/**
 * @typedef {function(settings: TaskFactorySettings, options: TaskFactoryOptions): TaskFactory} CreateTaskFactory - a function to use to create a new TaskFactory instance (or custom subclass instance)
 */

/**
 * @typedef {TaskFactorySettings} TaskFactoryExtendedSettings - extended settings to use to construct & configure a task factory
 * @property {CreateTaskFactory|undefined} [createTaskFactory] - an optional function to use to create a new task factory (defaults to using `TaskFactory` constructor if undefined)
 */

/**
 * @typedef {Object} TaskFactory - represents a task factory, which is used to create Tasks and generate wrapper `execute` functions for Tasks
 * @property {BasicLogger|console} logger - the logger or logger-like object to use for logging
 * @property {ReturnMode} returnMode - whether to generate task `execute` methods that only return a Promise (if
 * returnMode is PROMISE); or a `Success` or `Failure` outcome (if returnMode is SUCCESS_OR_FAILURE); or return or throw
 * normally (if returnMode is NORMAL or anything else) - NB: ONLY used when a task's own `returnMode` property is undefined
 * @property {DescribeItem|undefined} [describeItem] - an optional default function to use to extract a short description of the current item/target/subject from the arguments passed to a task's execute function for logging purposes
 */

/**
 * @typedef {Object} TaskOpts - options to use to alter the behaviour of a Task's `execute` method
 * @property {ReturnMode|undefined} [returnMode] - whether the `execute` function of a task must only return a Promise
 * (if returnMode is PROMISE); or a `Success` or `Failure` outcome (if returnMode is SUCCESS_OR_FAILURE); or return or
 * throw normally (if returnMode is NORMAL); or let its task factory decide (if undefined)
 */

/**
 * @typedef {TaskOpts} ReviveTasksOpts - options to use to influence which tasks get created and how they get created during task revival/re-incarnation
 * @property {boolean|undefined} [onlyRecreateExisting] - whether to only recreate existing old tasks or to create new tasks for every active task definition (regardless of whether the task existed before or not)
 * @see {@link module:task-utils/task-utils.reviveTasks}
 * @see {@link module:task-utils/task-factory#reincarnateTasks}
 */

/**
 * @typedef {Object} TaskLike - a task-like object.
 * @property {string} name - the name of this task
 * @property {boolean|undefined} [managed] - whether this task is a non-executable, externally managed task or an executable task (defaults to executable)
 * @property {boolean|undefined} [executable] - legacy property ("antonym" for `managed`) - whether this task is an executable task or a non-executable, externally managed task
 * @property {TaskStateLike} state - tht state of the task
 * @property {number} attempts - the number of attempts at the task
 * @property {number|undefined} [total] - the total number of attempts at the task, which is never decremented by decrementAttempts
 * @property {number|undefined} [totalAttempts] - legacy property - the total number of attempts at the task (use `total` instead)
 * @property {string|undefined} [began] - the ISO date-time at which this task's last execution began (or undefined if not executed yet)
 * @property {number|undefined} [took] - the number of milliseconds that this task's last execution took (or undefined if not executed yet)
 * @property {string|undefined} [ended] - the ISO date-time at which this task's last execution ended (or undefined if not executed yet OR if redundant)
 * @property {TaskLike[]} subTasks - an array of zero or more sub-tasks of this task
 */

/**
 * A task or operation, which can be either an executable, self-managed task/sub-task or a non-executable, externally
 * managed sub-task based on the task definition from which it is constructed.
 *
 * An executable sub-task is a task that must be explicitly executed by calling its `execute` method from within its
 * parent task's `execute` method and that must partially or entirely manage its own state within its `execute` method.
 *
 * A non-executable, externally managed sub-task is a task that must be manually executed from and must have its state
 * managed entirely by its parent task's `execute` method and that is ONLY used to enable tracking of its state.
 *
 * @typedef {Object} Task - A task or operation
 * @property {string} name - the name of the task
 * @property {TaskDef} definition - the definition of this task, from which it was created
 * @property {boolean} [managed] - whether this task is a non-executable, externally managed task or an executable task (defaults to executable)
 * @property {boolean} [executable] - whether or not this task is executable ("antonym" for `managed`)
 * @property {Task|undefined} [parent] - an optional parent super-task, which can be a top-level task or sub-task
 * @property {TaskFactory} factory - the task factory to use to generate an `execute` method for this task and to create sub-tasks for this task
 * @property {Function|undefined} [execute] - the optional function to be executed when this task is executed
 * @property {Task[]} subTasks - an array of zero or more sub-tasks of this task
 * @property {Task[]} slaveTasks - an array of zero or more slave tasks of this task, which if present classify this task as a "master" task
 * @property {AnyTaskState} state - the state of the task
 * @property {number} attempts - the number of attempts at the task
 * @property {number} totalAttempts - the total number of attempts at the task, which is never decremented by decrementAttempts
 * @property {string|undefined} [began] - the ISO date-time at which this task's last execution began (or undefined if not executed yet)
 * @property {number|undefined} [took] - the number of milliseconds that this task's last execution took (or undefined if not executed yet)
 * @property {string|undefined} [ended] - the ISO date-time at which this task's last execution ended (or undefined if not executed yet)
 * @property {*|undefined} [result] - the result with which this task was completed (if any)
 * @property {Error|undefined} [error] - the error with which this task was failed, timed out or rejected (if any)
 * @property {boolean} frozen - whether this task has been frozen or not
 * @property {Success|Failure|undefined} [outcome] - the Success or Failure outcome of execution of this task (or undefined if not executed yet)
 * @property {Promise.<(Success|Failure)[]>|undefined} [donePromise] - a promise that will only resolve when every promise of this task's execution outcome resolves (or undefined if not executed yet)
 * @property {ReturnMode|undefined} [returnMode] - whether the `execute` function of this task must only return a Promise (if returnMode is PROMISE); or a `Success` or `Failure` outcome (if returnMode is SUCCESS_OR_FAILURE); or return or throw normally (if returnMode is NORMAL); or let its task factory decide (if undefined)
 * @property {boolean} unstarted - whether this task is in an unstarted state or not
 * @property {boolean} started - whether this task is in a started state or not
 * @property {boolean} incomplete - whether this task is in an incomplete state or not
 * @property {boolean} completed - whether this task is in a completed state or not
 * @property {boolean} timedOut - whether this task is in a timed out state or not
 * @property {boolean} rejected - whether this task is in a rejected state or not
 * @property {boolean} failed - whether this task is in a failed state or not
 * @property {boolean} finalised - whether this task is in a finalised state or not
 */

/**
 * @typedef {Object} TaskStateNames - The names of the task states that have fixed names (as well as some arbitrary names)
 * @property {string} Unstarted - the name used by the Unstarted singleton task state
 * @property {string} Started - the name used by the Started singleton task state
 * @property {string} Completed - the name used by the Completed singleton task state
 * @property {string} Succeeded - the name used by the Succeeded singleton task state
 * @property {string} TimedOut - the name used by the TimedOut task states
 * @property {string} Failed - the name used by the Failed task states
 * @property {string} Rejected - the name used by the Rejected task states
 * @property {string} Discarded - the name used by the Discarded task states
 * @property {string} Abandoned - the name used by the Abandoned task states
 *
 * @property {string} Skipped - an arbitrary name for a Skipped task state (potentially used as a completed or failed state)
 * @property {string} LogicFlawed - an arbitrary name for a LogicFlawed task state (potentially used as a rejected or failed state)
 * @property {string} FATAL - an arbitrary name for a FATAL task state (potentially used as a rejected or failed state)
 */

/**
 * @typedef {Object} TaskFactoryAware - an object configured with a task factory
 * @property {TaskFactory} taskFactory - the task factory to use to create Tasks
 */

/**
 * @typedef {Object} CompleteOpts - options to use to modify the behaviour of the complete, succeed and completeAs methods
 * @property {boolean|undefined} [overrideTimedOut] - whether the complete is allowed to override an existing timedOut state or not
 */

/**
 * @typedef {Object} TimeoutOpts - options to use to modify the behaviour of the timeout and timeoutAs methods
 * @property {boolean|undefined} [overrideCompleted] - whether the timeout is allowed to override an existing completed state or not
 * @property {boolean|undefined} [overrideUnstarted] - whether the timeout is allowed to override an existing unstarted state or not
 * @property {boolean|undefined} [reverseAttempt] - whether the timeout must reverse the prior increment of the task's number of attempts (if the task was started) or not
 */