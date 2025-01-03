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
import type {ConsoleLogMessage} from './utils';

import entrypointTemplate from './entrypoint-template';
import getFantomTestConfig from './getFantomTestConfig';
import {FantomTestConfigMode} from './getFantomTestConfig';
import {
  getInitialSnapshotData,
  updateSnapshotsAndGetJestSnapshotResult,
} from './snapshotUtils';
import {
  getBuckModesForPlatform,
  getDebugInfoFromCommandResult,
  getShortHash,
  printConsoleLogs,
  runBuck2,
  symbolicateStackTrace,
} from './utils';
import fs from 'fs';
// $FlowExpectedError[untyped-import]
import {formatResultsErrors} from 'jest-message-util';
import {SnapshotState, buildSnapshotResolver} from 'jest-snapshot';
import Metro from 'metro';
import nullthrows from 'nullthrows';
import path from 'path';

const BUILD_OUTPUT_ROOT = path.resolve(__dirname, '..', 'build');
fs.mkdirSync(BUILD_OUTPUT_ROOT, {recursive: true});
const BUILD_OUTPUT_PATH = fs.mkdtempSync(
  path.join(BUILD_OUTPUT_ROOT, `run-${Date.now()}-`),
);

const PRINT_FANTOM_OUTPUT: false = false;

function parseRNTesterCommandResult(result: ReturnType<typeof runBuck2>): {
  logs: $ReadOnlyArray<ConsoleLogMessage>,
  testResult: TestSuiteResult,
} {
  const stdout = result.stdout.toString();

  const logs = [];
  let testResult;

  const lines = stdout
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {}

    switch (parsed?.type) {
      case 'test-result':
        testResult = parsed;
        break;
      case 'console-log':
        logs.push(parsed);
        break;
      default:
        logs.push({
          type: 'console-log',
          message: line,
          level: 'info',
        });
        break;
    }
  }

  if (testResult == null) {
    throw new Error(
      'Failed to find test results in RN tester binary output.\n' +
        getDebugInfoFromCommandResult(result),
    );
  }

  return {logs, testResult};
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
  const hermesCompilerCommandResult = runBuck2(
    [
      'run',
      ...getBuckModesForPlatform(isOptimizedMode),
      '//xplat/hermes/tools/hermesc:hermesc',
      '--',
      '-emit-binary',
      isOptimizedMode ? '-O' : null,
      '-max-diagnostic-width',
      '80',
      '-out',
      bytecodePath,
      sourcePath,
    ].filter(Boolean),
  );

  if (hermesCompilerCommandResult.status !== 0) {
    throw new Error(getDebugInfoFromCommandResult(hermesCompilerCommandResult));
  }
}

module.exports = async function runTest(
  globalConfig: {
    updateSnapshot: 'all' | 'new' | 'none',
    ...
  },
  config: {
    rootDir: string,
    prettierPath: string,
    snapshotFormat: {...},
    ...
  },
  environment: {...},
  runtime: {...},
  testPath: string,
): mixed {
  const snapshotResolver = await buildSnapshotResolver(config);
  const snapshotPath = snapshotResolver.resolveSnapshotPath(testPath);
  const snapshotState = new SnapshotState(snapshotPath, {
    updateSnapshot: globalConfig.updateSnapshot,
    snapshotFormat: config.snapshotFormat,
    prettierPath: config.prettierPath,
    rootDir: config.rootDir,
  });

  const startTime = Date.now();

  const testConfig = getFantomTestConfig(testPath);

  const metroConfig = await Metro.loadConfig({
    config: path.resolve(__dirname, '..', 'config', 'metro.config.js'),
  });

  const setupModulePath = path.resolve(__dirname, '../runtime/setup.js');
  const featureFlagsModulePath = path.resolve(
    __dirname,
    '../../react-native/src/private/featureflags/ReactNativeFeatureFlags.js',
  );

  const entrypointContents = entrypointTemplate({
    testPath: `${path.relative(BUILD_OUTPUT_PATH, testPath)}`,
    setupModulePath: `${path.relative(BUILD_OUTPUT_PATH, setupModulePath)}`,
    featureFlagsModulePath: `${path.relative(BUILD_OUTPUT_PATH, featureFlagsModulePath)}`,
    featureFlags: testConfig.flags.jsOnly,
    snapshotConfig: {
      updateSnapshot: snapshotState._updateSnapshot,
      data: getInitialSnapshotData(snapshotState),
    },
  });

  const entrypointPath = path.join(
    BUILD_OUTPUT_PATH,
    `${getShortHash(entrypointContents)}-${path.basename(testPath)}`,
  );
  const testJSBundlePath = entrypointPath + '.bundle.js';
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
    minify: testConfig.mode === FantomTestConfigMode.Optimized,
    dev: testConfig.mode !== FantomTestConfigMode.Optimized,
    sourceMap: true,
    sourceMapUrl: sourceMapPath,
  });

  if (testConfig.mode !== FantomTestConfigMode.DevelopmentWithSource) {
    generateBytecodeBundle({
      sourcePath: testJSBundlePath,
      bytecodePath: testBytecodeBundlePath,
      isOptimizedMode: testConfig.mode === FantomTestConfigMode.Optimized,
    });
  }

  const rnTesterCommandResult = runBuck2([
    'run',
    ...getBuckModesForPlatform(
      testConfig.mode === FantomTestConfigMode.Optimized,
    ),
    '//xplat/ReactNative/react-native-cxx/samples/tester:tester',
    '--',
    '--bundlePath',
    testConfig.mode === FantomTestConfigMode.DevelopmentWithSource
      ? testJSBundlePath
      : testBytecodeBundlePath,
    '--featureFlags',
    JSON.stringify(testConfig.flags.common),
    '--minLogLevel',
    PRINT_FANTOM_OUTPUT ? 'info' : 'error',
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
    printConsoleLogs(rnTesterParsedOutput.logs);
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

  const snapshotResults = nullthrows(
    rnTesterParsedOutput.testResult.testResults,
  ).map(testResult => testResult.snapshotResults);

  const snapshotResult = updateSnapshotsAndGetJestSnapshotResult(
    snapshotState,
    snapshotResults,
  );

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
    snapshot: snapshotResult,
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
