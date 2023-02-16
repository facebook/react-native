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

const reportingType: Set<RawPerformanceEntryType> = new Set();
let entries: Array<RawPerformanceEntry> = [];
let onPerformanceEntryCallback: ?() => void;

const NativePerformanceObserverMock: NativePerformanceObserver = {
  startReporting: (entryType: RawPerformanceEntryType) => {
    reportingType.add(entryType);
  },

  stopReporting: (entryType: RawPerformanceEntryType) => {
    reportingType.delete(entryType);
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
      entries.push(entry);
      // $FlowFixMe[incompatible-call]
      global.queueMicrotask(() => {
        // We want to emulate the way it's done in native (i.e. async/batched)
        onPerformanceEntryCallback?.();
      });
    }
  },
};

export default NativePerformanceObserverMock;
