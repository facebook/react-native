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
  GetPendingEntriesResult,
  RawPerformanceEntry,
  RawPerformanceEntryType,
  Spec as NativePerformanceObserver,
} from '../NativePerformanceObserver';

import {RawPerformanceEntryTypeValues} from '../RawPerformanceEntry';

const reportingType: Set<RawPerformanceEntryType> = new Set();
const eventCounts: Map<string, number> = new Map();
const durationThresholds: Map<RawPerformanceEntryType, number> = new Map();
let entries: Array<RawPerformanceEntry> = [];
let onPerformanceEntryCallback: ?() => void;

const NativePerformanceObserverMock: NativePerformanceObserver = {
  startReporting: (entryType: RawPerformanceEntryType) => {
    reportingType.add(entryType);
  },

  stopReporting: (entryType: RawPerformanceEntryType) => {
    reportingType.delete(entryType);
    durationThresholds.delete(entryType);
  },

  popPendingEntries: (): GetPendingEntriesResult => {
    const res = entries;
    entries = [];
    return {
      droppedEntriesCount: 0,
      entries: res,
    };
  },

  setOnPerformanceEntryCallback: (callback?: () => void) => {
    onPerformanceEntryCallback = callback;
  },

  logRawEntry: (entry: RawPerformanceEntry) => {
    if (reportingType.has(entry.entryType)) {
      const durationThreshold = durationThresholds.get(entry.entryType);
      if (
        durationThreshold !== undefined &&
        entry.duration < durationThreshold
      ) {
        return;
      }
      entries.push(entry);
      // $FlowFixMe[incompatible-call]
      global.queueMicrotask(() => {
        // We want to emulate the way it's done in native (i.e. async/batched)
        onPerformanceEntryCallback?.();
      });
    }
    if (entry.entryType === RawPerformanceEntryTypeValues.EVENT) {
      eventCounts.set(entry.name, (eventCounts.get(entry.name) ?? 0) + 1);
    }
  },

  getEventCounts: (): $ReadOnlyArray<[string, number]> => {
    return Array.from(eventCounts.entries());
  },

  setDurationThreshold: (
    entryType: RawPerformanceEntryType,
    durationThreshold: number,
  ) => {
    durationThresholds.set(entryType, durationThreshold);
  },
};

export default NativePerformanceObserverMock;
