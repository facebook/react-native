/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

import type {PerformanceEntryType} from './PerformanceEntry';
import type {
  RawPerformanceEntry,
  RawPerformanceEntryType,
} from './specs/NativePerformance';

import {PerformanceEventTiming} from './EventTiming';
import {PerformanceLongTaskTiming} from './LongTasks';
import {PerformanceEntry} from './PerformanceEntry';
import {PerformanceMark, PerformanceMeasure} from './UserTiming';

export const RawPerformanceEntryTypeValues = {
  MARK: 1,
  MEASURE: 2,
  EVENT: 3,
  LONGTASK: 4,
};

export function rawToPerformanceEntry(
  entry: RawPerformanceEntry,
): PerformanceEntry {
  if (entry.entryType === RawPerformanceEntryTypeValues.EVENT) {
    return new PerformanceEventTiming({
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
      processingStart: entry.processingStart,
      processingEnd: entry.processingEnd,
      interactionId: entry.interactionId,
    });
  } else if (entry.entryType === RawPerformanceEntryTypeValues.LONGTASK) {
    return new PerformanceLongTaskTiming({
      name: entry.name,
      entryType: rawToPerformanceEntryType(entry.entryType),
      startTime: entry.startTime,
      duration: entry.duration,
    });
  } else if (entry.entryType === RawPerformanceEntryTypeValues.MARK) {
    return new PerformanceMark(entry.name, {
      startTime: entry.startTime,
    });
  } else if (entry.entryType === RawPerformanceEntryTypeValues.MEASURE) {
    return new PerformanceMeasure(entry.name, {
      startTime: entry.startTime,
      duration: entry.duration,
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
    case RawPerformanceEntryTypeValues.MARK:
      return 'mark';
    case RawPerformanceEntryTypeValues.MEASURE:
      return 'measure';
    case RawPerformanceEntryTypeValues.EVENT:
      return 'event';
    case RawPerformanceEntryTypeValues.LONGTASK:
      return 'longtask';
    default:
      throw new TypeError(
        `rawToPerformanceEntryType: unexpected performance entry type received: ${type}`,
      );
  }
}

export function performanceEntryTypeToRaw(
  type: PerformanceEntryType,
): RawPerformanceEntryType {
  switch (type) {
    case 'mark':
      return RawPerformanceEntryTypeValues.MARK;
    case 'measure':
      return RawPerformanceEntryTypeValues.MEASURE;
    case 'event':
      return RawPerformanceEntryTypeValues.EVENT;
    case 'longtask':
      return RawPerformanceEntryTypeValues.LONGTASK;
    default:
      // Verify exhaustive check with Flow
      (type: empty);
      throw new TypeError(
        `performanceEntryTypeToRaw: unexpected performance entry type received: ${type}`,
      );
  }
}
