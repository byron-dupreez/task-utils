# task-utils v1.0.0

Utilities for accessing and updating the status, number of attempts, result and arbitrary properties of tasks on 
an object, which are used to track task progress.

Currently includes:
- tasks.js 
    - Utilities for accessing, setting, resetting and updating the status, number of attempts, result and other properties of tasks on an object
- statuses.js 
    - Classes and utility functions for defining the status of a task or operation.

This module is exported as a [Node.js](https://nodejs.org/) module.

## Installation

Using npm:
```bash
$ {sudo -H} npm i -g npm
$ npm i --save task-utils
```

In Node.js:
```js
// To use the status classes and utilities
const statuses = require('task-utils/statuses');

// To use the task utilities
const Tasks = require('task-utils/tasks');
```

## Unit tests
This module's unit tests were developed with and must be run with [tape](https://www.npmjs.com/package/tape). The unit tests have been tested on [Node.js v4.3.2](https://nodejs.org/en/blog/release/v4.3.2/).  

Install tape globally if you want to run multiple tests at once:
```bash
$ npm install tape -g
```

Run all unit tests with:
```bash
$ npm test
```
or with tape:
```bash
$ tape test/*.js
```

See the [package source](https://github.com/byron-dupreez/task-utils) for more details.
