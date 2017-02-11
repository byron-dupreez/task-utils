/**
 * @typedef {Object} TaskStateLike - a task state-like object.
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
 * @typedef {Object} TaskDef - a task definition, which is used to construct tasks
 * @property {string} name - the name that will be assigned to any task created using this definition
 * @property {Function|undefined} [execute] - the optional function to be executed when any task created using this definition is executed
 * @property {TaskDef|undefined} [parent] - an optional parent task (or sub-task) definition
 * @property {TaskDef[]} subTaskDefs - an array of zero or more executable and/or non-executable, internal sub-task definitions, which can be used to define executable and/or non-executable, internal sub-tasks
 */

/**
 * @typedef {Object} TaskFactory - represents a task factory, which is used to create Tasks and generate wrapper `execute` functions for Tasks
 * @property {BasicLogger|console} logger - the logger or logger-like object to use for logging
 * @property {boolean} returnSuccessOrFailure - whether to generate task `execute` functions that ONLY return `Success`
 * or `Failure` outcomes (if true); or return or throw normally (if false) - NB: ONLY used when a task's own
 * `returnSuccessOrFailure` property is undefined
 */

/**
 * @typedef {Object} TaskOpts - options to use to alter the behaviour of a Task
 * @property {boolean|undefined} [returnSuccessOrFailure] - whether the `execute` function of a task must only return a
 * `Success` or `Failure` outcome (if true); or return or throw normally (if false); or let its task factory decide
 * (if undefined)
 */

/**
 * @typedef {Object} TaskLike - a task-like object.
 * @property {string} name - the name of this task
 * @property {boolean} executable - whether or not this task is executable
 * @property {TaskStateLike} state - tht state of the task
 * @property {number} attempts - the number of attempts at the task
 * @property {number} totalAttempts - the total number of attempts at the task, which is never decremented by decrementAttempts
 * @property {string} lastExecutedAt - the ISO date-time at which the task was last executed (if executed)
 * @property {TaskLike[]} subTasks - an array of zero or more non-executable, internal subTasks of this task
 */

/**
 * A task or operation, which can be either an executable task, an executable sub-task or a non-executable, internal
 * sub-task based on the task definition from which it is constructed.
 *
 * An executable sub-task is a task that must be explicitly executed from within its parent task's `execute` method and
 * must partially or entirely manage its own state within its own `execute` method.
 *
 * A non-executable, internal sub-task is a task that must be manually executed from within its parent task's `execute`
 * method and must have its state managed entirely within its parent task's `execute` method and is ONLY used to enable
 * tracking of its state.
 *
 * @typedef {Object} Task - A task or operation
 * @property {string} name - the name of the task
 * @property {TaskDef} definition - the definition of this task, from which it was created
 * @property {boolean} executable - whether or not this task is executable
 * @property {Task|undefined} [parent] - an optional parent super-task, which can be a top-level task or sub-task
 * @property {TaskFactory} factory - the task factory to use to generate an `execute` method for this task and to create sub-tasks for this task
 * @property {Function|undefined} [execute] - the optional function to be executed when this task is executed
 * @property {Task[]} subTasks - an array of zero or more sub-tasks of this task
 * @property {Task[]} slaveTasks - an array of zero or more slave tasks of this task, which if present classify this task as a "master" task
 * @property {AnyTaskState} state - the state of the task
 * @property {number} attempts - the number of attempts at the task
 * @property {number} totalAttempts - the total number of attempts at the task, which is never decremented by decrementAttempts
 * @property {string} lastExecutedAt - the ISO date-time at which the task was last executed (if executed)
 * @property {*|undefined} [result] - the result with which this task was completed (if any)
 * @property {Error|undefined} [error] - the error with which this task was failed, timed out or rejected (if any)
 * @property {boolean} frozen - whether this task has been frozen or not
 * @property {Success|Failure|undefined} [outcome] - the Success or Failure outcome of execution of this task (or undefined if not executed yet)
 * @property {Promise.<(Success|Failure)[]>|undefined} [donePromise] - a promise that will only resolve when every promise of this task's execution outcome resolves (or undefined if not executed yet)
 * @property {boolean|undefined} [returnSuccessOrFailure] - whether the `execute` function of this task must only return a `Success` or `Failure` outcome (if true); or return or throw normally (if false); or let its task execute factory decide (if undefined)
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