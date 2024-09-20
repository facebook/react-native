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

const eventCounts: Map<string, number> = new Map();
const observers = new WeakSet<MockObserver>();
let entries: Array<RawPerformanceEntry> = [];

export function logMockEntry(entry: RawPerformanceEntry) {
  entries.push(entry);
}

type MockObserver = {
  callback: NativeBatchedObserverCallback,
  entries: Array<RawPerformanceEntry>,
  options: PerformanceObserverInit,
  droppedEntriesCount: number
};

const NativePerformanceObserverMock: NativePerformanceObserver = {
  getEventCounts: (): $ReadOnlyArray<[string, number]> => {
    return Array.from(eventCounts.entries());
  },

  createObserver: (callback: NativeBatchedObserverCallback): OpaqueNativeObserverHandle => {
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

  observe: (observer: OpaqueNativeObserverHandle, options: PerformanceObserverInit): void => {
    // $FlowFixMe
    const mockObserver = (observer: any) as MockObserver;
    mockObserver.options = options;
    observers.add(mockObserver);
  },

  disconnect: (observer: OpaqueNativeObserverHandle): void => {
    // $FlowFixMe
    const mockObserver = (observer: any) as MockObserver;
    observers.delete(mockObserver);
  },

  takeRecords: (observer: OpaqueNativeObserverHandle): $ReadOnlyArray<RawPerformanceEntry> => {
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
