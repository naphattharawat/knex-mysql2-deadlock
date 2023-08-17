/* eslint-disable camelcase, no-underscore-dangle */
'use strict';

// Custom mysql dialect, with deadlock retries
// const Client_MySQL = require('knex/lib/dialects/mysql2');
const Client_MySQL = require('knex/lib/dialects/mysql');

class Client_MySQL_deadlock extends Client_MySQL {
  constructor (config) {
    super(config);

    const {
      deadlockRetries,
      deadlockRetryDelay,
      logger
    } = config.options || {};

    this.deadlockRetries = deadlockRetries || 5;
    this.deadlockRetryDelay = deadlockRetryDelay;
    this.logger = logger || console;
  }

  _query (connection, obj) {
    let retryAmount = this.deadlockRetries;
    const logger = this.logger;

    const runQuery = () => Reflect.apply(super._query, this, arguments)
      .catch(async error => {
        if (['ER_LOCK_WAIT_TIMEOUT', 'ER_LOCK_DEADLOCK'].includes(error.code) && retryAmount-- > 0) {
          logger.info(`${error.code} returned, retrying, (${retryAmount}) more attempts before error`);
          const retryDelay = this.deadlockRetryDelay;
          if (retryDelay) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
          return runQuery();
        }
        throw error;
      });

    return runQuery();
  }
}

module.exports = Client_MySQL_deadlock;