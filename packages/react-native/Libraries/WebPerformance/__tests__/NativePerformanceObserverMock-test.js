/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

import NativePerformanceObserverMock from '../__mocks__/NativePerformanceObserver';
import {RawPerformanceEntryTypeValues} from '../RawPerformanceEntry';

describe('NativePerformanceObserver', () => {
  it('correctly starts and stops listening to entries in a nominal scenario', async () => {
    NativePerformanceObserverMock.startReporting(
      RawPerformanceEntryTypeValues.MARK,
    );

    NativePerformanceObserverMock.logRawEntry({
      name: 'mark1',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 10,
    });

    NativePerformanceObserverMock.logRawEntry({
      name: 'mark2',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 20,
    });

    NativePerformanceObserverMock.logRawEntry({
      name: 'event1',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 20,
    });

    const entriesResult = NativePerformanceObserverMock.popPendingEntries();
    expect(entriesResult).not.toBe(undefined);
    const entries = entriesResult.entries;

    expect(entries.length).toBe(2);
    expect(entries[0].name).toBe('mark1');
    expect(entries[1].name).toBe('mark2');

    const entriesResult1 = NativePerformanceObserverMock.popPendingEntries();
    expect(entriesResult1).not.toBe(undefined);
    const entries1 = entriesResult1.entries;
    expect(entries1.length).toBe(0);

    NativePerformanceObserverMock.stopReporting('mark');
  });

  it('correctly clears/gets entries', async () => {
    NativePerformanceObserverMock.logRawEntry({
      name: 'mark1',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 0,
    });

    NativePerformanceObserverMock.logRawEntry({
      name: 'event1',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 0,
    });

    NativePerformanceObserverMock.clearEntries(
      RawPerformanceEntryTypeValues.UNDEFINED,
    );

    expect(NativePerformanceObserverMock.getEntries()).toStrictEqual([]);

    NativePerformanceObserverMock.logRawEntry({
      name: 'entry1',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 0,
    });

    NativePerformanceObserverMock.logRawEntry({
      name: 'entry2',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 0,
    });

    NativePerformanceObserverMock.logRawEntry({
      name: 'entry1',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 0,
    });

    NativePerformanceObserverMock.clearEntries(
      RawPerformanceEntryTypeValues.UNDEFINED,
      'entry1',
    );

    expect(
      NativePerformanceObserverMock.getEntries().map(e => e.name),
    ).toStrictEqual(['entry2']);
  });
});
