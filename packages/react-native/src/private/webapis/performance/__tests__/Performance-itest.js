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

describe('Performance', () => {
  it('measure validates mark names presence in the buffer, if specified', () => {
    expect(() => {
      performance.measure('measure', 'start', 'end');
    }).toThrow(
      "Failed to execute 'measure' on 'Performance': The mark 'start' does not exist.",
    ); // This should also check that Error is an instance of DOMException and is SyntaxError,
    // but toThrow checked currently only supports string argument.

    performance.mark('start');
    expect(() => {
      performance.measure('measure', 'start', 'end');
    }).toThrow(
      "Failed to execute 'measure' on 'Performance': The mark 'end' does not exist.",
    ); // This should also check that Error is an instance of DOMException and is SyntaxError,
    // but toThrow checked currently only supports string argument.

    performance.mark('end');
    expect(() => {
      performance.measure('measure', 'start', 'end');
    }).not.toThrow();
  });
});
