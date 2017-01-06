/**
 * @typedef {Object} TaskDef
 * @property {string} name - the name that will be assigned to any task created using this definition
 * @property {Function|undefined} [execute] - the optional function to be executed when any task created using this
 * definition is started
 * @property {TaskDef|undefined} [parent] - an optional parent task (or sub-task) definition
 * @property {TaskDef[]} subTaskDefs - an array of zero or more executable and/or non-executable, internal sub-task
 * definitions, which can be used to define executable and/or non-executable, internal sub-tasks
 */

/**
 * @typedef {{name, state, attempts, subTasks}} TaskLike - Definition of a task-like object.
 * @property {string} name - the name of this task
 * @property {boolean} executable - whether or not this task is executable
 * @property {TaskStateLike} state - tht state of the task
 * @property {number} attempts - the number of attempts at the task
 * @property {string} lastExecutedAt - the ISO date-time at which the task was last executed (if executed)
 * @property {TaskLike[]} subTasks - an array of zero or more non-executable, internal subTasks of this task
 */

/**
 * A task or operation, which can be either an executable task, an executable sub-task or a non-executable, internal
 * sub-task based on the task definition from which it is constructed.
 *
 * An executable sub-task is a task that must be explicitly executed from within its parent task's execute function and
 * must partially or entirely manage its own state within its own execute function.
 *
 * A non-executable, internal sub-task is a task that must be manually executed and must have its state managed entirely
 * within its parent task's execute function and is ONLY used to enable tracking of its state.
 *
 * @typedef {Object} Task - A task or operation
 * @property {string} name - the name of the task
 * @property {TaskDef} definition - the definition of this task, from which it was created
 * @property {boolean} executable - whether or not this task is executable
 * @property {Function|undefined} [execute] - the optional function to be executed when this task is started
 * @property {Task|undefined} [parent] - an optional parent super-task, which can be a top-level task or sub-task
 * @property {Task[]} subTasks - an array of zero or more non-executable, internal subTasks, which MUST be managed internally by their top-level parent task's execute function
 * @property {TaskState} state - tht state of the task
 * @property {number} attempts - the number of attempts at the task
 * @property {string} lastExecutedAt - the ISO date-time at which the task was last executed (if executed)
 * @property {*} [result] - the result of the task (if any)
 */
