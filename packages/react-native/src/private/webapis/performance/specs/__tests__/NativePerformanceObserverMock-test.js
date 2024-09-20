/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import NativePerformanceObserverMock, { logMockEntry } from '../__mocks__/NativePerformanceObserver';
import {RawPerformanceEntryTypeValues} from '../../RawPerformanceEntry';

describe('NativePerformanceObserver', () => {
  it('correctly clears/gets entries', async () => {

    logMockEntry({
      name: 'mark1',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 0,
    });

    logMockEntry({
      name: 'event1',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 0,
    });

    NativePerformanceObserverMock.clearEntries();

    expect(NativePerformanceObserverMock.getEntries()).toStrictEqual([]);

    logMockEntry({
      name: 'entry1',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 0,
    });

    logMockEntry({
      name: 'entry2',
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime: 0,
      duration: 0,
    });

    logMockEntry({
      name: 'entry1',
      entryType: RawPerformanceEntryTypeValues.EVENT,
      startTime: 0,
      duration: 0,
    });

    NativePerformanceObserverMock.clearEntries(undefined, 'entry1');

    expect(
      NativePerformanceObserverMock.getEntries().map(e => e.name),
    ).toStrictEqual(['entry2']);
  });
});
