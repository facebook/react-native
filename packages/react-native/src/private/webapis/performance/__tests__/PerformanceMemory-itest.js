/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type Performance from '../Performance';

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

declare var performance: Performance;

describe('performance.memory', () => {
  it('provides memory info', () => {
    const memoryInfo = performance.memory;

    expect(memoryInfo.usedJSHeapSize).toBeGreaterThan(0);
    expect(memoryInfo.totalJSHeapSize).toBeGreaterThan(0);
  });

  it('always returns a new object', () => {
    expect(performance.memory).not.toBe(performance.memory);
  });
});
