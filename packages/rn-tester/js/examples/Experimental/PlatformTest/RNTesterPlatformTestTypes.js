/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

type BasePlatformTestAssertionResult = $ReadOnly<{|
  name: string,
  description: string,
|}>;

export type PassingPlatformTestAssertionResult = $ReadOnly<{|
  ...BasePlatformTestAssertionResult,
  passing: true,
|}>;

export type FailingPlatformTestAssertionResult = $ReadOnly<{|
  ...BasePlatformTestAssertionResult,
  passing: false,
  failureMessage: string,
|}>;

export type PlatformTestAssertionResult =
  | PassingPlatformTestAssertionResult
  | FailingPlatformTestAssertionResult;

export type PlatformTestResultStatus = 'PASS' | 'FAIL' | 'ERROR' | 'SKIPPED';

export type PlatformTestResult = $ReadOnly<{|
  name: string,
  status: PlatformTestResultStatus,
  assertions: $ReadOnlyArray<PlatformTestAssertionResult>,
  error: mixed | null, // null is technically unnecessary but is kept to ensure the error is described as nullable
|}>;

export type PlatformTestContext = $ReadOnly<{
  assert_true(a: boolean, description: string): void,
  assert_equals(a: any, b: any, description: string): void,
  assert_not_equals(a: any, b: any, description: string): void,
  assert_greater_than_equal(a: number, b: number, description: string): void,
  assert_less_than_equal(a: number, b: number, description: string): void,
}>;

export type PlatformTestCase = (context: PlatformTestContext) => void;

export type AsyncPlatformTest = $ReadOnly<{|
  done(): void,
  step(testcase: PlatformTestCase): void,
|}>;

export type SyncTestOptions = $ReadOnly<{|
  skip?: boolean,
|}>;

export type PlatformTestHarness = $ReadOnly<{|
  test(
    testcase: PlatformTestCase,
    name: string,
    options?: SyncTestOptions,
  ): void,
  useAsyncTest(description: string, timeout?: number): AsyncPlatformTest,
|}>;

export type PlatformTestComponentBaseProps = {
  +harness: PlatformTestHarness,
  ...
};
