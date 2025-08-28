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

describe('Performance', () => {
  it('does NOT allow creating instances of Performance directly', () => {
    expect(() => {
      return new Performance();
    }).toThrow("Failed to construct 'Performance': Illegal constructor");
  });

  it('does NOT allow creating instances of PerformanceEntry directly', () => {
    expect(() => {
      return new PerformanceEntry();
    }).toThrow("Failed to construct 'PerformanceEntry': Illegal constructor");
  });
});
