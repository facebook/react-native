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
import {
  getBuckModeForPlatform,
  getDebugInfoFromCommandResult,
  getShortHash,
  runBuck2,
  symbolicateStackTrace,
} from './utils';
import fs from 'fs';
// $FlowExpectedError[untyped-import]
import {formatResultsErrors} from 'jest-message-util';
import Metro from 'metro';
import nullthrows from 'nullthrows';
import path from 'path';

const BUILD_OUTPUT_PATH = path.resolve(__dirname, '..', 'build');

const ENABLE_OPTIMIZED_MODE: false = false;
const PRINT_FANTOM_OUTPUT: false = false;

function parseRNTesterCommandResult(result: ReturnType<typeof runBuck2>): {
  logs: string,
  testResult: TestSuiteResult,
} {
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
      'Failed to parse test results from RN tester binary result.\n' +
        getDebugInfoFromCommandResult(result),
    );
  }

  return {logs: outputArray.join('\n'), testResult};
}

function generateBytecodeBundle({
  sourcePath,
  bytecodePath,
  isOptimizedMode,
}: {
  sourcePath: string,
  bytecodePath: string,
  isOptimizedMode: boolean,
}): void {
  const hermesCompilerCommandResult = runBuck2([
    'run',
    getBuckModeForPlatform(isOptimizedMode),
    '//xplat/hermes/tools/hermesc:hermesc',
    '--',
    '-emit-binary',
    '-O',
    '-max-diagnostic-width',
    '80',
    '-out',
    bytecodePath,
    sourcePath,
  ]);

  if (hermesCompilerCommandResult.status !== 0) {
    throw new Error(getDebugInfoFromCommandResult(hermesCompilerCommandResult));
  }
}

module.exports = async function runTest(
  globalConfig: {...},
  config: {...},
  environment: {...},
  runtime: {...},
  testPath: string,
): mixed {
  const startTime = Date.now();

  const isOptimizedMode = ENABLE_OPTIMIZED_MODE;

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
  const testJSBundlePath = testBundlePath + '.js';
  const testBytecodeBundlePath = testJSBundlePath + '.hbc';

  fs.mkdirSync(path.dirname(entrypointPath), {recursive: true});
  fs.writeFileSync(entrypointPath, entrypointContents, 'utf8');

  const sourceMapPath = path.join(
    path.dirname(testJSBundlePath),
    path.basename(testJSBundlePath, '.js') + '.map',
  );

  await Metro.runBuild(metroConfig, {
    entry: entrypointPath,
    out: testJSBundlePath,
    platform: 'android',
    minify: isOptimizedMode,
    dev: !isOptimizedMode,
    sourceMap: true,
    sourceMapUrl: sourceMapPath,
  });

  if (isOptimizedMode) {
    generateBytecodeBundle({
      sourcePath: testJSBundlePath,
      bytecodePath: testBytecodeBundlePath,
      isOptimizedMode,
    });
  }

  const rnTesterCommandResult = runBuck2([
    'run',
    getBuckModeForPlatform(isOptimizedMode),
    '//xplat/ReactNative/react-native-cxx/samples/tester:tester',
    '--',
    '--bundlePath',
    testBundlePath,
  ]);

  if (rnTesterCommandResult.status !== 0) {
    throw new Error(getDebugInfoFromCommandResult(rnTesterCommandResult));
  }

  if (PRINT_FANTOM_OUTPUT) {
    console.log(getDebugInfoFromCommandResult(rnTesterCommandResult));
  }

  const rnTesterParsedOutput = parseRNTesterCommandResult(
    rnTesterCommandResult,
  );

  const testResultError = rnTesterParsedOutput.testResult.error;
  if (testResultError) {
    const error = new Error(testResultError.message);
    error.stack = symbolicateStackTrace(sourceMapPath, testResultError.stack);
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
      failureMessages: testResult.failureMessages.map(maybeStackTrace =>
        symbolicateStackTrace(sourceMapPath, maybeStackTrace),
      ),
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
