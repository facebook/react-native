/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

/**
 * This script runs JavaScript tests.
 * Available arguments:
 * --maxWorkers [num] - how many workers, default 1
 * --jestBinary [path] - path to jest binary, defaults to local node modules
 * --yarnBinary [path] - path to yarn binary, defaults to yarn
 */

const {execSync} = require('child_process');
const argv = require('yargs').argv;

const numberOfMaxWorkers = argv.maxWorkers || 1;
let exitCode;

const JEST_BINARY = argv.jestBinary || './node_modules/.bin/jest';
const FLOW_BINARY = argv.flowBinary;
const YARN_BINARY = argv.yarnBinary || 'yarn';

function describe(message) {
  console.log(`\n\n>>>>> ${message}\n\n\n`);
}

try {
  console.log('Executing JavaScript tests');

  describe('Test: feature flags codegen');
  if (execSync(`${YARN_BINARY} run featureflags --verify-unchanged`).code) {
    console.log('Failed to run featureflags check.');
    exitCode = 1;
    throw Error(exitCode);
  }

  describe('Test: eslint');
  if (execSync(`${YARN_BINARY} run lint`).code) {
    console.log('Failed to run eslint.');
    exitCode = 1;
    throw Error(exitCode);
  }

  describe('Test: No JS build artifacts');
  if (execSync(`${YARN_BINARY} run build --validate`).code) {
    console.log('Failed, there are build artifacts in this commit.');
    exitCode = 1;
    throw Error(exitCode);
  }

  describe('Test: Flow check');
  const flowCommand =
    FLOW_BINARY == null
      ? `${YARN_BINARY} run flow-check`
      : `${FLOW_BINARY} check`;
  if (execSync(flowCommand).code) {
    console.log('Failed to run flow.');
    exitCode = 1;
    throw Error(exitCode);
  }

  /*
   * Build @react-native/codegen and  @react-native/codegen-typescript-test
   *
   * The typescript-test project use TypeScript to write test cases
   * In order to make these tests discoverable to jest
   * *-test.ts must be compiled to *-test.js before running jest
   */

  describe('Test: Build @react-native/codegen');
  if (
    execSync(`${YARN_BINARY} --cwd ./packages/react-native-codegen run build`)
      .code
  ) {
    console.log('Failed to build @react-native/codegen.');
    exitCode = 1;
    throw Error(exitCode);
  }
  describe('Test: Build @react-native/codegen-typescript-test');
  if (
    execSync(
      `${YARN_BINARY} --cwd ./private/react-native-codegen-typescript-test run build`,
    ).code
  ) {
    console.log('Failed to build @react-native/codegen-typescript-test.');
    exitCode = 1;
    throw Error(exitCode);
  }

  describe('Test: Jest');
  if (
    execSync(
      `${JEST_BINARY} --maxWorkers=${numberOfMaxWorkers} --ci --reporters="default" --reporters="jest-junit"`,
    ).code
  ) {
    console.log('Failed to run JavaScript tests.');
    console.log('Most likely the code is broken.');
    exitCode = 1;
    throw Error(exitCode);
  }

  describe('Test: TypeScript tests');
  if (execSync(`${YARN_BINARY} run test-typescript`).code) {
    console.log('Failed to run TypeScript tests.');
    exitCode = 1;
    throw Error(exitCode);
  }

  exitCode = 0;
} finally {
  // Do cleanup here
  console.log('Finished.');
}
process.exit(exitCode);
