/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TestSuiteResult} from '../runtime/setup';
import type {
  AsyncCommandResult,
  ConsoleLogMessage,
  HermesVariant,
} from './utils';

import entrypointTemplate from './entrypoint-template';
import * as EnvironmentOptions from './EnvironmentOptions';
import formatFantomConfig from './formatFantomConfig';
import getFantomTestConfig from './getFantomTestConfig';
import {FantomTestConfigMode} from './getFantomTestConfig';
import {
  getInitialSnapshotData,
  updateSnapshotsAndGetJestSnapshotResult,
} from './snapshotUtils';
import {
  getBuckModesForPlatform,
  getBuckOptionsForHermes,
  getDebugInfoFromCommandResult,
  getHermesCompilerTarget,
  getShortHash,
  isRunningFromCI,
  printConsoleLog,
  runBuck2,
  runBuck2Sync,
  symbolicateStackTrace,
} from './utils';
import fs from 'fs';
// $FlowExpectedError[untyped-import]
import {formatResultsErrors} from 'jest-message-util';
import {SnapshotState, buildSnapshotResolver} from 'jest-snapshot';
import Metro from 'metro';
import nullthrows from 'nullthrows';
import path from 'path';
import readline from 'readline';

const BUILD_OUTPUT_ROOT = path.resolve(__dirname, '..', 'build');
fs.mkdirSync(BUILD_OUTPUT_ROOT, {recursive: true});
const BUILD_OUTPUT_PATH = fs.mkdtempSync(
  path.join(BUILD_OUTPUT_ROOT, `run-${Date.now()}-`),
);

async function processRNTesterCommandResult(
  result: AsyncCommandResult,
): Promise<TestSuiteResult> {
  const stdoutChunks = [];
  const stderrChunks = [];

  result.childProcess.stdout.on('data', chunk => {
    stdoutChunks.push(chunk);
  });

  result.childProcess.stderr.on('data', chunk => {
    stderrChunks.push(chunk);
  });

  let testResult;

  const rl = readline.createInterface({input: result.childProcess.stdout});
  rl.on('line', (rawLine: string) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    let parsed: ConsoleLogMessage;
    try {
      parsed = JSON.parse(line);
    } catch {
      parsed = {
        type: 'console-log',
        level: 'info',
        message: line,
      };
    }

    switch (parsed?.type) {
      case 'test-result':
        testResult = parsed;
        break;
      case 'console-log':
        printConsoleLog(parsed);
        break;
      default:
        printConsoleLog({
          type: 'console-log',
          level: 'info',
          message: line,
        });
        break;
    }
  });

  await result.done;

  const getResultWithOutput = () => ({
    ...result,
    stdout: stdoutChunks.join(''),
    stderr: stderrChunks.join(''),
  });

  if (result.status !== 0) {
    throw new Error(getDebugInfoFromCommandResult(getResultWithOutput()));
  }

  if (EnvironmentOptions.printCLIOutput) {
    console.log(getDebugInfoFromCommandResult(getResultWithOutput()));
  }

  if (testResult == null) {
    throw new Error(
      'Failed to find test results in RN tester binary output.\n' +
        getDebugInfoFromCommandResult(result),
    );
  }

  return testResult;
}

function generateBytecodeBundle({
  sourcePath,
  bytecodePath,
  isOptimizedMode,
  hermesVariant,
}: {
  sourcePath: string,
  bytecodePath: string,
  isOptimizedMode: boolean,
  hermesVariant: HermesVariant,
}): void {
  const hermesCompilerCommandResult = runBuck2Sync(
    [
      'run',
      ...getBuckModesForPlatform(isOptimizedMode),
      ...getBuckOptionsForHermes(hermesVariant),
      getHermesCompilerTarget(hermesVariant),
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
    reactInternalFeatureFlags: testConfig.flags.reactInternal,
    snapshotConfig: {
      updateSnapshot: snapshotState._updateSnapshot,
      data: getInitialSnapshotData(snapshotState),
    },
    isRunningFromCI: isRunningFromCI(),
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
      hermesVariant: testConfig.hermesVariant,
    });
  }

  const rnTesterCommandResult = runBuck2(
    [
      'run',
      ...getBuckModesForPlatform(
        testConfig.mode === FantomTestConfigMode.Optimized,
      ),
      ...getBuckOptionsForHermes(testConfig.hermesVariant),
      '//xplat/ReactNative/react-native-cxx/samples/tester:tester',
      '--',
      '--bundlePath',
      testConfig.mode === FantomTestConfigMode.DevelopmentWithSource
        ? testJSBundlePath
        : testBytecodeBundlePath,
      '--featureFlags',
      JSON.stringify(testConfig.flags.common),
      '--minLogLevel',
      EnvironmentOptions.printCLIOutput ? 'info' : 'error',
    ],
    {
      withFDB: EnvironmentOptions.enableCppDebugging,
    },
  );

  const processedResult = await processRNTesterCommandResult(
    rnTesterCommandResult,
  );

  const testResultError = processedResult.error;
  if (testResultError) {
    const error = new Error(testResultError.message);
    error.stack = symbolicateStackTrace(sourceMapPath, testResultError.stack);
    throw error;
  }

  const endTime = Date.now();

  const testResults =
    nullthrows(processedResult.testResults).map(testResult => ({
      ancestorTitles: [] as Array<string>,
      failureDetails: [] as Array<string>,
      testFilePath: testPath,
      ...testResult,
      failureMessages: testResult.failureMessages.map(maybeStackTrace =>
        symbolicateStackTrace(sourceMapPath, maybeStackTrace),
      ),
    })) ?? [];

  // Display the Fantom test configuration as a suffix of the name of the root
  // `describe` block of the test, or adds one if the test doesn't have it.
  const maybeCommonAncestor = testResults[0]?.ancestorTitles?.[0];
  if (
    maybeCommonAncestor != null &&
    testResults.every(
      result => result.ancestorTitles?.[0] === maybeCommonAncestor,
    )
  ) {
    testResults.forEach(result => {
      const formattedFantomConfig = formatFantomConfig(testConfig);
      if (formattedFantomConfig) {
        result.ancestorTitles[0] += ` (${formattedFantomConfig})`;
      }
    });
  } else {
    testResults.forEach(result => {
      const formattedFantomConfig = formatFantomConfig(testConfig);
      if (formattedFantomConfig) {
        result.ancestorTitles.unshift(
          `${path.basename(testPath, '-itest.js')} (${formatFantomConfig(testConfig)})`,
        );
      }
    });
  }

  const snapshotResults = nullthrows(processedResult.testResults).map(
    testResult => testResult.snapshotResults,
  );

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
