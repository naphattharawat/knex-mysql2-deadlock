'use strict';

const test = require('ava');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

class mysql2 {
  _query () {}
}
const queryStub = sinon.stub(mysql2.prototype, '_query');

const ClientDeadlock = proxyquire('../', {
  'knex/lib/dialects/mysql2': mysql2
});

test.afterEach.always(() => {
  queryStub.reset();
});

async function testRetry (errorCode) {
  test.serial(`Performs a retry on ${errorCode}`, async t => {
    const error = new Error();
    error.code = errorCode;
    queryStub.rejects(error);
    const client = new ClientDeadlock({
      options: {
        deadlockRetries: 1
      }
    });
    queryStub
      .rejects(error)
      .onSecondCall().resolves();
    try {
      await client._query();
    } catch (_error) {
      t.fail();
    }
    t.pass();
  });
}

const errorCodes = [
  'ER_LOCK_WAIT_TIMEOUT',
  'ER_LOCK_DEADLOCK'
];
errorCodes.forEach(errorCode => {
  testRetry(errorCode);
});

test.serial('Throws error one retry limit is exceeded', async t => {
  const error = new Error();
  error.code = 'ER_LOCK_DEADLOCK';
  queryStub
    .rejects(error)
    .onSecondCall().resolves();
  const client = new ClientDeadlock({
    options: {
      deadlockRetries: 1
    }
  });

  // Will succeed on the second query
  try {
    await client._query();
  } catch (_error) {
    t.fail();
  }

  // All queries will throw an error
  try {
    await client._query();
  } catch (_error) {
    t.pass();
    return;
  }
  t.fail();
});
