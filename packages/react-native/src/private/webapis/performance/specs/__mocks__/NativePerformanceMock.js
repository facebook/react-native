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
  NativeMemoryInfo,
  NativePerformanceMarkResult,
  NativePerformanceMeasureResult,
  OpaqueNativeObserverHandle,
  PerformanceObserverInit,
  RawPerformanceEntry,
  RawPerformanceEntryType,
  ReactNativeStartupTiming,
} from '../NativePerformance';
import typeof NativePerformance from '../NativePerformance';

import {RawPerformanceEntryTypeValues} from '../../RawPerformanceEntry';

type MockObserver = {
  handleEntry: (entry: RawPerformanceEntry) => void,
  callback: NativeBatchedObserverCallback,
  didScheduleFlushBuffer: boolean,
  entries: Array<RawPerformanceEntry>,
  options: PerformanceObserverInit,
  droppedEntriesCount: number,
};

const eventCounts: Map<string, number> = new Map();
const observers: Set<MockObserver> = new Set();
const marks: Map<string, number> = new Map();
let entries: Array<RawPerformanceEntry> = [];

function getMockObserver(
  opaqueNativeObserverHandle: OpaqueNativeObserverHandle,
): MockObserver {
  return opaqueNativeObserverHandle as $FlowFixMe as MockObserver;
}

function createMockObserver(callback: NativeBatchedObserverCallback) {
  const observer: MockObserver = {
    callback,
    didScheduleFlushBuffer: false,
    entries: [],
    options: {},
    droppedEntriesCount: 0,
    handleEntry: (entry: RawPerformanceEntry) => {
      if (
        observer.options.type !== entry.entryType &&
        !observer.options.entryTypes?.includes(entry.entryType)
      ) {
        return;
      }

      if (
        entry.entryType === RawPerformanceEntryTypeValues.EVENT &&
        entry.duration < (observer.options?.durationThreshold ?? 0)
      ) {
        return;
      }

      observer.entries.push(entry);

      if (!observer.didScheduleFlushBuffer) {
        observer.didScheduleFlushBuffer = true;
        // $FlowFixMe[incompatible-call]
        global.queueMicrotask(() => {
          observer.didScheduleFlushBuffer = false;
          // We want to emulate the way it's done in native (i.e. async/batched)
          observer.callback();
        });
      }
    },
  };

  return observer;
}

export function reportEntry(entry: RawPerformanceEntry) {
  entries.push(entry);

  switch (entry.entryType) {
    case RawPerformanceEntryTypeValues.MARK:
      marks.set(entry.name, entry.startTime);
      break;
    case RawPerformanceEntryTypeValues.MEASURE:
      break;
    case RawPerformanceEntryTypeValues.EVENT:
      eventCounts.set(entry.name, (eventCounts.get(entry.name) ?? 0) + 1);
      break;
  }

  for (const observer of observers) {
    observer.handleEntry(entry);
  }
}

let currentTime: number = 12;

const NativePerformanceMock = {
  setCurrentTime: (time: number): void => {
    currentTime = time;
  },

  now: (): number => currentTime,

  markWithResult: (
    name: string,
    startTime?: number,
  ): NativePerformanceMarkResult => {
    const computedStartTime = startTime ?? performance.now();

    marks.set(name, computedStartTime);
    reportEntry({
      entryType: RawPerformanceEntryTypeValues.MARK,
      name,
      startTime: computedStartTime,
      duration: 0,
    });

    return computedStartTime;
  },

  measureWithResult: (
    name: string,
    startTime: number,
    endTime: number,
    duration?: number,
    startMark?: string,
    endMark?: string,
  ): NativePerformanceMeasureResult => {
    const start = startMark != null ? marks.get(startMark) : startTime;
    const end = endMark != null ? marks.get(endMark) : endTime;

    if (start === undefined) {
      throw new Error('startMark does not exist');
    }

    if (end === undefined) {
      throw new Error('endMark does not exist');
    }

    const computedDuration = duration ?? end - start;
    reportEntry({
      entryType: RawPerformanceEntryTypeValues.MEASURE,
      name,
      startTime: start,
      duration: computedDuration,
    });

    return [start, computedDuration];
  },

  getSimpleMemoryInfo: (): NativeMemoryInfo => {
    return {};
  },

  getReactNativeStartupTiming: (): ReactNativeStartupTiming => {
    return {
      startTime: 0,
      endTime: 0,
      executeJavaScriptBundleEntryPointStart: 0,
      executeJavaScriptBundleEntryPointEnd: 0,
      initializeRuntimeStart: 0,
      initializeRuntimeEnd: 0,
    };
  },

  getEventCounts: (): $ReadOnlyArray<[string, number]> => {
    return Array.from(eventCounts.entries());
  },

  createObserver: (
    callback: NativeBatchedObserverCallback,
  ): OpaqueNativeObserverHandle => {
    return createMockObserver(callback);
  },

  getDroppedEntriesCount: (observer: OpaqueNativeObserverHandle): number => {
    return getMockObserver(observer).droppedEntriesCount;
  },

  observe: (
    observer: OpaqueNativeObserverHandle,
    options: PerformanceObserverInit,
  ): void => {
    const mockObserver = getMockObserver(observer);
    mockObserver.options = options;
    observers.add(mockObserver);
  },

  disconnect: (observer: OpaqueNativeObserverHandle): void => {
    const mockObserver = getMockObserver(observer);
    observers.delete(mockObserver);
  },

  takeRecords: (
    observer: OpaqueNativeObserverHandle,
  ): $ReadOnlyArray<RawPerformanceEntry> => {
    const mockObserver = getMockObserver(observer);
    const observerEntries = mockObserver.entries;
    mockObserver.entries = [];
    return observerEntries.sort((a, b) => a.startTime - b.startTime);
  },

  clearMarks: (entryName?: string) => {
    if (entryName != null) {
      marks.delete(entryName);
    } else {
      marks.clear();
    }

    entries = entries.filter(
      entry =>
        entry.entryType !== RawPerformanceEntryTypeValues.MARK ||
        (entryName != null && entry.name !== entryName),
    );
  },

  clearMeasures: (entryName?: string) => {
    entries = entries.filter(
      entry =>
        entry.entryType !== RawPerformanceEntryTypeValues.MEASURE ||
        (entryName != null && entry.name !== entryName),
    );
  },

  getEntries: (): $ReadOnlyArray<RawPerformanceEntry> => {
    return [...entries].sort((a, b) => a.startTime - b.startTime);
  },

  getEntriesByName: (
    entryName: string,
    entryType?: ?RawPerformanceEntryType,
  ): $ReadOnlyArray<RawPerformanceEntry> => {
    return NativePerformanceMock.getEntries().filter(
      entry =>
        (entryType == null || entry.entryType === entryType) &&
        entry.name === entryName,
    );
  },

  getEntriesByType: (
    entryType: RawPerformanceEntryType,
  ): $ReadOnlyArray<RawPerformanceEntry> => {
    return entries.filter(entry => entry.entryType === entryType);
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

(NativePerformanceMock: NativePerformance);

export default NativePerformanceMock;
