/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script runs JavaScript tests.
 * Available arguments:
 * --maxWorkers [num] - how many workers, default 1
 * --jestBinary [path] - path to jest binary, defaults to local node modules
 * --yarnBinary [path] - path to yarn binary, defaults to yarn
 */
/*eslint-disable no-undef */
require('shelljs/global');

const argv = require('yargs').argv;

const numberOfMaxWorkers = argv.maxWorkers || 1;
let exitCode;

const JEST_BINARY = argv.jestBinary || './node_modules/.bin/jest';
const YARN_BINARY = argv.yarnBinary || 'yarn';

function describe(message) {
  echo(`\n\n>>>>> ${message}\n\n\n`);
}

try {
  echo('Executing JavaScript tests');

  describe('Test: eslint');
  if (exec(`${YARN_BINARY} run lint`).code) {
    echo('Failed to run eslint.');
    exitCode = 1;
    throw Error(exitCode);
  }

  describe('Test: Flow check (iOS)');
  if (exec(`${YARN_BINARY} run flow-check-ios`).code) {
    echo('Failed to run flow.');
    exitCode = 1;
    throw Error(exitCode);
  }
  describe('Test: Flow check (Android)');
  if (exec(`${YARN_BINARY} run flow-check-android`).code) {
    echo('Failed to run flow.');
    exitCode = 1;
    throw Error(exitCode);
  }

  describe('Test: Jest');
  if (
    exec(
      `${JEST_BINARY} --maxWorkers=${numberOfMaxWorkers} --ci --reporters="default" --reporters="jest-junit"`,
    ).code
  ) {
    echo('Failed to run JavaScript tests.');
    echo('Most likely the code is broken.');
    exitCode = 1;
    throw Error(exitCode);
  }

  exitCode = 0;
} finally {
  // Do cleanup here
  echo('Finished.');
}
exit(exitCode);

/*eslint-enable no-undef */
