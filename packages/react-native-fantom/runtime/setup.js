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

import type {SnapshotConfig, TestSnapshotResults} from './snapshotContext';

import expect from './expect';
import {createMockFunction} from './mocks';
import {setupSnapshotConfig, snapshotContext} from './snapshotContext';
import nullthrows from 'nullthrows';
import NativeFantom from 'react-native/src/private/specs/modules/NativeFantom';

export type TestCaseResult = {
  ancestorTitles: Array<string>,
  title: string,
  fullName: string,
  status: 'passed' | 'failed' | 'pending',
  duration: number,
  failureMessages: Array<string>,
  numPassingAsserts: number,
  snapshotResults: TestSnapshotResults,
  // location: string,
};

export type TestSuiteResult =
  | {
      testResults: Array<TestCaseResult>,
    }
  | {
      error: {
        message: string,
        stack: string,
      },
    };

const tests: Array<{
  title: string,
  ancestorTitles: Array<string>,
  implementation: () => mixed,
  isFocused: boolean,
  isSkipped: boolean,
  result?: TestCaseResult,
}> = [];

const ancestorTitles: Array<string> = [];

const globalModifiers: Array<'focused' | 'skipped'> = [];

const globalDescribe = (global.describe = (
  title: string,
  implementation: () => mixed,
) => {
  ancestorTitles.push(title);
  implementation();
  ancestorTitles.pop();
});

const globalIt =
  (global.it =
  global.test =
    (title: string, implementation: () => mixed) =>
      tests.push({
        title,
        implementation,
        ancestorTitles: ancestorTitles.slice(),
        isFocused:
          globalModifiers.length > 0 &&
          globalModifiers[globalModifiers.length - 1] === 'focused',
        isSkipped:
          globalModifiers.length > 0 &&
          globalModifiers[globalModifiers.length - 1] === 'skipped',
      }));

// $FlowExpectedError[prop-missing]
global.fdescribe = global.describe.only = (
  title: string,
  implementation: () => mixed,
) => {
  globalModifiers.push('focused');
  globalDescribe(title, implementation);
  globalModifiers.pop();
};

// $FlowExpectedError[prop-missing]
global.it.only =
  global.fit =
  // $FlowExpectedError[prop-missing]
  global.test.only =
    (title: string, implementation: () => mixed) => {
      globalModifiers.push('focused');
      globalIt(title, implementation);
      globalModifiers.pop();
    };

// $FlowExpectedError[prop-missing]
global.xdescribe = global.describe.skip = (
  title: string,
  implementation: () => mixed,
) => {
  globalModifiers.push('skipped');
  globalDescribe(title, implementation);
  globalModifiers.pop();
};

// $FlowExpectedError[prop-missing]
global.it.skip =
  global.xit =
  // $FlowExpectedError[prop-missing]
  global.test.skip =
  global.xtest =
    (title: string, implementation: () => mixed) => {
      globalModifiers.push('skipped');
      globalIt(title, implementation);
      globalModifiers.pop();
    };

global.jest = {
  fn: createMockFunction,
};

global.expect = expect;

function runWithGuard(fn: () => void) {
  try {
    fn();
  } catch (error) {
    let reportedError =
      error instanceof Error ? error : new Error(String(error));
    reportTestSuiteResult({
      error: {
        message: reportedError.message,
        stack: reportedError.stack,
      },
    });
  }
}

function executeTests() {
  const hasFocusedTests = tests.some(test => test.isFocused);

  for (const test of tests) {
    const result: TestCaseResult = {
      title: test.title,
      fullName: [...test.ancestorTitles, test.title].join(' '),
      ancestorTitles: test.ancestorTitles,
      status: 'pending',
      duration: 0,
      failureMessages: [],
      numPassingAsserts: 0,
      snapshotResults: {},
    };

    test.result = result;
    snapshotContext.setTargetTest(result.fullName);

    if (!test.isSkipped && (!hasFocusedTests || test.isFocused)) {
      let status;
      let error;

      const start = Date.now();

      try {
        test.implementation();
        status = 'passed';
      } catch (e) {
        error = e;
        status = 'failed';
      }

      result.status = status;
      result.duration = Date.now() - start;
      result.failureMessages =
        status === 'failed' && error
          ? [error.stack ?? error.message ?? String(error)]
          : [];

      result.snapshotResults = snapshotContext.getSnapshotResults();
    }
  }

  reportTestSuiteResult({
    testResults: tests.map(test => nullthrows(test.result)),
  });
}

function reportTestSuiteResult(testSuiteResult: TestSuiteResult): void {
  NativeFantom.reportTestSuiteResultsJSON(
    JSON.stringify({
      type: 'test-result',
      ...testSuiteResult,
    }),
  );
}

global.$$RunTests$$ = () => {
  executeTests();
};

export function registerTest(
  setUpTest: () => void,
  snapshotConfig: SnapshotConfig,
) {
  setupSnapshotConfig(snapshotConfig);

  runWithGuard(() => {
    setUpTest();
  });
}
