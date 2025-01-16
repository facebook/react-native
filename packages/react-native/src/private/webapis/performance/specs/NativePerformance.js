/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../../Libraries/TurboModule/TurboModuleRegistry';

export type NativeMemoryInfo = {[key: string]: ?number};

export type ReactNativeStartupTiming = {[key: string]: ?number};

export type RawPerformanceEntryType = number;

export type RawPerformanceEntry = {
  name: string,
  entryType: RawPerformanceEntryType,
  startTime: number,
  duration: number,

  // For "event" entries only:
  processingStart?: number,
  processingEnd?: number,
  interactionId?: number,
};

export type OpaqueNativeObserverHandle = mixed;

export type NativeBatchedObserverCallback = () => void;
export type NativePerformanceMarkResult = number;
export type NativePerformanceMeasureResult = $ReadOnlyArray<number>; // [startTime, duration]

export type PerformanceObserverInit = {
  entryTypes?: $ReadOnlyArray<number>,
  type?: number,
  buffered?: boolean,
  durationThreshold?: number,
};

export interface Spec extends TurboModule {
  +now?: () => number;
  +markWithResult?: (
    name: string,
    startTime?: number,
  ) => NativePerformanceMarkResult;
  +measureWithResult?: (
    name: string,
    startTime: number,
    endTime: number,
    duration?: number,
    startMark?: string,
    endMark?: string,
  ) => NativePerformanceMeasureResult;
  +clearMarks?: (entryName?: string) => void;
  +clearMeasures?: (entryName?: string) => void;
  +getEntries?: () => $ReadOnlyArray<RawPerformanceEntry>;
  +getEntriesByName?: (
    entryName: string,
    entryType?: ?RawPerformanceEntryType,
  ) => $ReadOnlyArray<RawPerformanceEntry>;
  +getEntriesByType?: (
    entryType: RawPerformanceEntryType,
  ) => $ReadOnlyArray<RawPerformanceEntry>;
  +getEventCounts?: () => $ReadOnlyArray<[string, number]>;
  +getSimpleMemoryInfo: () => NativeMemoryInfo;
  +getReactNativeStartupTiming: () => ReactNativeStartupTiming;

  +createObserver?: (
    callback: NativeBatchedObserverCallback,
  ) => OpaqueNativeObserverHandle;
  +getDroppedEntriesCount?: (observer: OpaqueNativeObserverHandle) => number;

  +observe?: (
    observer: OpaqueNativeObserverHandle,
    options: PerformanceObserverInit,
  ) => void;
  +disconnect?: (observer: OpaqueNativeObserverHandle) => void;
  +takeRecords?: (
    observer: OpaqueNativeObserverHandle,
    sort: boolean,
  ) => $ReadOnlyArray<RawPerformanceEntry>;

  +getSupportedPerformanceEntryTypes?: () => $ReadOnlyArray<RawPerformanceEntryType>;
}

export default (TurboModuleRegistry.get<Spec>('NativePerformanceCxx'): ?Spec);
