'use strict';

/**
 * Utilities for accessing, setting, resetting and updating the status, number of attempts, result and other properties
 * of tasks on an object, which are used to track task progress.
 * @module task-utils/tasks
 * @author Byron du Preez
 */
module.exports = {
  getOrCreateTask: getOrCreateTask,
  getTaskStatus: getTaskStatus,
  getTaskResult: getTaskResult,
  getTaskProperty: getTaskProperty,
  getTaskAttempts: getTaskAttempts,
  incrementTaskAttempts: incrementTaskAttempts,
  setTaskStatus: setTaskStatus,
  setTaskStatusDetails: setTaskStatusDetails,
  setTaskResult: setTaskResult,
  setTaskProperty: setTaskProperty,
  setTaskStatusIfNecessary: setTaskStatusIfNecessary,
  setTaskStatusAndResultIfNecessary: setTaskStatusAndResultIfNecessary,
  resetTaskStatusAndResultIfNotComplete: resetTaskStatusAndResultIfNotComplete,
  ONLY_FOR_TESTING: {
    getTask: getTask
  }
};

//const strings = require('core-functions/strings');

const statuses = require('./statuses');

// Status singletons
const INCOMPLETE = statuses.INCOMPLETE;
const SUCCEEDED = statuses.SUCCEEDED;
// Status classes
//const Status = statuses.Status;
const Incomplete = statuses.Incomplete;
//const Success = statuses.Success;
//const Failure = statuses.Failure;
//const Succeeded = statuses.Succeeded;
const Failed = statuses.Failed;
const toStatus = statuses.toStatus;
// Checks against the status' completed flag
const isStatusCompleted = statuses.isStatusCompleted;
// Checks against the type of the status
const isIncompleteStatus = statuses.isIncompleteStatus;
//const isFailureStatus = statuses.isFailureStatus;
//const isSuccessStatus = statuses.isSuccessStatus;

/**
 * Gets the named task (if any) on the named tasks on the given source object; otherwise returns undefined.
 * @param {Object} source the source object from which to get the named tasks
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task object property on the named tasks
 * @return {Object|undefined} the task (if any) or undefined (if none)
 */
function getTask(source, tasksName, taskName) {
  const tasks = source[tasksName];
  if (!tasks) return undefined;
  return tasks[taskName];
}

/**
 * Gets the named task (if any) or creates the named task (if none) on the named tasks on the given target object.
 * @param {Object} target the target object from which to get the task or on which to create the task
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task object property on the named tasks
 * @return {Object} the task
 */
function getOrCreateTask(target, tasksName, taskName) {
  if (!target[tasksName]) target[tasksName] = {};
  const tasks = target[tasksName];
  if (!tasks[taskName]) tasks[taskName] = {};
  return tasks[taskName];
}

/**
 * Gets the status of the named task on the named tasks on the given source object (if found) or undefined (if not
 * found).
 * @param {Object} source the source object from which to get the named task's status
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task object property on the named tasks
 * @return {Status|undefined} the status of the named task (if found) or undefined (if not found)
 */
function getTaskStatus(source, tasksName, taskName) {
  const task = getTask(source, tasksName, taskName);
  return task ? task.status : undefined;
}

/**
 * Gets the result of the named task on the named tasks on the given source object (if found) or undefined (if not
 * found).
 * @param {Object} source the source object from which to get the named task's result
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task object property on the named tasks
 * @return {*|undefined} the result of the named task (if found) or undefined (if not found)
 */
function getTaskResult(source, tasksName, taskName) {
  const task = getTask(source, tasksName, taskName);
  return task ? task.result : undefined;
}

/**
 * Gets the value of the named property on the named task on the named tasks on the given source object (if found) or
 * undefined (if not found).
 * @param {Object} source the source object from which to get the named task property value
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task object property on the named tasks
 * @param {string} propertyName the name of the property on the named task
 * @return {*|undefined} the value of the named task property (if found) or undefined (if not found)
 */

function getTaskProperty(source, tasksName, taskName, propertyName) {
  const task = getTask(source, tasksName, taskName);
  return task ? task[propertyName] : undefined;
}

/**
 * Gets the number of attempts at the named task on the named tasks on the given source object (if found) or zero (if
 * not found).
 * @param {Object} source the source object from which to get the named task's number of attempts
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task object property on the named tasks
 * @return {number} the number of attempts at the named task (if found) or zero (if not found)
 */
function getTaskAttempts(source, tasksName, taskName) {
  const task = getTask(source, tasksName, taskName);
  return task && task.attempts ? task.attempts : 0;
}

/**
 * Increments the number of attempts at the named task on the named tasks on the given target object.
 * @param {Object} target the target object on which to increment the number of attempts at the named task
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task object property on the named tasks
 * @return {Object} the updated target object
 */
function incrementTaskAttempts(target, tasksName, taskName) {
  const task = getOrCreateTask(target, tasksName, taskName);
  const previousAttempts = task.attempts ? task.attempts : 0;
  task.attempts = previousAttempts + 1;
  return target;
}

/**
 * Sets the status on the named task on the named tasks on the given target object to the given status; and, if the
 * given incrementAttempts is true (and this is the first update of the task's status in a given run), then also
 * increments the number of attempts on the named task; and finally returns the updated target object.
 *
 * If the named tasks object does not yet exist on the target object, it will be added to the target as a new object
 * property (named with the given tasksName).
 *
 * Similarly, if the named task object does not yet exist on the named tasks object, it will be added to the named tasks
 * object as a new object property (named with the given taskName).
 *
 * @param {Object} target the target object to update with the named task status
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task object property on the named tasks to update
 * @param {Status} status the status to set on the named task's status property
 * @param {boolean} incrementAttempts whether or not to also increment the named task's number of attempts
 * @return {Object} the updated target object
 */
function setTaskStatus(target, tasksName, taskName, status, incrementAttempts) {
  const task = getOrCreateTask(target, tasksName, taskName);

  const oldStatus = task.status;

  // Set the task's status to the given status
  task.status = status;

  // Only increment the number of attempts if requested and if the old task status is undefined or Incomplete (i.e.
  // only increment a task's number of attempts ONCE during any particular run)
  if (incrementAttempts && (!oldStatus || isIncompleteStatus(oldStatus))) { //TODO check if we want this
    incrementTaskAttempts(target, tasksName, taskName);
  }
  return target;
}

/**
 * Sets the status on the named task on the named tasks on the given target object to a new status derived from the
 * given status details (see toStatus) and, if the given incrementAttempts is true, then also increments the number of
 * attempts on the named task and finally returns the updated target object.
 *
 * If the named tasks object does not yet exist on the target object, it will be added to the target as a new object
 * property (named with the given tasksName).
 *
 * Similarly, if the named task object does not yet exist on the named tasks object, it will be added to the named tasks
 * object as a new object property (named with the given taskName).
 *
 * @param {Object} target the target object to update with the named task status
 * @param {string} tasksName the name of the tasks object property to update on the target object
 * @param {string} taskName the name of the task object property on the named tasks to update with the given status details
 * @param {string} statusCode the descriptive code of the status
 * @param {boolean} completed whether or not to consider the task as completed or not
 * @param {Error|undefined} error an optional error
 * @param {boolean} incrementAttempts whether or not to also increment the named task's number of attempts
 * @return {Object} the given target object updated with the given task status details
 */
function setTaskStatusDetails(target, tasksName, taskName, statusCode, completed, error, incrementAttempts) {
  return setTaskStatus(target, tasksName, taskName, toStatus(statusCode, completed, error), incrementAttempts);
}


/**
 * Sets the result on the named task on the named tasks on the given target object to the given result and then returns
 * the updated target object.
 *
 * If the named tasks object does not yet exist on the target object, it will be added to the target as a new object
 * property (named with the given tasksName).
 *
 * Similarly, if the named task object does not yet exist on the named tasks object, it will be added to the named tasks
 * object as a new object property (named with the given taskName).
 *
 * @param {Object} target the target object to update with the named task result
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task object property on the named tasks to update
 * @param {*} result the result to set on the named task's result property
 * @return {Object} the updated target object
 */
function setTaskResult(target, tasksName, taskName, result) {
  const task = getOrCreateTask(target, tasksName, taskName);
  // ONLY add the task result if the result is NOT the target itself
  if (result !== target) task.result = result;
  return target;
}

// function updateTaskPropertyValue(target, tasksName, taskName, propertyName, value) {
//   const task = getOrCreateTask(target, tasksName, taskName);
//   task[propertyName] = value;
//   return task;
// }

/**
 * Sets the named property on the named task on the named tasks on the given target object to the given value and
 * returns the updated target object.
 *
 * If the named tasks object does not yet exist on the target object, it will be added to the target as a new object
 * property (named with the given tasksName).
 *
 * Similarly, if the named task object does not yet exist on the named tasks object, it will be added to the named tasks
 * object as a new object property (named with the given taskName).
 *
 * @param {Object} target the target object to update
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task object property on the named tasks
 * @param {string} propertyName the name of the property to update on the named task
 * @param {*} value the value to set on the named property
 * @return {Object} the updated target object
 */
function setTaskProperty(target, tasksName, taskName, propertyName, value) {
  const task = getOrCreateTask(target, tasksName, taskName);
  task[propertyName] = value;
  return target;
}

/**
 * If the given target object's named task has an undefined or INCOMPLETE status OR (has a completed status AND the
 * given status is NOT completed) OR (the given status is completed), then sets the named task's status to the given
 * status and returns the updated target; otherwise simply returns the given target.
 *
 * The first and second conditions above (i.e. has an undefined or INCOMPLETE status) is the normal scenario, since a
 * task should start each run in an INCOMPLETE status and hence any new status must be able to override it.
 *
 * The third condition above (i.e. has a completed status AND the new status is NOT completed) allows a new failed
 * status to override an old completed status, but will NOT allow a new failed status to override an old failed status,
 * since we prefer to keep the old failure rather than the new failure.
 *
 * The fourth condition above (i.e. the given status is completed) allows a new completed status to override any old
 * status.
 *
 * @param {Object} target the target object on which to set the named task status if necessary
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task on the named tasks object
 * @param {Status} status the status to apply if necessary
 * @param {boolean} incrementAttempts whether or not to also increment the named task's number of attempts when the status is updated
 * @return {Object} the target object, which was updated (if the status was applied) or not (if the status was not applied)
 */
function setTaskStatusIfNecessary(target, tasksName, taskName, status, incrementAttempts) {
  const oldStatus = getTaskStatus(target, tasksName, taskName);

  const oldUndefinedOrIncomplete = !oldStatus || isIncompleteStatus(oldStatus);
  const oldCompletedAndNewNotCompleted = isStatusCompleted(oldStatus) && !isStatusCompleted(status);
  //const oldNotCompletedAndNewCompleted = !isStatusCompleted(oldStatus) && isStatusCompleted(status);

  if (oldUndefinedOrIncomplete || oldCompletedAndNewNotCompleted || isStatusCompleted(status)) {
    return setTaskStatus(target, tasksName, taskName, status, incrementAttempts);
  }
  return target;
}

/**
 * If the given target object's named task has an undefined OR INCOMPLETE status OR (has a completed status AND the
 * new status is NOT completed) OR the new status is completed, then sets the named task's status to the new status,
 * sets its result to the given result and returns the updated target; otherwise simply returns the given target.
 *
 * The first and second conditions above (i.e. has an undefined or INCOMPLETE status) is the normal scenario, since a
 * task should start each run in an INCOMPLETE status and hence any new status must be able to override it.
 *
 * The third condition above (i.e. has a completed status AND the new status is NOT completed) allows a new failed
 * status to override an old completed status, but will NOT allow a new failed status to override an old failed status,
 * since we prefer to keep the old failure rather than the new failure.
 *
 * The fourth condition above (i.e. the given status is completed) allows a new completed status to override any old
 * status.
 *
 * @param {Object} target the target object on which to set the named task status if necessary
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task on the named tasks object
 * @param {Status} status the status to apply if necessary
 * @param {*} result the result to apply if necessary
 * @param {boolean} incrementAttempts whether or not to also increment the named task's number of attempts when the status is updated
 * @return {Object} the target object, which was updated (if the status was applied) or not (if the status was not applied)
 */
function setTaskStatusAndResultIfNecessary(target, tasksName, taskName, status, incrementAttempts, result) {
  // First attempts to change the task status on the target to the given status
  setTaskStatusIfNecessary(target, tasksName, taskName, status, incrementAttempts);
  // Then sets the given task result on the target, but ONLY if the status was actually changed
  if (getTaskStatus(target, tasksName, taskName) === status) {
    setTaskResult(target, tasksName, taskName, result);
  }
}

/**
 * Resets the named task status on the given target to an INCOMPLETE status and sets the named task result on the given
 * target to undefined (if the named task status is defined and NOT completed yet and NOT already an instance of
 * Incomplete) or sets a new named task status of INCOMPLETE on the target object to create an expectation of a status
 * for the named task (if the named task status is undefined) or leaves the existing completed named task status and
 * result as is on the target.
 * @param {Object} target the target object from which to get the named task status
 * @param {string} tasksName the name of the tasks object property on the target object
 * @param {string} taskName the name of the task status to get or clear
 * @param {Object} context the context
 * @return {Object} the potentially updated target object
 */
function resetTaskStatusAndResultIfNotComplete(target, tasksName, taskName, context) {
  const taskStatus = getTaskStatus(target, tasksName, taskName);
  if (taskStatus) {
    // Check if the named task was already previously completed on the target, and if so return its completed status
    if (taskStatus.completed) {
      if (context.debug) console.log(`Found previously completed task (${taskName}) with status (${JSON.stringify(taskStatus)}) on target (${JSON.stringify(target)})`);
      return target;
    }
    if (isIncompleteStatus(taskStatus)) {
      // Since the named task status is already set to an Incomplete status instance, just clear the task result
      setTaskResult(target, tasksName, taskName, undefined);
      if (context.debug) console.log(`Skipping reset of already incomplete task (${taskName}) status (${JSON.stringify(taskStatus)}) on target (${JSON.stringify(target)})`);
      return target;
    }
    // Otherwise reset the previously failed named task status on the target to an INCOMPLETE status and clear the task result
    setTaskStatus(target, tasksName, taskName, INCOMPLETE, false);
    setTaskResult(target, tasksName, taskName, undefined);
    if (context.debug) console.log(`Reset previous task (${taskName}) status (${JSON.stringify(taskStatus)}) to (${JSON.stringify(INCOMPLETE)}) on target (${JSON.stringify(target)})`);
    return target;
  } else {
    // Since the named tasks status does not yet exist, set a new INCOMPLETE task status on the target (to set up the
    // expectation of a status for this task name) and clear the task result
    setTaskStatus(target, tasksName, taskName, INCOMPLETE, false);
    setTaskResult(target, tasksName, taskName, undefined);
    if (context.debug) console.log(`Set new task (${taskName}) status (${JSON.stringify(INCOMPLETE)}) on target (${JSON.stringify(target)})`);
    return target;
  }
}