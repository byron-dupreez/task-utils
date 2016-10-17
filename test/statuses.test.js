'use strict';

/**
 * Unit tests for task-utils/statuses.js
 * @author Byron du Preez
 */

const test = require("tape");

const statuses = require('../statuses');
const INCOMPLETE_CODE = statuses.INCOMPLETE_CODE;
const SUCCEEDED_CODE = statuses.SUCCEEDED_CODE;
const FAILED_CODE = statuses.FAILED_CODE;

const INCOMPLETE = statuses.INCOMPLETE;
const SUCCEEDED = statuses.SUCCEEDED;

const Status = statuses.Status;
const Incomplete = statuses.Incomplete;
const Success = statuses.Success;
const Failure = statuses.Failure;
const Succeeded = statuses.Succeeded;
const Failed = statuses.Failed;
const toStatus = statuses.toStatus;
const isStatusCompleted = statuses.isStatusCompleted;

function ensureImmutable(status, assert) {
  if (status) {
    try {
      status.code = 'Cannot be changed';
      assert.fail(`${JSON.stringify(status)} code is supposed to be immutable`);
    } catch (err) {
      // Expected an error on attempted mutation of immutable property
      console.log(`Expected error ${err}`);
    }

    try {
      status.completed = !status.completed;
      assert.fail(`${JSON.stringify(status)} completed is supposed to be immutable`);
    } catch (err) {
      // Expected an error on attempted mutation of immutable property
      console.log(`Expected error ${err}`);
    }

    try {
      status.error = new Error("Boom");
      assert.fail(`${JSON.stringify(status)} error is supposed to be immutable`);
    } catch (err) {
      // Expected an error on attempted mutation of immutable property
      console.log(`Expected error ${err}`);
    }

    // If we don't use Object.freeze and instead use Object.defineProperty to make Status properties read-only, then we
    // don't block adding properties to Status and this check will fail
    // try {
    //   status.newProperty = 'New property value';
    //   assert.fail(`${JSON.stringify(status)} is supposed to be frozen`);
    // } catch (err) {
    //   // Expected an error on attempted mutation of immutable property
    //   console.log(`Expected error ${err}`);
    // }
  }
}

test('Construct completed Status instance', t => {
  const code = 'MyCode1';
  const status = new Status(code, true);
  t.ok(status, 'Status must be defined');
  t.equal(status.code, code, 'code must match');
  t.equal(status.completed, true, 'must be completed');
  t.equal(isStatusCompleted(status), true, 'must be completed');
  t.notOk(status.error, 'must have no error');
  ensureImmutable(status, t);
  t.end();
});

test('Construct completed Status instance with error', t => {
  const code = 'MyCode2';
  const err = new Error('Badoom2');
  const status = new Status(code, true, err);
  t.ok(status, 'Status must be defined');
  t.equal(status.code, code, 'code must match');
  t.equal(status.completed, true, 'must be completed');
  t.equal(isStatusCompleted(status), true, 'must be completed');
  t.equal(status.error, err, 'error must match');
  ensureImmutable(status, t);
  t.end();
});

test('Construct incomplete Status instance', t => {
  var code = 'MyCode3';
  const status = new Status(code, false);
  t.ok(status, 'Status must be defined');
  t.equal(status.code, code, 'code must match');
  t.equal(status.completed, false, 'must not be completed');
  t.equal(isStatusCompleted(status), false, 'must not be completed');
  t.notOk(status.error, 'must have no error');
  ensureImmutable(status, t);
  t.end();
});

test('Construct incomplete Status instance with error', t => {
  const code = 'MyCode4';
  const err = new Error('Badoom4');
  const status = new Status(code, false, err);
  t.ok(status, 'Status must be defined');
  t.equal(status.code, code, 'code must match');
  t.equal(status.completed, false, 'must not be completed');
  t.equal(isStatusCompleted(status), false, 'must not be completed');
  t.equal(status.error, err, 'error must match');
  ensureImmutable(status, t);
  t.end();
});

test('Construct Success instance', t => {
  const code = 'MyCode5';
  const status = new Success(code);
  t.ok(status, 'Success must be defined');
  t.ok(status instanceof Success, 'must be instanceof Success');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.equal(status.code, code, 'code must match');
  t.equal(status.completed, true, 'must be completed');
  t.equal(isStatusCompleted(status), true, 'must be completed');
  t.notOk(status.error, 'must have no error');
  ensureImmutable(status, t);
  t.end();
});

test('Construct Failure instance', t => {
  const code = 'MyCode6';
  const err = new Error('Badoom6');
  const status = new Failure(code, err);
  t.ok(status, 'Failure must be defined');
  t.ok(status instanceof Failure, 'must be instanceof Failure');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.equal(status.code, code, 'code must match');
  t.equal(status.completed, false, 'must not be completed');
  t.equal(isStatusCompleted(status), false, 'must not be completed');
  t.equal(status.error, err, 'error must match');
  ensureImmutable(status, t);
  t.end();
});

test('INCOMPLETE singleton', t => {
  const status = INCOMPLETE;
  t.ok(status, 'INCOMPLETE must be defined');
  t.ok(status instanceof Incomplete, 'must be instanceof Incomplete');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.equal(status.code, INCOMPLETE_CODE, `code must be ${INCOMPLETE_CODE}`);
  t.equal(status.completed, false, 'must not be completed');
  t.equal(isStatusCompleted(status), false, 'must not be completed');
  t.notOk(status.error, 'must have no error');
  ensureImmutable(status, t);
  t.end();
});

test('Construct an Incomplete Status instance', t => {
  const status = new Incomplete();
  t.ok(status, 'Incomplete must be defined');
  t.ok(status instanceof Incomplete, 'must be instanceof Incomplete');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.equal(status.code, INCOMPLETE_CODE, `code must be ${INCOMPLETE_CODE}`);
  t.equal(status.completed, false, 'must not be completed');
  t.equal(isStatusCompleted(status), false, 'must not be completed');
  t.notOk(status.error, 'must have no error');
  ensureImmutable(status, t);
  t.end();
});

test('SUCCEEDED singleton', t => {
  const status = SUCCEEDED;
  t.ok(status, 'SUCCEEDED must be defined');
  t.ok(status instanceof Succeeded, 'must be instanceof Succeeded');
  t.ok(status instanceof Success, 'must be instanceof Success');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.equal(status.code, SUCCEEDED_CODE, `code must be ${SUCCEEDED_CODE}`);
  t.equal(status.completed, true, 'must be completed');
  t.equal(isStatusCompleted(status), true, 'must be completed');
  t.notOk(status.error, 'must have no error');
  ensureImmutable(status, t);
  t.end();
});

test('Construct Succeeded instance', t => {
  const status = new Succeeded();
  t.ok(status, 'Succeeded must be defined');
  t.ok(status instanceof Succeeded, 'must be instanceof Succeeded');
  t.ok(status instanceof Success, 'must be instanceof Success');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.equal(status.code, SUCCEEDED_CODE, `code must be ${SUCCEEDED_CODE}`);
  t.equal(status.completed, true, 'must be completed');
  t.equal(isStatusCompleted(status), true, 'must be completed');
  t.notOk(status.error, 'must have no error');
  ensureImmutable(status, t);
  t.end();
});

test('Construct Failed instance', t => {
  const err = new Error('Badoom7');
  const status = new Failed(err);
  t.ok(status, 'Failed must be defined');
  t.ok(status instanceof Failed, 'must be instanceof Failed');
  t.ok(status instanceof Failure, 'must be instanceof Failure');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.equal(status.code, FAILED_CODE, `code must be ${FAILED_CODE}`);
  t.equal(status.completed, false, 'must not be completed');
  t.equal(isStatusCompleted(status), false, 'must not be completed');
  t.equal(status.error, err, 'error must match');
  ensureImmutable(status, t);
  t.end();
});

test('toStatus with code, completed & error must be Status', t => {
  const code = 'MyCode1';
  const err = new Error('Badoom7');
  const status = toStatus(code, true, err);
  t.ok(status, 'status must be defined');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.notOk(status instanceof Success, 'must not be instanceof Success');
  t.notOk(status instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(status instanceof Failure, 'must not be instanceof Failure');
  t.notOk(status instanceof Failed, 'must not be instanceof Failed');
  t.equal(status.code, code, 'code must match');
  t.equal(status.completed, true, 'must be completed');
  t.equal(isStatusCompleted(status), true, 'must be completed');
  t.equal(status.error, err, 'error must match');
  t.end();
});

test('toStatus with code, completed & no error must be Success', t => {
  const code = 'MyCode2';
  const status = toStatus(code, true);
  t.ok(status, 'status must be defined');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.ok(status instanceof Success, 'must be instanceof Success');
  t.notOk(status instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(status instanceof Failure, 'must not be instanceof Failure');
  t.notOk(status instanceof Failed, 'must not be instanceof Failed');
  t.equal(status.code, code, 'code must match');
  t.equal(status.completed, true, 'must be completed');
  t.equal(isStatusCompleted(status), true, 'must be completed');
  t.notOk(status.error, 'must have no error');
  t.end();
});

test('toStatus with code "Succeeded", completed & no error must be Succeeded', t => {
  const code = SUCCEEDED_CODE;
  const status = toStatus(code, true);
  t.ok(status, 'status must be defined');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.ok(status instanceof Success, 'must be instanceof Success');
  t.ok(status instanceof Succeeded, 'must be instanceof Succeeded');
  t.notOk(status instanceof Failure, 'must not be instanceof Failure');
  t.notOk(status instanceof Failed, 'must not be instanceof Failed');
  t.equal(status.code, code, 'code must match');
  t.equal(status.completed, true, 'must be completed');
  t.equal(isStatusCompleted(status), true, 'must be completed');
  t.notOk(status.error, 'must have no error');
  t.end();
});

test('toStatus with code, incomplete & no error must be Status', t => {
  const code = 'MyCode3';
  const status = toStatus(code, false);
  t.ok(status, 'status must be defined');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.notOk(status instanceof Success, 'must not be instanceof Success');
  t.notOk(status instanceof Succeeded, 'must not be instanceof Succeeded');
  t.notOk(status instanceof Failure, 'must not be instanceof Failure');
  t.notOk(status instanceof Failed, 'must not be instanceof Failed');
  t.equal(status.code, code, 'code must match');
  t.equal(status.completed, false, 'must not be completed');
  t.equal(isStatusCompleted(status), false, 'must not be completed');
  t.notOk(status.error, 'must have no error');
  t.end();
});

test('toStatus with code, incomplete & error must be Failure', t => {
  const code = 'MyCode33';
  const err = new Error('Badoom99');
  const status = toStatus(code, false, err);
  t.ok(status, 'status must be defined');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.notOk(status instanceof Success, 'must not be instanceof Success');
  t.notOk(status instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(status instanceof Failure, 'must be instanceof Failure');
  t.notOk(status instanceof Failed, 'must not be instanceof Failed');
  t.equal(status.code, code, 'code must match');
  t.equal(status.completed, false, 'must not be completed');
  t.equal(isStatusCompleted(status), false, 'must not be completed');
  t.equal(status.error, err, 'error must match');
  t.end();
});

test('toStatus with code "Failed"", incomplete & error must be Failure', t => {
  const code = FAILED_CODE;
  const err = new Error('Badoom88');
  const status = toStatus(code, false, err);
  t.ok(status, 'status must be defined');
  t.ok(status instanceof Status, 'must be instanceof Status');
  t.notOk(status instanceof Success, 'must not be instanceof Success');
  t.notOk(status instanceof Succeeded, 'must not be instanceof Succeeded');
  t.ok(status instanceof Failure, 'must be instanceof Failure');
  t.ok(status instanceof Failed, 'must be instanceof Failed');
  t.equal(status.code, code, 'code must match');
  t.equal(status.completed, false, 'must not be completed');
  t.equal(isStatusCompleted(status), false, 'must not be completed');
  t.equal(status.error, err, 'error must match');
  t.end();
});

