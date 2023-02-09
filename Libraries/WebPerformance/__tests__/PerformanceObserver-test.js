/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import NativePerformanceObserver from '../NativePerformanceObserver';
import PerformanceObserver from '../PerformanceObserver';

describe('PerformanceObserver', () => {
  it('is backed by an existing NativePerformanceObserver implementation', async () => {
    expect(NativePerformanceObserver).not.toBe(undefined);

    const observer = new PerformanceObserver((list, _observer) => {});
    expect(() => observer.observe({entryTypes: []})).not.toThrow();
    observer.disconnect();
  });
});
