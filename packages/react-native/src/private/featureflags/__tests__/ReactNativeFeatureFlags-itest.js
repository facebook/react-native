/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as ReactNativeFeatureFlags from '../ReactNativeFeatureFlags';
import * as ReactNativeFeatureFlagsBase from '../ReactNativeFeatureFlagsBase';

/**
 * These tests cover the JS-only feature flag behavior that does not require
 * jest.mock() / jest.doMock() / jest.fn() and is therefore convertible to
 * Fantom integration tests.
 *
 * Tests that are NOT convertible (require jest module mocking):
 *  - "should provide default values for common flags and NOT log an error if
 *     the native module is available but the method is NOT defined"
 *  - "should access and cache common flags from the native module if it is available"
 *  - "when the native module is NOT available" (all sub-cases)
 */

beforeEach(() => {
  ReactNativeFeatureFlagsBase.dangerouslyResetForTesting();
});

test('should provide default values for JS-only flags', () => {
  expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(false);
});

test('should access and cache overridden JS-only flags', () => {
  let callCount = 0;
  ReactNativeFeatureFlags.override({
    jsOnlyTestFlag: () => {
      callCount++;
      return true;
    },
  });

  expect(callCount).toBe(0);

  expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(true);
  expect(callCount).toBe(1);

  // Second call should return cached value without calling the override again.
  expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(true);
  expect(callCount).toBe(1);
});

test('should throw an error if any of the JS flags has been accessed before overriding', () => {
  ReactNativeFeatureFlags.jsOnlyTestFlag();

  expect(() =>
    ReactNativeFeatureFlags.override({
      jsOnlyTestFlag: () => true,
    }),
  ).toThrow(
    'Feature flags were accessed before being overridden: jsOnlyTestFlag',
  );
});

test('should NOT throw an error if any of the common flags has been accessed before overriding', () => {
  ReactNativeFeatureFlags.commonTestFlag();

  expect(() => {
    ReactNativeFeatureFlags.override({
      jsOnlyTestFlag: () => true,
    });
  }).not.toThrow();

  expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(true);
});

test('should throw an error when trying to set overrides twice', () => {
  ReactNativeFeatureFlags.override({
    jsOnlyTestFlag: () => true,
  });

  expect(() =>
    ReactNativeFeatureFlags.override({
      jsOnlyTestFlag: () => false,
    }),
  ).toThrow('Feature flags cannot be overridden more than once');
});

test('should evaluate to default value if the override returns null', () => {
  ReactNativeFeatureFlags.override({
    // $FlowExpectedError[incompatible-call]
    jsOnlyTestFlag: () => null,
  });

  expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(false);
});

test('should evaluate to default value if the override returns undefined', () => {
  ReactNativeFeatureFlags.override({
    // $FlowExpectedError[incompatible-call]
    jsOnlyTestFlag: () => undefined,
  });

  expect(ReactNativeFeatureFlags.jsOnlyTestFlag()).toBe(false);
});
