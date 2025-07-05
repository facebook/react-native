/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

/**
 * This script runs JavaScript tests.
 * Available arguments:
 * --maxWorkers [num] - how many workers, default 1
 * --jestBinary [path] - path to jest binary, defaults to local node modules
 * --yarnBinary [path] - path to yarn binary, defaults to yarn
 * --flowBinary [path] - path to flow binary, defaults to running `yarn run flow-check`
 */

const {execSync} = require('child_process');
// $FlowFixMe[unclear-type]
const argv = require('yargs').argv /*:: as any as $ReadOnly<{
  maxWorkers?: number,
  jestBinary?: string,
  flowBinary?: string,
  yarnBinary?: string,
}> */;

const numberOfMaxWorkers = argv.maxWorkers ?? 1;

const JEST_BINARY = argv.jestBinary ?? './node_modules/.bin/jest';
const FLOW_BINARY = argv.flowBinary;
const YARN_BINARY = argv.yarnBinary ?? 'yarn';

class ExecError extends Error {
  constructor(cause /*: Error */) {
    super(cause.message, {cause});
    this.name = 'ExecError';
    // test
  }
}

function describe(message /*: string */) {
  console.log(`\n\n>>>>> ${message}\n\n\n`);
}

try {
  console.log('Executing JavaScript tests');

  describe('Test: feature flags codegen');
  execAndLog(`${YARN_BINARY} run featureflags --verify-unchanged`);
  describe('Test: eslint');
  execAndLog(`${YARN_BINARY} run lint`);
  describe('Test: No JS build artifacts');
  execAndLog(`${YARN_BINARY} run build --validate`);

  describe('Test: Validate JS API snapshot');
  execAndLog(`${YARN_BINARY} run build-types --validate`);

  describe('Test: Flow check');
  const flowCommand =
    FLOW_BINARY == null
      ? `${YARN_BINARY} run flow-check`
      : `${FLOW_BINARY} check`;
  execAndLog(flowCommand);

  /*
   * Build @react-native/codegen and  @react-native/codegen-typescript-test
   *
   * The typescript-test project use TypeScript to write test cases
   * In order to make these tests discoverable to jest
   * *-test.ts must be compiled to *-test.js before running jest
   */

  describe('Test: Build @react-native/codegen');
  execAndLog(`${YARN_BINARY} --cwd ./packages/react-native-codegen run build`);
  describe('Test: Build @react-native/codegen-typescript-test');
  execAndLog(
    `${YARN_BINARY} --cwd ./private/react-native-codegen-typescript-test run build`,
  );

  describe('Test: Jest');
  execAndLog(
    `${JEST_BINARY} --maxWorkers=${numberOfMaxWorkers} --ci --reporters="default" --reporters="jest-junit"`,
  );

  describe('Test: TypeScript tests');
  execAndLog(`${YARN_BINARY} run test-typescript`);
} catch (e) {
  if (e instanceof ExecError) {
    console.error(e.message);
    process.exitCode = 1;
  } else {
    throw e;
  }
} finally {
  console.log('Finished.');
}

function execAndLog(command /*: string */) {
  console.log(`Executing: ${command}`);
  try {
    execSync(command, {
      stdio: ['ignore', 'inherit', 'inherit'],
      encoding: 'utf8',
    });
  } catch (e) {
    throw new ExecError(e);
  }
}
