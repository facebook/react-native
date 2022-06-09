/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import {useState, useCallback, useMemo} from 'react';

import type {
  PlatformTestResult,
  PlatformTestHarness,
  PlatformTestCase,
  PlatformTestAssertionResult,
  PlatformTestContext,
} from './RNTesterPlatformTestTypes';

function didAllAssertionsPass(
  assertions: Array<PlatformTestAssertionResult>,
): boolean {
  const hasFailingAssertion = assertions.some(assertion => !assertion.passing);
  return !hasFailingAssertion;
}

export type PlatformTestHarnessHookResult = $ReadOnly<{|
  testKey: number,
  harness: PlatformTestHarness,
  reset: () => void,
  results: $ReadOnlyArray<PlatformTestResult>,
|}>;

export default function usePlatformTestHarness(): PlatformTestHarnessHookResult {
  const [testResults, updateTestResults] = useState<
    $ReadOnlyArray<PlatformTestResult>,
  >([]);

  // When reseting the test results we should also re-mount the
  // so we apply a key to that component which we can increment
  // to ensure it re-mounts
  const [testElementKey, setTestElementKey] = useState<number>(0);

  const reset = useCallback(() => {
    updateTestResults([]);
    setTestElementKey(k => k + 1);
  }, []);

  const addTestResult = useCallback((newResult: PlatformTestResult) => {
    updateTestResults(prev => [...prev, newResult]);
  }, []);

  const testFunction: PlatformTestHarness['test'] = useCallback(
    (testCase: PlatformTestCase, name: string): void => {
      const assertionResults: Array<PlatformTestAssertionResult> = [];

      const baseAssert = (
        assertionName: string,
        testConditionResult: boolean,
        description: string,
        failureMessage: string,
      ) => {
        if (testConditionResult) {
          assertionResults.push({
            passing: true,
            name: assertionName,
            description,
          });
        } else {
          assertionResults.push({
            passing: false,
            name: assertionName,
            description,
            failureMessage,
          });
        }
      };

      const context: PlatformTestContext = {
        assert_true: (cond: boolean, desc: string) =>
          baseAssert(
            'assert_true',
            cond,
            desc,
            "expected 'true' but recieved 'false'",
          ),
        assert_equals: (a: any, b: any, desc: string) =>
          baseAssert(
            'assert_equal',
            a === b,
            desc,
            `expected ${a} to equal ${b}`,
          ),
        assert_greater_than_equal: (a: number, b: number, desc: string) =>
          baseAssert(
            'assert_greater_than_equal',
            a >= b,
            desc,
            `expected ${a} to be greater than or equal to ${b}`,
          ),
        assert_less_than_equal: (a: number, b: number, desc: string) =>
          baseAssert(
            'assert_less_than_equal',
            a <= b,
            desc,
            `expected ${a} to be less than or equal to ${b}`,
          ),
      };

      try {
        testCase(context);
        addTestResult({
          name,
          status: didAllAssertionsPass(assertionResults) ? 'PASS' : 'FAIL',
          assertions: assertionResults,
          error: null,
        });
      } catch (error) {
        addTestResult({
          name,
          status: 'ERROR',
          assertions: assertionResults,
          error,
        });
      }
    },
    [addTestResult],
  );

  const harness: PlatformTestHarness = useMemo(
    () => ({
      test: testFunction,
    }),
    [testFunction],
  );

  return {
    harness,
    reset,
    results: testResults,
    testKey: testElementKey,
  };
}
