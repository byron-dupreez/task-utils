'use strict';

/**
 * Unit tests for testing the behaviour of the wrapped execute function invoked when a Task is executed with a
 * TaskFactory configured to return the value returned by the execute function or rethrow any error it threw.
 * @author Byron du Preez
 */

const test = require("tape");

// The test subjects
const Task = require('../tasks');
const TaskFactory = require('../task-factory');

const core = require('../core');
const StateType = core.StateType;
const ReturnMode = core.ReturnMode;
const FrozenError = core.FrozenError;
const FinalisedError = core.FinalisedError;

const TaskDef = require('../task-defs');
const states = require('../task-states');
const TaskState = states.TaskState;

const taskFactorySettings = {logger: console, describeItem: genDescribeItem(10)};
const taskFactory = new TaskFactory(taskFactorySettings, {returnMode: ReturnMode.NORMAL});

const Strings = require('core-functions/strings');
const stringify = Strings.stringify;
const isNotBlank = Strings.isNotBlank;

const Action = {
  COMPLETE: 'COMPLETE',
  SUCCEED: 'SUCCEED',
  REJECT: 'REJECT',
  FAIL: 'FAIL',
  NONE: 'NONE'
};

function genDescribeItem(maxArgLength) {
  // An arbitrary describeItem function
  function describeItem() {
    const n = arguments.length;
    const args = new Array(n);
    for (let i = 0; i < n; ++i) {
      const arg = arguments[i];
      const isObject = arg && typeof arg === 'object';
      const isString = typeof arg === 'string';
      const s = JSON.stringify(arg);
      const suffix = s && s.length > maxArgLength ? ' ...' + (isObject ? '}' : isString ? '"' : '') : '';
      args[i] = s ? s.length > 0 && maxArgLength > 0 ? s.substring(0, maxArgLength) + suffix : s : `${s}`;
    }
    return n > 0 ? `Args (${args.join(", ")})` : '';
  }

  return describeItem;
}

/**
 * Creates a simple task.
 * @param {string} name
 * @param {Function} executeFn
 * @param {TaskDefSettings} taskDefSettings
 * @param {TaskFactory|undefined} [factory]
 * @param {TaskOpts|undefined} [opts]
 * @returns {Task}
 */
function createSimpleTask(name, executeFn, taskDefSettings, factory, opts) {
  factory = factory ? factory : taskFactory;
  return factory.createTask(TaskDef.defineTask(`Task ${name}`, executeFn, taskDefSettings), opts);
}

function genFn(name, ms) {
  function fn(err, data) {
    console.log(`Entering ${name}`);
    return new Promise((res, rej) => {
      setTimeout(() => {
        if (err) {
          console.log(`Exiting ${name} with err (${err})`);
          return rej(err);
        } else {
          console.log(`Exiting ${name} with data (${data})`);
          return res(data);
        }
        //return err ? rej(err) : res(data)
      }, ms);
    });
  }

  return fn;
}

function genFnSync(name) {
  function fn(err, data) {
    console.log(`Entering ${name}`);
    if (err) {
      console.log(`Exiting ${name} with err (${err})`);
      throw err;
    }
    console.log(`Exiting ${name} with data (${data})`);
    return data;
  }

  return fn;
}

function executeFn(name, err, data, ms, action, internalErr, stateName) {
  console.log(`Entering ${name}`);
  const task = this;
  return new Promise((res, rej) => {
    setTimeout(() => {
      if (err) {
        internalErr = internalErr ? internalErr : err;
        updateTaskState(task, action, stateName, data, internalErr);
        console.log(`Exiting ${name} with err (${err})`);
        return rej(err);
      } else {
        updateTaskState(task, action, stateName, data, internalErr);
        console.log(`Exiting ${name} with data (${data})`);
        return res(data);
      }
      //return err ? rej(err) : res(data)
    }, ms);
  });
}

function updateTaskState(task, action, stateName, data, internalErr) {
  switch (action) {
    case Action.REJECT:
      if (isNotBlank(stateName))
        task.rejectAs(stateName, `Rejected bad task as ${stateName}`, internalErr);
      else
        task.reject('Rejected bad task', internalErr);
      break;

    case Action.FAIL:
      if (isNotBlank(stateName))
        task.failAs(stateName, internalErr);
      else
        task.fail(internalErr);
      break;

    case Action.COMPLETE:
      if (isNotBlank(stateName))
        task.completeAs(stateName, data);
      else
        task.complete(data);
      break;

    case Action.SUCCEED:
      if (isNotBlank(stateName))
        task.completeAs(stateName, data);
      else
        task.succeed(data);
      break;

    case Action.NONE:
      // Do not update task
      break;

    default:
      console.log(`Unexpected action (${action})`);
  }
}

// =====================================================================================================================
// Task execute functions wrapped & supplemented by TaskFactory
// =====================================================================================================================

test('Task execute returning 1 promise', t => {
  const ms = 10;
  const a = genFn('A', ms);

  const executeFn = () => {
    return a(null, 'A')
  };
  const task = createSimpleTask('A', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(executeResult instanceof Promise, `executeResult must be an instance of Promise`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.ok(task.outcome.isSuccess(), `${task.name} outcome must be Success`);
  t.ok(task.outcome.value instanceof Promise, `${task.name} outcome.value must be Promise`);
  t.equal(task.outcome.value, executeResult, `${task.name} outcome.value must be ${stringify(executeResult)}`);

  executeResult.then(
    result => {
      const expected = 'A';
      t.equal(result, expected, `${task.name} execute() result must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        doneResult => {
          t.equal(doneResult, expected, `${task.name} done result must be ${stringify(expected)}`);
          t.ok(task.completed, `${task.name} must be completed`);
          t.equal(task.state, TaskState.instances.Completed, `${task.name} state must be Completed`);
          t.equal(task.result, expected, `${task.name} result must be ${stringify(expected)}`);
          t.end();
        },
        err => t.end(err)
      );
    },
    err => t.end(err)
  );
});

test('Task execute returning chain of 3 promises', t => {
  const ms = 10;
  const a = genFn('A', ms);
  const b = genFn('B', ms);
  const c = genFn('C', ms);

  const executeFn = () => {
    return a(null, 'A').then(d => b(null, d + 'B').then(d => c(null, d + 'C')))
  };
  const task = createSimpleTask('ABC', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(executeResult instanceof Promise, `executeResult must be an instance of Promise`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.ok(task.outcome.isSuccess(), `${task.name} outcome must be Success`);
  t.ok(task.outcome.value instanceof Promise, `${task.name} outcome.value must be Promise`);
  t.equal(task.outcome.value, executeResult, `${task.name} outcome.value must be ${stringify(executeResult)}`);

  executeResult.then(
    result => {
      const expected = 'ABC';
      t.equal(result, expected, `${task.name} execute() result must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        doneResult => {
          t.equal(doneResult, expected, `${task.name} done result must be ${stringify(expected)}`);
          t.ok(task.completed, `${task.name} must be completed`);
          t.equal(task.state, TaskState.instances.Completed, `${task.name} state must be Completed`);
          t.equal(task.result, expected, `${task.name} result must be ${stringify(expected)}`);
          t.end();
        },
        err => t.end(err)
      );
    },
    err => t.end(err)
  );
});

test('Task execute returning a list of 3 promises', t => {
  const ms = 10;
  const a = genFn('A', ms);
  const b = genFn('B', ms);
  const c = genFn('C', ms);

  const executeFn = () => {
    return [a(null, 'A'), b(null, 'B'), c(null, 'C')];
  };
  const task = createSimpleTask('ABC', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(Array.isArray(executeResult), `executeResult must be an Array`);
  t.equal(executeResult.length, 3, `executeResult.length must be 3`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.ok(task.outcome.isSuccess(), `${task.name} outcome must be Success`);
  t.equal(task.outcome.value, executeResult, `${task.name} outcome.value must be ${stringify(executeResult)}`);
  t.ok(Array.isArray(task.outcome.value), `${task.name} outcome.value must be Array`);

  Promise.all(executeResult).then(
    result => {
      const expected = ['A', 'B', 'C'];
      t.deepEqual(result, expected, `${task.name} execute() result must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        doneResult => {
          t.deepEqual(doneResult, expected, `${task.name} doneResult must be ${stringify(expected)}`);
          // t.equal(doneResult.length, 3, `doneResult.length must be 3`);
          // t.ok(doneResult[0].isSuccess(), `${task.name} doneResult[0].isSuccess() must be true`);
          // t.ok(doneResult[1].isSuccess(), `${task.name} doneResult[1].isSuccess() must be true`);
          // t.ok(doneResult[2].isSuccess(), `${task.name} doneResult[2].isSuccess() must be true`);
          // t.equal(doneResult[0].value, expected[0], `${task.name} doneResult[0].value must be ${expected[0]}`);
          // t.equal(doneResult[1].value, expected[1], `${task.name} doneResult[1].value must be ${expected[1]}`);
          // t.equal(doneResult[2].value, expected[2], `${task.name} doneResult[2].value must be ${expected[2]}`);
          t.ok(task.completed, `${task.name} must be completed`);
          t.equal(task.state, TaskState.instances.Completed, `${task.name} state must be Completed`);
          t.equal(task.result, doneResult, `${task.name} result must be ${stringify(doneResult)}`);
          t.end();
        },
        err => t.end(err)
      );
    },
    err => t.end(err)
  );
});

test('Task execute returning 1 promise that rejects', t => {
  const ms = 10;
  const a = genFn('A', ms);
  const error = new Error("Boom1");
  error.extra = 'Extra info';

  const executeFn = () => {
    return a(error, null);
  };
  const task = createSimpleTask('A', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(executeResult instanceof Promise, `executeResult must be an instance of Promise`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.ok(task.outcome.isSuccess(), `${task.name} outcome must be Success`);
  t.ok(task.outcome.value instanceof Promise, `${task.name} outcome.value must be Promise`);
  t.equal(task.outcome.value, executeResult, `${task.name} outcome.value must be ${stringify(executeResult)}`);

  executeResult.then(
    result => {
      t.end(`${task.name} should NOT have resolved with result (${stringify(result)})`);
    },
    err => {
      const expected = error;
      t.equal(err, expected, `${task.name} execute() error must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        doneResult => {
          t.end(`${task.name} should NOT have resolved with done result (${stringify(doneResult)})`);
        },
        doneError => {
          t.equal(doneError, expected, `${task.name} doneError must be ${expected}`);
          t.ok(task.failed, `${task.name} must be failed`);
          t.equal(task.error, error, `${task.name} error must be ${stringify(expected)}`);
          t.equal(task.state.name, TaskState.names.Failed, `${task.name} state name must be ${TaskState.names.Failed}`);
          t.equal(task.state.error, error.toString(), `${task.name} state error must be ${stringify(expected.toString())}`);
          t.end();
        }
      );
    }
  );
});

test('Task execute throwing an error (Boom2)', t => {
  const ms = 10;
  const a = genFnSync('A', ms);
  const error = new Error("Boom2");
  error.extra = 'Extra info';

  const executeFn = () => {
    return a(error, null);
  };
  const task = createSimpleTask('A', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  try {
    const result = task.execute();
    t.end(`${task.name} should NOT have finished with result (${stringify(result)})`);

  } catch (err) {
    t.ok(task.started, `${task.name} must be started`);
    t.equal(task.attempts, 1, `${task.name} attempts must be 1`);
    t.equal(task.outcome.error, err, `${task.name} execution.error must be ${stringify(err)}`);

    const expected = error;
    t.equal(err, expected, `${task.name} execute() caught error must be ${stringify(expected)}`);
    t.ok(task.donePromise, `${task.name} has a done promise`);
    task.donePromise.then(
      doneResult => {
        t.end(`${task.name} should NOT have finished with done result (${stringify(doneResult)})`);
      },
      doneError => {
        t.equal(doneError, error, `${task.name} doneError must be ${error}`);
        t.ok(task.failed, `${task.name} must be failed`);
        t.equal(task.error, error, `${task.name} error must be ${stringify(expected)}`);
        t.equal(task.state.name, TaskState.names.Failed, `${task.name} state name must be ${TaskState.names.Failed}`);
        t.equal(task.state.error, error.toString(), `${task.name} state error must be ${stringify(expected.toString())}`);
        t.end();
      }
    );
  }
});

test('Task execute returning sync result', t => {
  const ms = 10;
  const a = genFnSync('A', ms);

  const executeFn = () => {
    return a(null, 'A')
  };
  const task = createSimpleTask('A', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(typeof executeResult === 'string', `executeResult must be a string`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.ok(task.outcome.isSuccess(), `${task.name} outcome must be Success`);
  t.equal(task.outcome.value, executeResult, `${task.name} outcome.value must be ${stringify(executeResult)}`);

  const expected = 'A';
  t.equal(executeResult, expected, `${task.name} execute() result must be ${stringify(expected)}`);
  t.ok(task.donePromise, `${task.name} has a done promise`);
  task.donePromise.then(
    doneResult => {
      t.equal(doneResult, expected, `${task.name} doneResult must be ${stringify(expected)}`);
      t.ok(task.completed, `${task.name} must be completed`);
      t.equal(task.state, TaskState.instances.Completed, `${task.name} state must be Completed`);
      t.equal(task.result, expected, `${task.name} result must be ${stringify(expected)}`);
      t.end();
    },
    err => t.end(err)
  );
});

test('Task execute returning a list of sync results', t => {
  const ms = 10;
  const a = genFnSync('A', ms);
  const b = genFnSync('B', ms);
  const c = genFnSync('C', ms);

  const executeFn = () => {
    return [a(null, 'A'), b(null, 'B'), c(null, 'C')]
  };
  const task = createSimpleTask('A', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(Array.isArray(executeResult), `executeResult must be an Array`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.ok(task.outcome.isSuccess(), `${task.name} outcome must be Success`);
  t.deepEqual(task.outcome.value, executeResult, `${task.name} outcome.value must be ${stringify(executeResult)}`);

  const result = executeResult;
  const expected = ['A', 'B', 'C'];
  t.deepEqual(executeResult, expected, `${task.name} execute() result must be ${expected}`);
  t.ok(task.donePromise, `${task.name} has a done promise`);
  task.donePromise.then(
    doneResult => {
      t.equal(doneResult.length, 3, `${task.name} doneResult.length must be 3`);
      t.deepEqual(doneResult, expected, `${task.name} doneResult must be ${stringify(expected)}`);
      // t.ok(doneResult[0].isSuccess(), `${task.name} doneResult[0].isSuccess() must be true`);
      // t.ok(doneResult[1].isSuccess(), `${task.name} doneResult[1].isSuccess() must be true`);
      // t.ok(doneResult[2].isSuccess(), `${task.name} doneResult[2].isSuccess() must be true`);
      // t.equal(doneResult[0].value, expected[0], `${task.name} doneResult[0].value must be ${expected[0]}`);
      // t.equal(doneResult[1].value, expected[1], `${task.name} doneResult[1].value must be ${expected[1]}`);
      // t.equal(doneResult[2].value, expected[2], `${task.name} doneResult[2].value must be ${expected[2]}`);
      t.ok(task.completed, `${task.name} must be completed`);
      t.equal(task.state, TaskState.instances.Completed, `${task.name} state must be Completed`);
      t.equal(task.result, doneResult, `${task.name} result must be ${stringify(doneResult)}`);
      t.end();
    },
    err => t.end(err)
  );
});

test('Task execute returning 1 promise that fulfills, but self-managed to Succeeded - original succeed "prevents" later complete', t => {
  const ms = 10;

  const task = createSimpleTask('A', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const stateName = TaskState.names.Succeeded;

  const executeResult = task.execute('A', null, 'A', ms, Action.SUCCEED, null, stateName);

  t.ok(executeResult instanceof Promise, `executeResult must be an instance of Promise`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.ok(task.outcome.isSuccess(), `${task.name} outcome must be Success`);
  t.equal(task.outcome.value, executeResult, `${task.name} outcome.value must be ${stringify(executeResult)}`);

  executeResult.then(
    result => {
      const expected = 'A';
      t.equal(result, expected, `${task.name} execute() result must be ${expected}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        doneResult => {
          t.equal(doneResult, expected, `${task.name} doneResult must be ${stringify(expected)}`);
          t.ok(task.completed, `${task.name} must be completed`);
          t.equal(task.state, TaskState.instances.Succeeded, `${task.name} state must be Succeeded`);
          t.equal(task.state.name, stateName, `${task.name} state name must be ${stateName}`);
          const expectedStateType = StateType.COMPLETED;
          t.equal(task.state.kind, expectedStateType, `${task.name} state kind must be ${expectedStateType}`);
          t.equal(task.stateType, expectedStateType, `${task.name} stateType must be ${expectedStateType}`);
          //t.equal(task.result, executeResult, `${task.name} result must be ${stringify(executeResult)}`);
          t.equal(task.result, expected, `${task.name} result must be ${stringify(expected)}`); // internal success set result
          t.end();
        },
        err => t.end(err)
      );
    },
    err => t.end(err)
  );
});

test('Task execute returning 1 promise that rejects, but self managed to Rejected - rejection overrides new failure', t => {
  const ms = 10;

  const error = new Error("Boom3");
  error.extra1 = 'Boom3 extra info';

  const internalError = new TypeError("Kaboom");
  error.extra2 = 'Kaboom extra info';

  const task = createSimpleTask('A', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const stateName = "ThrownAway"; // TaskState.names.Abandoned;

  const executeResult = task.execute('A', error, undefined, ms, Action.REJECT, internalError, stateName);

  t.ok(executeResult instanceof Promise, `executeResult must be an instance of Promise`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.ok(task.outcome.isSuccess(), `${task.name} outcome must be Success`);
  t.equal(task.outcome.value, executeResult, `${task.name} outcome.value must be ${stringify(executeResult)}`);

  executeResult.then(
    result => {
      t.end(`${task.name} should NOT have resolved with result (${stringify(result)})`);
    },
    err => {
      const expected = error;
      t.equal(err, expected, `${task.name} execute() error must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        doneResult => {
          t.end(`${task.name} should NOT have resolved with done result (${stringify(doneResult)})`);
        },
        doneError => {
          t.equal(doneError, error, `${task.name} doneError must be ${error}`);
          t.ok(task.rejected, `${task.name} must be rejected`);
          t.equal(task.error, internalError, `${task.name} error must be ${stringify(internalError)}`);
          t.equal(task.state.name, stateName, `${task.name} state name must be ${stateName}`);
          const expectedStateType = StateType.REJECTED;
          t.equal(task.state.kind, expectedStateType, `${task.name} state kind must be ${expectedStateType}`);
          t.equal(task.stateType, expectedStateType, `${task.name} stateType must be ${expectedStateType}`);
          t.equal(task.state.error, internalError.toString(), `${task.name} state error must be ${stringify(internalError.toString())}`);
          t.end();
        }
      );
    }
  );
});

test('Task execute returning 1 promise that rejects, but self managed to Failed - later failure doe NOT override original failure', t => {
  const ms = 10;

  const error = new Error("Boom4");
  error.extra1 = 'Boom4 extra info';

  const internalError = new TypeError("Kaboom");
  internalError.extra2 = 'Kaboom extra info';

  const task = createSimpleTask('A', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const stateName = "DatabaseError"; // TaskState.names.Failed;

  const executeResult = task.execute('A', error, undefined, ms, Action.FAIL, internalError, stateName);

  t.ok(executeResult instanceof Promise, `executeResult must be an instance of Promise`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.ok(task.outcome.isSuccess(), `${task.name} outcome must be Success`);
  t.equal(task.outcome.value, executeResult, `${task.name} outcome.value must be ${stringify(executeResult)}`);

  executeResult.then(
    result => {
      t.end(`${task.name} should NOT have resolved with result (${stringify(result)})`);
    },
    err => {
      const expected = error;
      t.equal(err, expected, `${task.name} execute() error must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        doneResult => {
          t.end(`${task.name} should NOT have resolved with done result (${stringify(doneResult)})`);
        },
        doneError => {
          t.equal(doneError, error, `${task.name} doneError must be ${error}`);
          t.ok(task.failed, `${task.name} must be failed`);
          t.equal(task.error, internalError, `${task.name} error must be ${stringify(internalError)}`);
          t.equal(task.state.name, stateName, `${task.name} state name must be ${stateName}`);
          const expectedStateType = StateType.FAILED;
          t.equal(task.state.kind, expectedStateType, `${task.name} state kind must be ${expectedStateType}`);
          t.equal(task.stateType, expectedStateType, `${task.name} stateType must be ${expectedStateType}`);
          t.equal(task.state.error, internalError.toString(), `${task.name} state error must be ${stringify(internalError.toString())}`);
          t.end();
        }
      );
    }
  );
});

test('Task execute returning 1 promise that rejects, but self managed to Succeeded - later failure overrides original success', t => {
  const ms = 10;

  const error = new Error("Boom5");
  error.extra1 = 'Boom5 extra info';

  const internalError = new TypeError("Kaboom");
  internalError.extra2 = 'Kaboom extra info';

  const task = createSimpleTask('A', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const stateName = TaskState.names.Succeeded;

  const executeResult = task.execute('A', error, undefined, ms, Action.SUCCEED, internalError, stateName);

  t.ok(executeResult instanceof Promise, `executeResult must be an instance of Promise`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.ok(task.outcome.isSuccess(), `${task.name} outcome must be Success`);
  t.equal(task.outcome.value, executeResult, `${task.name} outcome.value must be ${stringify(executeResult)}`);

  executeResult.then(
    result => {
      t.end(`${task.name} should NOT have resolved with result (${stringify(result)})`);
    },
    err => {
      const expected = error;
      t.equal(err, expected, `${task.name} execute() error must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        doneResult => {
          t.end(`${task.name} should NOT have resolved with done result (${stringify(doneResult)})`);
        },
        doneError => {
          t.equal(doneError, error, `${task.name} doneError must be ${error}`);
          t.ok(task.failed, `${task.name} must be failed`);
          t.equal(task.error, error, `${task.name} error must be ${stringify(error)}`);
          t.equal(task.state.name, TaskState.names.Failed, `${task.name} state name must be ${TaskState.names.Failed}`);
          t.equal(task.state.error, error.toString(), `${task.name} state error must be ${stringify(error.toString())}`);
          t.end();
        }
      );
    }
  );
});

test('Task execute returning 1 promise, but task gets frozen before start', t => {
  const ms = 10;
  const a = genFn('A', ms);

  const executeFn = () => {
    return a(null, 'A')
  };
  const task = createSimpleTask('A', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  // Simulate external freeze of task before it even executes
  task.freeze();
  t.ok(task.isFrozen(), `${task.name} must be frozen`);

  // Attempt to execute the task
  t.throws(() => task.execute(), FrozenError, `execute must throw FrozenError`);

  t.ok(task.isFrozen(), `${task.name} must be frozen`);

  // Freeze before auto-complete must leave the task in its frozen state (blocking any update of its state)
  t.ok(task.unstarted, `${task.name} must still be unstarted`); // since was frozen in unstarted state
  t.notOk(task.started, `${task.name} must NOT be started`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);
  t.notOk(task.outcome, `${task.name} outcome must be undefined`);
  t.notOk(task.donePromise, `${task.name} donePromise must be undefined`);

  t.end();
});

test('Task execute returning 1 promise, but task gets frozen during execute', t => {
  const ms = 10;
  const a = genFn('A', ms);

  const executeFn = () => {
    return a(null, 'A').then(r => {
      task.freeze(); // Simulate external freeze of task during execution
      return r;
    })
  };
  const task = createSimpleTask('A', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(executeResult instanceof Promise, `executeResult must be an instance of Promise`);

  t.notOk(task.isFrozen(), `${task.name} must NOT be frozen yet`);
  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.ok(task.outcome.isSuccess(), `${task.name} outcome must be Success`);
  t.equal(task.outcome.value, executeResult, `${task.name} outcome.value must be ${stringify(executeResult)}`);

  t.ok(task.donePromise, `${task.name} donePromise must be defined`);

  executeResult.then(
    result => {
      const expected = 'A';
      t.equal(result, expected, `${task.name} execute() result must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        doneResult => {
          t.ok(task.isFrozen(), `${task.name} must be frozen`);
          t.equal(doneResult, expected, `${task.name} doneResult must be ${stringify(expected)}`);

          // Freeze before auto-complete must leave the task in its frozen state (blocking any update of its state)
          t.notOk(task.completed, `${task.name} must NOT be completed`);
          t.ok(task.started, `${task.name} must still be started`); // was frozen in started state
          t.equal(task.state, TaskState.instances.Started, `${task.name} state must still be Started`);
          t.equal(task.result, undefined, `${task.name} result must be ${stringify(undefined)}`);
          t.end();
        },
        err => t.end(err)
      );
    },
    err => t.end(err)
  );
});

test('Task execute returning 1 promise, but task was already finalised before start', t => {
  const ms = 10;
  const a = genFn('A', ms);

  const executeFn = () => {
    return a(null, 'A')
  };
  const task = createSimpleTask('A', executeFn, undefined);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  // Simulate finalisation of task before it even executes
  task.start();
  task.incrementAttempts();
  task.succeed(42);

  t.equal(task.state, states.instances.Succeeded, `${task.name} state must be Succeeded`);
  t.ok(task.completed, `${task.name} must be completed`);
  t.ok(task.isFullyFinalised(), `${task.name} must be fully finalised`);
  t.equal(task.attempts, 2, `${task.name} attempts must be 2`);

  // Attempt to execute the task
  t.throws(() => task.execute(), FinalisedError, `execute must throw FinalisedError`);

  t.ok(task.isFullyFinalised(), `${task.name} must still be fully finalised`);

  // Finalised beforehand must leave the task in its original finalised state (blocking any update of its state)
  t.equal(task.state, states.instances.Succeeded, `${task.name} state must still be Succeeded`);
  t.ok(task.completed, `${task.name} must still be completed`);
  t.equal(task.result, 42, `${task.name} result must still be 42`);
  t.ok(task.isFullyFinalised(), `${task.name} must still be fully finalised`);
  t.equal(task.attempts, 2, `${task.name} attempts must still be 2`);
  t.notOk(task.outcome, `${task.name} outcome must be undefined`);
  t.notOk(task.donePromise, `${task.name} donePromise must be undefined`);

  t.end();
});