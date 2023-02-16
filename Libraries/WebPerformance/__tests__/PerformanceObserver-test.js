/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import {RawPerformanceEntryTypeValues} from '../RawPerformanceEntry';

// NOTE: Jest mocks of transitive dependencies don't appear to work with
// ES6 module imports, therefore forced to use commonjs style imports here.
const NativePerformanceObserver = require('../NativePerformanceObserver');
const PerformanceObserver = require('../PerformanceObserver').default;

jest.mock(
  '../NativePerformanceObserver',
  () => require('../__mocks__/NativePerformanceObserver').default,
);

describe('PerformanceObserver', () => {
  it('can be mocked by a reference NativePerformanceObserver implementation', async () => {
    expect(NativePerformanceObserver).not.toBe(undefined);

    let totalEntries = 0;
    const observer = new PerformanceObserver((list, _observer) => {
      const entries = list.getEntries();
      expect(entries).toHaveLength(1);
      const entry = entries[0];
      expect(entry.name).toBe('mark1');
      expect(entry.entryType).toBe('mark');
      totalEntries += entries.length;
    });
    expect(() => observer.observe({entryTypes: ['mark']})).not.toThrow();

    NativePerformanceObserver.logRawEntry({
      name: 'mark1',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 0,
    });

    await jest.runAllTicks();
    expect(totalEntries).toBe(1);
    observer.disconnect();
  });
});
