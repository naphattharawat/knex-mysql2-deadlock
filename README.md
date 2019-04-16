# knex-mysql2-deadlock
An enhanced version of `knex-mysql-deadlock` for mysql2.  In addition to supporting mysql2 clients, this module addresses [an issue](https://github.com/Mindflash/knex-mysql-deadlock/issues/5) with the original implementation regarding support for ER_LOCK_DEADLOCK and provides additional flexibility around retries.

## Install

```bash
npm install knex mysql2 knex-mysql2-deadlock
```

## Usage

```js
const knex = require('knex')({
  client: require('knex-mysql2-deadlock'),
  connection: mysqlConfig,
  options: {
    // See below
  }
});
```

The following options are supported:

* `deadlockRetries` - Specifies the number retries that should be attempted upon receiving a deadlock.  Default is 5.
* `deadlockRetryDelay` - Specifies the delay between retries, in ms.
* `logger` - An alternative logger.  Default is console.
