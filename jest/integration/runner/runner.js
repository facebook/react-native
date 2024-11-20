/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {TestSuiteResult} from '../runtime/setup';

import entrypointTemplate from './entrypoint-template';
import {spawnSync} from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
// $FlowExpectedError[untyped-import]
import {formatResultsErrors} from 'jest-message-util';
import Metro from 'metro';
import nullthrows from 'nullthrows';
import os from 'os';
import path from 'path';

const BUILD_OUTPUT_PATH = path.resolve(__dirname, '..', 'build');
const PRINT_FANTOM_OUTPUT: false = false;

function parseRNTesterCommandResult(
  commandArgs: $ReadOnlyArray<string>,
  result: ReturnType<typeof spawnSync>,
): {logs: string, testResult: TestSuiteResult} {
  const stdout = result.stdout.toString();

  const outputArray = stdout
    .trim()
    .split('\n')
    .filter(log => !log.startsWith('Running "')); // remove AppRegistry logs.

  // The last line should be the test output in JSON format
  const testResultJSON = outputArray.pop();

  let testResult;
  try {
    testResult = JSON.parse(nullthrows(testResultJSON));
  } catch (error) {
    throw new Error(
      [
        'Failed to parse test results from RN tester binary result. Full output:',
        'buck2 ' + commandArgs.join(' '),
        'stdout:',
        stdout,
        'stderr:',
        result.stderr.toString(),
      ].join('\n'),
    );
  }

  return {logs: outputArray.join('\n'), testResult};
}

function getBuckModeForPlatform() {
  switch (os.platform()) {
    case 'linux':
      return '@//arvr/mode/linux/dev';
    case 'darwin':
      return os.arch() === 'arm64'
        ? '@//arvr/mode/mac-arm/dev'
        : '@//arvr/mode/mac/dev';
    case 'win32':
      return '@//arvr/mode/win/dev';
    default:
      throw new Error(`Unsupported platform: ${os.platform()}`);
  }
}

function getShortHash(contents: string): string {
  return crypto.createHash('md5').update(contents).digest('hex').slice(0, 8);
}

module.exports = async function runTest(
  globalConfig: {...},
  config: {...},
  environment: {...},
  runtime: {...},
  testPath: string,
): mixed {
  const startTime = Date.now();

  const metroConfig = await Metro.loadConfig({
    config: path.resolve(__dirname, '..', 'config', 'metro.config.js'),
  });

  const setupModulePath = path.resolve(__dirname, '../runtime/setup.js');

  const entrypointContents = entrypointTemplate({
    testPath: `${path.relative(BUILD_OUTPUT_PATH, testPath)}`,
    setupModulePath: `${path.relative(BUILD_OUTPUT_PATH, setupModulePath)}`,
  });

  const entrypointPath = path.join(
    BUILD_OUTPUT_PATH,
    `${getShortHash(entrypointContents)}-${path.basename(testPath)}`,
  );
  const testBundlePath = entrypointPath + '.bundle';

  fs.mkdirSync(path.dirname(entrypointPath), {recursive: true});
  fs.writeFileSync(entrypointPath, entrypointContents, 'utf8');

  await Metro.runBuild(metroConfig, {
    entry: entrypointPath,
    out: testBundlePath,
    platform: 'android',
    minify: false,
    dev: true,
  });

  const rnTesterCommandArgs = [
    'run',
    getBuckModeForPlatform(),
    '//xplat/ReactNative/react-native-cxx/samples/tester:tester',
    '--',
    `--bundlePath=${testBundlePath}`,
  ];
  const rnTesterCommandResult = spawnSync('buck2', rnTesterCommandArgs, {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `/usr/local/bin:${process.env.PATH ?? ''}`,
    },
  });

  if (rnTesterCommandResult.status !== 0) {
    throw new Error(
      [
        'Failed to run test in RN tester binary. Full output:',
        'buck2 ' + rnTesterCommandArgs.join(' '),
        'stdout:',
        rnTesterCommandResult.stdout,
        'stderr:',
        rnTesterCommandResult.stderr,
        'error:',
        rnTesterCommandResult.error,
      ].join('\n'),
    );
  }

  if (PRINT_FANTOM_OUTPUT) {
    console.log(
      [
        'RN tester binary. Full output:',
        'buck2 ' + rnTesterCommandArgs.join(' '),
        'stdout:',
        rnTesterCommandResult.stdout,
        'stderr:',
        rnTesterCommandResult.stderr,
        'error:',
        rnTesterCommandResult.error,
      ].join('\n'),
    );
  }

  const rnTesterParsedOutput = parseRNTesterCommandResult(
    rnTesterCommandArgs,
    rnTesterCommandResult,
  );

  const testResultError = rnTesterParsedOutput.testResult.error;
  if (testResultError) {
    const error = new Error(testResultError.message);
    error.stack = testResultError.stack;
    throw error;
  }

  const endTime = Date.now();

  if (process.env.SANDCASTLE == null) {
    console.log(rnTesterParsedOutput.logs);
  }

  const testResults =
    nullthrows(rnTesterParsedOutput.testResult.testResults).map(testResult => ({
      ancestorTitles: [] as Array<string>,
      failureDetails: [] as Array<string>,
      testFilePath: testPath,
      ...testResult,
    })) ?? [];

  return {
    testFilePath: testPath,
    failureMessage: formatResultsErrors(
      testResults,
      config,
      globalConfig,
      testPath,
    ),
    leaks: false,
    openHandles: [],
    perfStats: {
      start: startTime,
      end: endTime,
      duration: endTime - startTime,
      runtime: endTime - startTime,
      slow: false,
    },
    snapshot: {
      added: 0,
      fileDeleted: false,
      matched: 0,
      unchecked: 0,
      uncheckedKeys: [],
      unmatched: 0,
      updated: 0,
    },
    numTotalTests: testResults.length,
    numPassingTests: testResults.filter(test => test.status === 'passed')
      .length,
    numFailingTests: testResults.filter(test => test.status === 'failed')
      .length,
    numPendingTests: testResults.filter(test => test.status === 'pending')
      .length,
    numTodoTests: 0,
    skipped: false,
    testResults,
  };
};
