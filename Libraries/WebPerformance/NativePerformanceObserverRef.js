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
} from './NativePerformanceObserver';

import {RawPerformanceEntryTypeValues} from './NativePerformanceObserver';

function performanceEntryTypeToRaw(type: string): RawPerformanceEntryType {
  switch (type) {
    case 'mark':
      return RawPerformanceEntryTypeValues.MARK;
    case 'measure':
      return RawPerformanceEntryTypeValues.MEASURE;
    case 'event':
      return RawPerformanceEntryTypeValues.EVENT;
    default:
      throw new TypeError(
        `performanceEntryTypeToRaw: unexpected performance entry type received: ${type}`,
      );
  }
}

const NativePerformanceObserverRef: NativePerformanceObserver = (function () {
  const _reportingType: Set<RawPerformanceEntryType> = new Set();
  let _entries: Array<RawPerformanceEntry> = [];
  let _onPerformanceEntryCallback: ?() => void;

  return {
    startReporting: (entryType: string) => {
      _reportingType.add(performanceEntryTypeToRaw(entryType));
    },

    stopReporting: (entryType: string) => {
      _reportingType.delete(performanceEntryTypeToRaw(entryType));
    },

    popPendingEntries: (): GetPendingEntriesResult => {
      const res = _entries;
      _entries = [];
      return {
        droppedEntriesCount: 0,
        entries: res,
      };
    },

    setOnPerformanceEntryCallback: (callback?: () => void) => {
      _onPerformanceEntryCallback = callback;
    },

    logRawEntry: (entry: RawPerformanceEntry) => {
      if (_reportingType.has(entry.entryType)) {
        _entries.push(entry);
        _onPerformanceEntryCallback?.();
      }
    },
  };
})();

export default NativePerformanceObserverRef;
