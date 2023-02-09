/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import {RawPerformanceEntryTypeValues} from '../NativePerformanceObserver';
import NativePerformanceObserverRef from '../NativePerformanceObserverRef';

describe('NativePerformanceObserver', () => {
  it('correctly starts and stops listening to entries in a nominal scenario', async () => {
    NativePerformanceObserverRef.startReporting('mark');

    NativePerformanceObserverRef.logRawEntry({
      name: 'mark1',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 10,
    });

    NativePerformanceObserverRef.logRawEntry({
      name: 'mark2',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 20,
    });

    NativePerformanceObserverRef.logRawEntry({
      name: 'event1',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 20,
    });

    const entriesResult = NativePerformanceObserverRef.popPendingEntries();
    expect(entriesResult).not.toBe(undefined);
    const entries = entriesResult.entries;

    expect(entries.length).toBe(2);
    expect(entries[0].name).toBe('mark1');
    expect(entries[1].name).toBe('mark2');

    const entriesResult1 = NativePerformanceObserverRef.popPendingEntries();
    expect(entriesResult1).not.toBe(undefined);
    const entries1 = entriesResult1.entries;
    expect(entries1.length).toBe(0);

    NativePerformanceObserverRef.stopReporting('mark');
  });
});
