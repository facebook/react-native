/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {
  NativeBatchedObserverCallback,
  RawPerformanceEntry,
  RawPerformanceEntryType,
  OpaqueNativeObserverHandle,
  PerformanceObserverInit,
  Spec as NativePerformanceObserver,
} from '../NativePerformanceObserver';

import {RawPerformanceEntryTypeValues} from '../../RawPerformanceEntry';

jest.mock(
  '../NativePerformance',
  () => require('../__mocks__/NativePerformance').default,
);

jest.mock(
  '../NativePerformanceObserver',
  () => require('../__mocks__/NativePerformanceObserver').default,
);

const eventCounts: Map<string, number> = new Map();
let observers: MockObserver[] = [];
let entries: Array<RawPerformanceEntry> = [];

export function logMockEntry(entry: RawPerformanceEntry) {
  entries.push(entry);

  if (entry.entryType === RawPerformanceEntryTypeValues.EVENT) {
    eventCounts.set(entry.name, (eventCounts.get(entry.name) ?? 0) + 1);
  }

  for (const observer of observers) {
    if (
      observer.options.type !== entry.entryType &&
      !observer.options.entryTypes?.includes(entry.entryType)
    ) {
      continue;
    }

    if (entry.entryType === RawPerformanceEntryTypeValues.EVENT) {
      const {durationThreshold = 0} = observer.options;
      if (durationThreshold > 0 && entry.duration < durationThreshold) {
        continue;
      }
    }

    observer.entries.push(entry);

    // $FlowFixMe[incompatible-call]
    global.queueMicrotask(() => {
      // We want to emulate the way it's done in native (i.e. async/batched)
      observer.callback();
    });
  }
}

type MockObserver = {
  callback: NativeBatchedObserverCallback,
  entries: Array<RawPerformanceEntry>,
  options: PerformanceObserverInit,
  droppedEntriesCount: number,
};

const NativePerformanceObserverMock: NativePerformanceObserver = {
  getEventCounts: (): $ReadOnlyArray<[string, number]> => {
    return Array.from(eventCounts.entries());
  },

  createObserver: (
    callback: NativeBatchedObserverCallback,
  ): OpaqueNativeObserverHandle => {
    const observer: MockObserver = {
      callback,
      entries: [],
      options: {},
      droppedEntriesCount: 0,
    };

    return observer;
  },

  getDroppedEntriesCount: (observer: OpaqueNativeObserverHandle): number => {
    // $FlowFixMe
    const mockObserver = (observer: any) as MockObserver;
    return mockObserver.droppedEntriesCount;
  },

  observe: (
    observer: OpaqueNativeObserverHandle,
    options: PerformanceObserverInit,
  ): void => {
    // $FlowFixMe
    const mockObserver = (observer: any) as MockObserver;
    mockObserver.options = options;
    observers.push(mockObserver);
  },

  disconnect: (observer: OpaqueNativeObserverHandle): void => {
    // $FlowFixMe
    const mockObserver = (observer: any) as MockObserver;
    observers = observers.filter(e => e !== mockObserver);
  },

  takeRecords: (
    observer: OpaqueNativeObserverHandle,
  ): $ReadOnlyArray<RawPerformanceEntry> => {
    // $FlowFixMe
    const mockObserver = (observer: any) as MockObserver;
    const observerEntries = mockObserver.entries;
    mockObserver.entries = [];
    return observerEntries;
  },

  clearEntries: (entryType?: RawPerformanceEntryType, entryName?: string) => {
    entries = entries.filter(
      e =>
        (entryType != null && e.entryType !== entryType) ||
        (entryName != null && e.name !== entryName),
    );
  },

  getEntries: (
    entryType?: RawPerformanceEntryType,
    entryName?: string,
  ): $ReadOnlyArray<RawPerformanceEntry> => {
    return entries.filter(
      e =>
        (entryType == null || e.entryType === entryType) &&
        (entryName == null || e.name === entryName),
    );
  },

  getSupportedPerformanceEntryTypes:
    (): $ReadOnlyArray<RawPerformanceEntryType> => {
      return [
        RawPerformanceEntryTypeValues.MARK,
        RawPerformanceEntryTypeValues.MEASURE,
        RawPerformanceEntryTypeValues.EVENT,
      ];
    },
};

export default NativePerformanceObserverMock;
