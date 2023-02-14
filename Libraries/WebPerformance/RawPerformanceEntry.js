/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

import type {RawPerformanceEntry} from './NativePerformanceObserver';
import type {PerformanceEntryType} from './PerformanceEntry';

import {RawPerformanceEntryType} from './NativePerformanceObserver';
import {PerformanceEntry} from './PerformanceEntry';
import {PerformanceEventTiming} from './PerformanceEventTiming';

export function rawToPerformanceEntry(
  entry: RawPerformanceEntry,
): PerformanceEntry {
  if (entry.entryType === RawPerformanceEntryType.EVENT) {
    return new PerformanceEventTiming({
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
      processingStart: entry.processingStart,
      processingEnd: entry.processingEnd,
      interactionId: entry.interactionId,
    });
  } else {
    return new PerformanceEntry({
      name: entry.name,
      entryType: rawToPerformanceEntryType(entry.entryType),
      startTime: entry.startTime,
      duration: entry.duration,
    });
  }
}

export function rawToPerformanceEntryType(
  type: RawPerformanceEntryType,
): PerformanceEntryType {
  switch (type) {
    case RawPerformanceEntryType.MARK:
      return 'mark';
    case RawPerformanceEntryType.MEASURE:
      return 'measure';
    case RawPerformanceEntryType.EVENT:
      return 'event';
    default:
      throw new TypeError(
        'rawToPerformanceEntryType: unexpected RawPerformanceEntryType received',
      );
  }
}

export function performanceEntryTypeToRaw(
  type: PerformanceEntryType,
): RawPerformanceEntryType {
  switch (type) {
    case 'mark':
      return RawPerformanceEntryType.MARK;
    case 'measure':
      return RawPerformanceEntryType.MEASURE;
    case 'event':
      return RawPerformanceEntryType.EVENT;
    default:
      // Verify exhaustive check with Flow
      (type: empty);
      throw new TypeError(
        `performanceEntryTypeToRaw: unexpected performance entry type received: ${type}`,
      );
  }
}
