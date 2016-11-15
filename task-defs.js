'use strict';

/**
 * Classes and utilities for creating task definitions, which define new tasks or operations to be executed.
 * @module task-utils/task-defs
 * @author Byron du Preez
 */

const Strings = require('core-functions/strings');
const isString = Strings.isString;
const isBlank = Strings.isBlank;
const isNotBlank = Strings.isNotBlank;
//const trim = Strings.trim;
const stringify = Strings.stringify;

const Objects = require('core-functions/objects');

const Arrays = require('core-functions/arrays');
const isDistinct = Arrays.isDistinct;
const isArrayOfType = Arrays.isArrayOfType;

module.exports = {
  FOR_TESTING_ONLY: {
    ensureAllTaskDefsDistinct: ensureAllTaskDefsDistinct,
    areSubTaskNamesDistinct: areSubTaskNamesDistinct
  },
};

//======================================================================================================================
// TaskDef "class"
//======================================================================================================================

/**
 * A definition of a task or operation that defines a type of task to be executed and can be used to create tasks.
 * A task definition can be used to create either executable tasks (if parent is undefined and execute is defined) or
 * non-executable, internal subTasks (if parent is defined and execute is undefined).
 *
 * Rules:
 * - A top-level TaskDef, in a hierarchy of tasks and subTasks, must be an executable task definition, i.e. a
 *   non-executable, internal subTask definition can never be a top-level TaskDef.
 *
 * - A task definition (regardless of whether it is executable or non-executable) can only have non-executable, internal
 *   subTask definitions.
 *
 * - All tasks in a hierarchy of tasks and subTasks must be unique.
 *
 * - All of a task's direct subTask names must be unique.
 *
 * A non-executable, internal subTask is a task that must be executed and managed internally by its parent task's
 * execute function and is ONLY used to enable tracking of its state.
 *
 * @typedef {Object} TaskDef
 * @property {string} name - the name that will be assigned to any task created using this definition
 * @property {Function|undefined} [execute] - the optional function to be executed when any task created using this
 * definition is started
 * @property {TaskDef|undefined} [parent] - an optional parent task (or subTask) definition
 * @property {TaskDef[]} subTaskDefs - an array of zero or more non-executable, internal subTask definitions, which
 * can be used to define non-executable, internal subTasks that MUST be managed internally by their top-level parent
 * task's execute function
 */
class TaskDef {
  /**
   * Constructs an executable task definition, if the given parent is undefined and the given execute is a function;
   * or constructs a non-executable, internal subTask definition, if parent is defined and execute is undefined;
   * otherwise throws an error (i.e. parent and execute are mutually exclusive).
   *
   * If parent is specified, then this new task definition is assumed to be a non-executable, internal subTask
   * definition of the given parent task definition and the given execute function must be undefined.
   *
   * If parent is not specified, then this new task definition is assumed to be a top-level, executable task definition
   * and the given execute function must be defined and a valid function.
   *
   * @param {string} name - the mandatory name of the task
   * @param {Function|undefined} [execute] - the optional function to be executed when a task created using this
   * definition is started
   * @param {TaskDef|undefined} [parent] - an optional parent task definition
   * @throws {Error} an error if the requested task definition is invalid
   */
  constructor(name, execute, parent) {
    // Validate the given name
    // -----------------------------------------------------------------------------------------------------------------
    // Ensure name is a string and not blank
    if (!isString(name) || isBlank(name)) {
      throw new Error(`Cannot create a task definition with a ${!isString(name) ? "non-string" : "blank"} name (${stringify(name)})`);
    }
    const taskName = Strings.trim(Objects.valueOf(name));

    // Validate the given parent and the given execute function
    // -----------------------------------------------------------------------------------------------------------------
    if (parent) {
      // Creating a non-executable, internal subTask definition, so:
      // Ensure that the parent is a TaskDef itself
      if (!(parent instanceof TaskDef)) {
        throw new Error(`Cannot create a subTask definition (${taskName}) with a parent that is not a task (or subTask) definition`);
      }
      // Ensure that this internal subTask definition does not have an execute function, since subTask definitions
      // cannot be executable
      if (execute) {
        throw new Error(`Cannot create a subTask definition (${taskName}) with an execute function)`);
      }
      // Ensure the parent's subTask names will still be distinct if we include this new subTask's name
      if (!areSubTaskNamesDistinct(parent, taskName)) {
        throw new Error(`Cannot add a subTask definition (${taskName}) with a duplicate name to parent (${parent.name}) with existing subTask definitions ${Strings.stringify(parent.subTaskDefs.map(d => d.name))}`);
      }

    } else {
      // Creating an executable, top-level task definition, so:
      // Ensure that a top-level task definition (without a parent) does have an execute function, since a non-executable, top-
      // level task would be useless
      if (!execute) {
        throw new Error(`Cannot create a top-level task definition (${taskName}) without an execute function)`);
      }
      // Ensure that execute (if defined) is actually executable (i.e. a valid function)
      if (typeof execute !== 'function') {
        throw new Error(`Cannot create a top-level task definition (${taskName}) with an invalid execute function`);
      }
    }

    // Finalise the new task definition's parent and execute
    const taskParent = parent ? parent : undefined; // or null?
    const executable = !!execute;
    const taskExecute = executable ? execute : undefined;

    // Finally create each property as read-only (writable: false and configurable: false are defaults)
    // -----------------------------------------------------------------------------------------------------------------
    Object.defineProperty(this, 'name', {value: taskName, enumerable: true});
    Object.defineProperty(this, 'executable', {value: executable, enumerable: true});
    Object.defineProperty(this, 'execute', {value: taskExecute, enumerable: false});
    Object.defineProperty(this, 'subTaskDefs', {value: [], enumerable: true});

    // Ensure that the proposed combined hierarchy to be formed from this new task definition and its parent
    // will still be valid and will ONLY contain distinct task definitions
    // -----------------------------------------------------------------------------------------------------------------
    if (taskParent) {
      // NB: Must check this after adding subTasks, but before setting parent!
      ensureAllTaskDefsDistinct(taskParent, this);
    }

    // Link this new task definition to its parent (if any)
    // -----------------------------------------------------------------------------------------------------------------
    Object.defineProperty(this, 'parent', {value: taskParent, enumerable: false});
    if (taskParent) {
      taskParent.subTaskDefs.push(this);
    }
  }

  /**
   * Returns true if this defines executable tasks; false otherwise
   * @returns {boolean} true if executable; false otherwise
   */
  isExecutable() {
    return this.executable;
  }

  /**
   * Returns true if this defines non-executable (i.e. internal) tasks; false otherwise
   * @returns {boolean} true if non-executable; false otherwise
   */
  isNotExecutable() {
    return !this.executable;
  }

  /**
   * Returns true if this defines internal (i.e. non-executable) tasks; false otherwise
   * @alias {@linkcode isNotExecutable}
   * @returns {boolean} true if internal; false otherwise
   */
  isInternal() {
    return !this.executable;
  }

  /**
   * Creates and adds a single non-executable, internal subTask definition with the given name to this task definition.
   * @param {string} subTaskName - the name of the new non-executable, internal subTask definition
   * @throws {Error} an error if the given name is blank or not a string or not distinct
   */
  defineSubTask(subTaskName) {
    if (!isString(subTaskName) || isBlank(subTaskName)) {
      throw new Error(`Cannot create a subTask definition with a ${!isString(subTaskName) ? "non-string" : "blank"} name (${stringify(subTaskName)})`);
    }
    const newName = Objects.valueOf(subTaskName).trim();
    // Ensure this task definition's subTask names will still be distinct if we include the new subTask's name
    if (!areSubTaskNamesDistinct(this, newName)) {
      throw new Error(`Cannot add subTask definition (${newName}) with a duplicate name to task definition (${this.name}) with existing subTask definitions ${Strings.stringify(this.subTaskDefs.map(d => d.name))}`);
    }
    // Create and add the new subTask definition to this task definition's list of subTask definitions
    return new TaskDef(newName, undefined, this);
  }

  /**
   * Creates and adds multiple new non-executable, internal subTask definitions with the given names to this task
   * definition.
   * @param {string[]} subTaskNames - the names of the new non-executable, internal subTask definitions
   * @returns {TaskDef[]} an array of new subTask definitions (one for each of the given names)
   */
  defineSubTasks(subTaskNames) {
    if (!isArrayOfType(subTaskNames, "string")) {
      throw new Error(`Cannot create subTask definitions with non-string names ${stringify(subTaskNames)}`);
    }
    if (subTaskNames.length > 0) {
      if (!subTaskNames.every(name => isNotBlank(name))) {
        throw new Error(`Cannot create subTask definitions with blank names ${stringify(subTaskNames)}`);
      }
      const newNames = subTaskNames.map(n => Objects.valueOf(n).trim());
      // Ensure this task definition's subTask names will still be distinct if we include the new subTask names
      if (!areSubTaskNamesDistinct(this, newNames)) {
        throw new Error(`Cannot add subTask definitions ${stringify(newNames)} with duplicate names to task definition (${this.name}) with existing subTask definitions ${Strings.stringify(this.subTaskDefs.map(d => d.name))}`);
      }
      // Create and add the new subTask definitions to this task definition's list of subTask definitions
      return newNames.map(name => new TaskDef(name, undefined, this));
    }
    return [];
  }

}

// Export the TaskDef "class" / constructor function as well
module.exports.TaskDef = TaskDef;

//======================================================================================================================
// Static Task methods
//======================================================================================================================

/**
 * Creates a new top-level, executable task definition to be used for creating executable tasks. Both the given name
 * and execute function MUST be correctly defined; otherwise an appropriate error will be thrown.
 *
 * As soon as you have defined your top-level task, you can start adding subTask definitions to it (if necessary) using
 * {@linkcode TaskDef#defineSubTask} and/or {@linkcode TaskDef#defineSubTasks}, which return the newly created subTask
 * definition(s).
 *
 * If any of your new subTask definitions also need to have subTask definitions of their own, then simply use exactly
 * the same procedure to add "sub-subTask" definitions to your subTask definition.
 *
 * @param {string} taskName - the name of the task
 * @param {Function} execute - the function to be executed when a task created using this definition is started
 * @throws {Error} if taskName or execute are invalid
 * @returns {TaskDef} a new executable task definition.
 */
function defineTask(taskName, execute) {
  return new TaskDef(taskName, execute, undefined);
}

// Add defineTask function as a static method on TaskDef (for convenience)
if (!TaskDef.defineTask) {
  TaskDef.defineTask = defineTask;
}

/**
 * Cautiously attempts to get the root task definition for the given task definition by traversing up its task
 * definition hierarchy using the parent links, until it finds the root (i.e. a parent task definition with no parent).
 * During this traversal, if any task definition is recursively found to be a parent of itself, an error will be thrown.
 *
 * @param {TaskDef} taskDef - any task definition in the task definition hierarchy from which to start
 * @throws {Error} if any task definition is recursively a parent of itself
 * @returns {TaskDef} the root task definition
 */
function getRootTaskDef(taskDef) {
  if (!taskDef || !(taskDef instanceof Object)) {
    return undefined;
  }

  function loop(def, history) {
    const parent = def.parent;
    if (!parent) {
      return def;
    }
    if (history.indexOf(def) !== -1) {
      // We have an infinite loop, since a previously visited task is recursively a parent of itself!
      throw new Error(`Task hierarchy is not a valid Directed Acyclic Graph, since task definition (${def.name}) is recursively a parent of itself!`)
    }
    history.push(def);
    return loop(parent, history);
  }

  return loop(taskDef, []);
}

// Add getRootTaskDef function as a static method on TaskDef (for convenience)
if (!TaskDef.getRootTaskDef) {
  TaskDef.getRootTaskDef = getRootTaskDef;
}

//======================================================================================================================
// Exported internal functions - not meant to be part of the public API, but exposed for testing purposes
//======================================================================================================================

/**
 * Ensures that the task definition hierarchies of both the given proposed task definition and of the given parent task
 * definition (if any) are both valid and could be safely combined into a single valid hierarchy; and, if not, throws an
 * error.
 *
 * A valid hierarchy must only contain distinct task definitions (i.e. every task definition can only appear once in its
 * hierarchy). This requirement ensures that a hierarchy is a Directed Acyclic Graph and avoids infinite loops.
 *
 * NB: The proposed task definition MUST NOT be linked to the given parent BEFORE calling this function (otherwise
 * this function will always throw an error) and MUST only be subsequently linked to the given parent if this function
 * does NOT throw an error.
 *
 * @param {TaskDef|undefined} [parent] - an optional parent task (or subTask) definition (if any), which identifies the
 * first hierarchy to check and to which the proposed task definition is intended to be linked
 * @param {TaskDef|undefined} proposedTaskDef - a optional proposed task definition, which identifies the second
 * hierarchy to check
 * @throws {Error} if any task definition appears more than once in either hierarchy or in the proposed combination of
 * both hierarchies
 */
function ensureAllTaskDefsDistinct(parent, proposedTaskDef) {
  // First find the root of the parent's task hierarchy
  const parentRoot = parent ? getRootTaskDef(parent) : undefined;
  // Next find the root of the proposed task definition's task hierarchy
  const proposedTaskDefRoot = proposedTaskDef ? getRootTaskDef(proposedTaskDef) : undefined;

  function loop(taskDef, history) {
    if (!taskDef) {
      return;
    }
    // Ensure that this definition does not appear more than once in the hierarchy
    if (history.indexOf(taskDef) !== -1) {
      // We have a problem with this task hierarchy, since a previously visited task definition appears more than once in the hierarchy!
      throw new Error(`Task hierarchy is not a valid Directed Acyclic Graph, since task definition (${taskDef.name}) appears more than once in the hierarchy!`)
    }
    // Remember that we have seen this one
    history.push(taskDef);

    // Now check all of its subTask definitions recursively too
    const subTaskDefs = taskDef.subTaskDefs;
    for (let i = 0; i < subTaskDefs.length; ++i) {
      loop(subTaskDefs[i], history);
    }
  }

  const history = [];

  // Next loop from the parent's root down through all of its subTask definitions recursively, ensuring that there is no
  // duplication of any task definition in the parent's hierarchy
  loop(parentRoot, history);

  // Finally loop from the proposed task definition's root down through all of its subTask definitions recursively,
  // ensuring that there is no duplication of any task definition in either hierarchy
  loop(proposedTaskDefRoot, history);
}

/**
 * Returns true if the proposed subTask names together with the given parent task definition's subTask names are all
 * still distinct; otherwise returns false.
 * @param parent
 * @param {string|string[]} proposedNames - the name or names of the proposed subTask definitions to be checked
 */
function areSubTaskNamesDistinct(parent, proposedNames) {
  const oldNames = parent ? parent.subTaskDefs.map(d => d.name) : [];
  const newNames = oldNames.concat(proposedNames);
  return isDistinct(newNames);
}


