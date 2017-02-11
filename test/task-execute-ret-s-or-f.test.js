'use strict';

/**
 * Unit tests for testing the behaviour of the wrapped execute function invoked when a Task is executed with a
 * TaskFactory configured to only return Success or Failure outcomes.
 * @author Byron du Preez
 */

const test = require("tape");

// The test subjects
const Task = require('../tasks');
const TaskFactory = require('../task-factory');

const TaskDef = require('../task-defs');
const states = require('../task-states');
const TaskState = states.TaskState;

const taskFactory = new TaskFactory(console, {returnSuccessOrFailure: true});

const Strings = require('core-functions/strings');
const stringify = Strings.stringify;
const isNotBlank = Strings.isNotBlank;

const errors = require('../errors');
const FrozenError = errors.FrozenError;
// const FinalisedError = errors.FinalisedError;

const tries = require('core-functions/tries');
const Try = tries.Try;

const Action = {
  COMPLETE: 'COMPLETE',
  SUCCEED: 'SUCCEED',
  REJECT: 'REJECT',
  FAIL: 'FAIL',
  NONE: 'NONE'
};

/**
 * Creates a simple task.
 * @param {string} name
 * @param {Function} executeFn
 * @param {TaskFactory|undefined} [factory]
 * @param {TaskOpts|undefined} [opts]
 * @returns {Task}
 */
function createSimpleTask(name, executeFn, factory, opts) {
  factory = factory ? factory : taskFactory;
  return factory.createTask(TaskDef.defineTask(`Task ${name}`, executeFn), opts);
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
  const task = createSimpleTask('A', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isSuccess(), `executeResult must be Success`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.equal(task.outcome, executeResult, `${task.name} outcome must be ${stringify(executeResult)}`);
  t.equal(task.outcome.value, executeResult.value, `${task.name} outcome.value must be ${stringify(executeResult.value)}`);

  // Converting to a promise to re-use most of code copied from task-execute.test.js
  executeResult.toPromise().then(
    result => {
      const expected = 'A';
      t.equal(result, expected, `${task.name} execute() result must be ${expected}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        resolutions => {
          t.equal(resolutions.length, 1, `resolutions.length must be 1`);
          t.ok(resolutions[0].isSuccess(), `${task.name} resolutions[0].isSuccess() must be true`);
          t.equal(resolutions[0].value, expected, `${task.name} resolutions[0].value must be ${expected}`);
          t.ok(task.completed, `${task.name} must be completed`);
          t.equal(task.state, TaskState.instances.Completed, `${task.name} state must be Completed`);
          t.equal(task.result, executeResult.value, `${task.name} result must be ${stringify(executeResult.value)}`);
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
  const task = createSimpleTask('ABC', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isSuccess(), `executeResult must be Success`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.equal(task.outcome, executeResult, `${task.name} outcome must be ${stringify(executeResult)}`);
  t.equal(task.outcome.value, executeResult.value, `${task.name} outcome.value must be ${stringify(executeResult.value)}`);

  executeResult.toPromise().then(
    result => {
      const expected = 'ABC';
      t.equal(result, expected, `${task.name} execute() result must be ${expected}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        resolutions => {
          t.equal(resolutions.length, 1, `resolutions.length must be 1`);
          t.ok(resolutions[0].isSuccess(), `${task.name} resolutions[0].isSuccess() must be true`);
          t.equal(resolutions[0].value, expected, `${task.name} resolutions[0].value must be ${expected}`);
          t.ok(task.completed, `${task.name} must be completed`);
          t.equal(task.state, TaskState.instances.Completed, `${task.name} state must be Completed`);
          t.equal(task.result, executeResult.value, `${task.name} result must be ${stringify(executeResult.value)}`);
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
  const task = createSimpleTask('ABC', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isSuccess(), `executeResult must be Success`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.equal(task.outcome, executeResult, `${task.name} outcome must be ${stringify(executeResult)}`);
  t.equal(task.outcome.value, executeResult.value, `${task.name} outcome.value must be ${stringify(executeResult.value)}`);

  t.equal(executeResult.value.length, 3, `executeResult.value.length must be 3`);

  // Cannot use toPromise() in this case as is it will wrap its array of promises into a promise of an array of promises
  Promise.all(executeResult.value).then(
    result => {
      const expected = ['A', 'B', 'C'];
      t.deepEqual(result, expected, `${task.name} execute() result must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        resolutions => {
          t.equal(resolutions.length, 3, `resolutions.length must be 3`);
          t.ok(resolutions[0].isSuccess(), `${task.name} resolutions[0].isSuccess() must be true`);
          t.ok(resolutions[1].isSuccess(), `${task.name} resolutions[1].isSuccess() must be true`);
          t.ok(resolutions[2].isSuccess(), `${task.name} resolutions[2].isSuccess() must be true`);
          t.equal(resolutions[0].value, expected[0], `${task.name} resolutions[0].value must be ${expected[0]}`);
          t.equal(resolutions[1].value, expected[1], `${task.name} resolutions[1].value must be ${expected[1]}`);
          t.equal(resolutions[2].value, expected[2], `${task.name} resolutions[2].value must be ${expected[2]}`);
          t.ok(task.completed, `${task.name} must be completed`);
          t.equal(task.state, TaskState.instances.Completed, `${task.name} state must be Completed`);
          t.equal(task.result, executeResult.value, `${task.name} result must be ${stringify(executeResult.value)}`);
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
  const error = new Error("Boom");
  error.extra = 'Extra info';

  const executeFn = () => {
    return a(error, null);
  };
  const task = createSimpleTask('A', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isSuccess(), `executeResult must be Success`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.equal(task.outcome, executeResult, `${task.name} outcome must be ${stringify(executeResult)}`);
  t.equal(task.outcome.value, executeResult.value, `${task.name} outcome.value must be ${stringify(executeResult.value)}`);

  executeResult.toPromise().then(
    result => {
      t.end(`${task.name} should NOT have resolved with result (${stringify(result)})`);
    },
    err => {
      const expected = error;
      t.equal(err, expected, `${task.name} execute() error must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        resolutions => {
          t.equal(resolutions.length, 1, `resolutions.length must be 1`);
          t.ok(resolutions[0].isFailure(), `${task.name} resolutions[0].isFailure() must be true`);
          t.equal(resolutions[0].error, expected, `${task.name} resolutions[0].error must be ${stringify(expected)}`);
          t.ok(task.failed, `${task.name} must be failed`);
          t.equal(task.error, error, `${task.name} error must be ${stringify(expected)}`);
          t.equal(task.state.name, TaskState.names.Failed, `${task.name} state name must be ${TaskState.names.Failed}`);
          t.equal(task.state.error, error.toString(), `${task.name} state error must be ${stringify(expected.toString())}`);
          t.end();
        },
        err => t.end(err)
      );
    }
  );
});

test('Task execute throwing an error', t => {
  const ms = 10;
  const a = genFnSync('A', ms);
  const error = new Error("Boom");
  error.extra = 'Extra info';

  const executeFn = () => {
    return a(error, null);
  };
  const task = createSimpleTask('A', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isFailure(), `executeResult must be Failure`);

  executeResult.toPromise().then(
    result => {
      t.end(`${task.name} should NOT have finished with result (${stringify(result)})`);
    },
    err => {
      t.ok(task.started, `${task.name} must be started`);
      t.equal(task.attempts, 1, `${task.name} attempts must be 1`);
      t.equal(task.outcome.error, err, `${task.name} execution.error must be ${stringify(err)}`);

      const expected = error;
      t.equal(err, expected, `${task.name} execute() caught error must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        resolutions => {
          t.equal(resolutions.length, 1, `resolutions.length must be 1`);
          t.ok(resolutions[0].isFailure(), `${task.name} resolutions[0].isFailure() must be true`);
          t.equal(resolutions[0].error, expected, `${task.name} resolutions[0].error must be ${stringify(expected)}`);
          t.ok(task.failed, `${task.name} must be failed`);
          t.equal(task.error, error, `${task.name} error must be ${stringify(expected)}`);
          t.equal(task.state.name, TaskState.names.Failed, `${task.name} state name must be ${TaskState.names.Failed}`);
          t.equal(task.state.error, error.toString(), `${task.name} state error must be ${stringify(expected.toString())}`);
          t.end();
        },
        err => t.end(err)
      );
    });
});

test('Task execute returning sync result', t => {
  const ms = 10;
  const a = genFnSync('A', ms);

  const executeFn = () => {
    return a(null, 'A')
  };
  const task = createSimpleTask('A', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isSuccess(), `executeResult must be Success`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);
  t.equal(task.outcome, executeResult, `${task.name} outcome must be ${stringify(executeResult)}`);
  t.equal(task.outcome.value, executeResult.value, `${task.name} outcome.value must be ${stringify(executeResult.value)}`);

  executeResult.map(
    value => {
      const expected = 'A';
      t.equal(value, expected, `${task.name} execute() value must be ${expected}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        resolutions => {
          t.equal(resolutions.length, 1, `resolutions.length must be 1`);
          t.ok(resolutions[0].isSuccess(), `${task.name} resolutions[0].isSuccess() must be true`);
          t.equal(resolutions[0].value, expected, `${task.name} resolutions[0].value must be ${expected}`);
          t.ok(task.completed, `${task.name} must be completed`);
          t.equal(task.state, TaskState.instances.Completed, `${task.name} state must be Completed`);
          t.equal(task.result, expected, `${task.name} result must be ${stringify(expected)}`);
          t.end();
        },
        err => t.end(err)
      );
    },
    err => t.end(err)
  )
});

test('Task execute returning a list of sync results', t => {
  const ms = 10;
  const a = genFnSync('A', ms);
  const b = genFnSync('B', ms);
  const c = genFnSync('C', ms);

  const executeFn = () => {
    return [a(null, 'A'), b(null, 'B'), c(null, 'C')]
  };
  const task = createSimpleTask('A', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isSuccess(), `executeResult must be Success`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.equal(task.outcome, executeResult, `${task.name} outcome must be ${stringify(executeResult)}`);
  t.deepEqual(task.outcome.value, executeResult.value, `${task.name} outcome.value must be ${stringify(executeResult.value)}`);

  executeResult.map(
    value => {
      const expected = ['A', 'B', 'C'];
      t.deepEqual(value, expected, `${task.name} execute() result must be ${expected}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        resolutions => {
          t.equal(resolutions.length, 3, `resolutions.length must be 3`);
          t.ok(resolutions[0].isSuccess(), `${task.name} resolutions[0].isSuccess() must be true`);
          t.ok(resolutions[1].isSuccess(), `${task.name} resolutions[1].isSuccess() must be true`);
          t.ok(resolutions[2].isSuccess(), `${task.name} resolutions[2].isSuccess() must be true`);
          t.equal(resolutions[0].value, expected[0], `${task.name} resolutions[0].value must be ${expected[0]}`);
          t.equal(resolutions[1].value, expected[1], `${task.name} resolutions[1].value must be ${expected[1]}`);
          t.equal(resolutions[2].value, expected[2], `${task.name} resolutions[2].value must be ${expected[2]}`);
          t.ok(task.completed, `${task.name} must be completed`);
          t.equal(task.state, TaskState.instances.Completed, `${task.name} state must be Completed`);
          t.deepEqual(task.result, expected, `${task.name} result must be ${stringify(expected)}`);
          t.end();
        },
        err => t.end(err)
      );
    },
    err => t.end(err)
  );
});

test('Task execute returning 1 promise that fulfills, but self-managed to Succeeded - original succeed "prevents" later complete', t => {
  const ms = 10;

  const task = createSimpleTask('A', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const stateName = TaskState.names.Succeeded;

  const executeResult = task.execute('A', null, 'A', ms, Action.SUCCEED, null, stateName);

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isSuccess(), `executeResult must be Success`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.equal(task.outcome, executeResult, `${task.name} outcome must be ${stringify(executeResult)}`);
  t.equal(task.outcome.value, executeResult.value, `${task.name} outcome.value must be ${stringify(executeResult.value)}`);

  executeResult.toPromise().then(
    result => {
      const expected = 'A';
      t.equal(result, expected, `${task.name} execute() result must be ${expected}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        resolutions => {
          t.equal(resolutions.length, 1, `resolutions.length must be 1`);
          t.ok(resolutions[0].isSuccess(), `${task.name} resolutions[0].isSuccess() must be true`);
          t.equal(resolutions[0].value, expected, `${task.name} resolutions[0].value must be ${expected}`);
          t.ok(task.completed, `${task.name} must be completed`);
          t.equal(task.state, TaskState.instances.Succeeded, `${task.name} state must be Succeeded`);
          t.equal(task.state.name, stateName, `${task.name} state name must be ${stateName}`);
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

  const error = new Error("Boom");
  error.extra1 = 'Boom extra info';

  const internalError = new TypeError("Kaboom");
  error.extra2 = 'Kaboom extra info';

  const task = createSimpleTask('A', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const stateName = "ThrownAway"; // TaskState.names.Abandoned;

  const executeResult = task.execute('A', error, undefined, ms, Action.REJECT, internalError, stateName);

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isSuccess(), `executeResult must be Success`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.equal(task.outcome, executeResult, `${task.name} outcome must be ${stringify(executeResult)}`);
  t.equal(task.outcome.value, executeResult.value, `${task.name} outcome.value must be ${stringify(executeResult.value)}`);

  executeResult.toPromise().then(
    result => {
      t.end(`${task.name} should NOT have resolved with result (${stringify(result)})`);
    },
    err => {
      const expected = error;
      t.equal(err, expected, `${task.name} execute() error must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        resolutions => {
          t.equal(resolutions.length, 1, `resolutions.length must be 1`);
          t.ok(resolutions[0].isFailure(), `${task.name} resolutions[0].isFailure() must be true`);
          t.equal(resolutions[0].error, expected, `${task.name} resolutions[0].error must be ${stringify(expected)}`);
          t.ok(task.rejected, `${task.name} must be rejected`);
          t.equal(task.error, internalError, `${task.name} error must be ${stringify(internalError)}`);
          t.equal(task.state.name, stateName, `${task.name} state name must be ${stateName}`);
          t.equal(task.state.error, internalError.toString(), `${task.name} state error must be ${stringify(internalError.toString())}`);
          t.end();
        },
        err => t.end(err)
      );
    }
  );
});

test('Task execute returning 1 promise that rejects, but self managed to Failed - later failure doe NOT override original failure', t => {
  const ms = 10;

  const error = new Error("Boom");
  error.extra1 = 'Boom extra info';

  const internalError = new TypeError("Kaboom");
  internalError.extra2 = 'Kaboom extra info';

  const task = createSimpleTask('A', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const stateName = "DatabaseError"; // TaskState.names.Failed;

  const executeResult = task.execute('A', error, undefined, ms, Action.FAIL, internalError, stateName);

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isSuccess(), `executeResult must be Success`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.equal(task.outcome, executeResult, `${task.name} outcome must be ${stringify(executeResult)}`);
  t.equal(task.outcome.value, executeResult.value, `${task.name} outcome.value must be ${stringify(executeResult.value)}`);

  executeResult.toPromise().then(
    result => {
      t.end(`${task.name} should NOT have resolved with result (${stringify(result)})`);
    },
    err => {
      const expected = error;
      t.equal(err, expected, `${task.name} execute() error must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        resolutions => {
          t.equal(resolutions.length, 1, `resolutions.length must be 1`);
          t.ok(resolutions[0].isFailure(), `${task.name} resolutions[0].isFailure() must be true`);
          t.equal(resolutions[0].error, expected, `${task.name} resolutions[0].error must be ${stringify(expected)}`);
          t.ok(task.failed, `${task.name} must be failed`);
          t.equal(task.error, internalError, `${task.name} error must be ${stringify(internalError)}`);
          t.equal(task.state.name, stateName, `${task.name} state name must be ${stateName}`);
          t.equal(task.state.error, internalError.toString(), `${task.name} state error must be ${stringify(internalError.toString())}`);
          t.end();
        },
        err => t.end(err)
      );
    }
  );
});

test('Task execute returning 1 promise that rejects, but self managed to Succeeded - later failure overrides original success', t => {
  const ms = 10;

  const error = new Error("Boom");
  error.extra1 = 'Boom extra info';

  const internalError = new TypeError("Kaboom");
  internalError.extra2 = 'Kaboom extra info';

  const task = createSimpleTask('A', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const stateName = TaskState.names.Succeeded;

  const executeResult = task.execute('A', error, undefined, ms, Action.SUCCEED, internalError, stateName);

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isSuccess(), `executeResult must be Success`);

  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.equal(task.outcome, executeResult, `${task.name} outcome must be ${stringify(executeResult)}`);
  t.equal(task.outcome.value, executeResult.value, `${task.name} outcome.value must be ${stringify(executeResult.value)}`);

  executeResult.toPromise().then(
    result => {
      t.end(`${task.name} should NOT have resolved with result (${stringify(result)})`);
    },
    err => {
      const expected = error;
      t.equal(err, expected, `${task.name} execute() error must be ${stringify(expected)}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        resolutions => {
          t.equal(resolutions.length, 1, `resolutions.length must be 1`);
          t.ok(resolutions[0].isFailure(), `${task.name} resolutions[0].isFailure() must be true`);
          t.equal(resolutions[0].error, expected, `${task.name} resolutions[0].error must be ${stringify(expected)}`);
          t.ok(task.failed, `${task.name} must be failed`);
          t.equal(task.error, error, `${task.name} error must be ${stringify(error)}`);
          t.equal(task.state.name, TaskState.names.Failed, `${task.name} state name must be ${TaskState.names.Failed}`);
          t.equal(task.state.error, error.toString(), `${task.name} state error must be ${stringify(error.toString())}`);
          t.end();
        },
        err => t.end(err)
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
  const task = createSimpleTask('A', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  // Simulate external freeze of task before it even executes
  task.freeze();
  t.ok(task.isFrozen(), `${task.name} must be frozen`);


  // Attempt to execute the task
  // t.throws(() => task.execute(), FrozenError, `execute must throw FrozenError`);
  const executeResult = task.execute();

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isFailure(), `executeResult must be Failure`);
  t.ok(executeResult.error instanceof FrozenError, `executeResult must be an instanceof FrozenError`);

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
  const task = createSimpleTask('A', executeFn);

  t.ok(task.unstarted, `${task.name} must be unstarted`);
  t.equal(task.attempts, 0, `${task.name} attempts must be 0`);

  const executeResult = task.execute();

  t.ok(executeResult instanceof Try, `executeResult must be an instanceof Try`);
  t.ok(executeResult.isSuccess(), `executeResult must be Success`);

  t.notOk(task.isFrozen(), `${task.name} must NOT be frozen yet`);
  t.ok(task.started, `${task.name} must be started`);
  t.equal(task.attempts, 1, `${task.name} attempts must be 1`);

  t.equal(task.outcome, executeResult, `${task.name} outcome must be ${stringify(executeResult)}`);
  t.equal(task.outcome.value, executeResult.value, `${task.name} outcome.value must be ${stringify(executeResult.value)}`);

  t.ok(task.donePromise, `${task.name} donePromise must be defined`);

  executeResult.toPromise().then(
    result => {
      const expected = 'A';
      t.equal(result, expected, `${task.name} execute() result must be ${expected}`);
      t.ok(task.donePromise, `${task.name} has a done promise`);
      task.donePromise.then(
        resolutions => {
          t.ok(task.isFrozen(), `${task.name} must be frozen`);
          t.equal(resolutions.length, 1, `resolutions.length must be 1`);
          t.ok(resolutions[0].isSuccess(), `${task.name} resolutions[0].isSuccess() must be true`);
          t.equal(resolutions[0].value, expected, `${task.name} resolutions[0].value must be ${expected}`);

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