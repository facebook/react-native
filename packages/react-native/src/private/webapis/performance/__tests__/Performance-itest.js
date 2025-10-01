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

  describe('now', () => {
    it('provides increasing timestamps since boot time', () => {
      const first = performance.now();
      const second = performance.now();
      const third = performance.now();

      expect(typeof first).toBe('number');
      expect(typeof second).toBe('number');
      expect(typeof third).toBe('number');

      expect(first).toBeGreaterThan(0);
      expect(second).toBeGreaterThan(first);
      expect(third).toBeGreaterThan(second);
    });
  });

  describe('timeOrigin', () => {
    it('allows moving timestamps to Unix epoch', () => {
      // We need to truncate timestamps because `Date.now()` only provides
      // integer millisecond precision.
      const adjustedMonotonicTime = Math.trunc(
        performance.now() + performance.timeOrigin,
      );
      const wallTime = Date.now();
      const adjustedMonotonicTimeAfter = Math.trunc(
        performance.now() + performance.timeOrigin,
      );

      expect(wallTime).toBeGreaterThanOrEqual(adjustedMonotonicTime);
      expect(adjustedMonotonicTimeAfter).toBeGreaterThanOrEqual(wallTime);
    });
  });
});
