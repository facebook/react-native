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

  // For PerformanceEventTiming only
  processingStart?: number,
  processingEnd?: number,
  interactionId?: number,

  // For PerformanceResourceTiming only
  fetchStart?: number,
  requestStart?: number,
  connectStart?: number,
  connectEnd?: number,
  responseStart?: number,
  responseEnd?: number,
  responseStatus?: number,
  contentType?: string,
  encodedBodySize?: number,
  decodedBodySize?: number,
};

export opaque type OpaqueNativeObserverHandle = unknown;

export type NativeBatchedObserverCallback = () => void;
export type NativePerformanceMarkResult = number;
export type NativePerformanceMeasureResult = ReadonlyArray<number>; // [startTime, duration]

export type PerformanceObserverInit = {
  entryTypes?: ReadonlyArray<number>,
  type?: number,
  buffered?: boolean,
  durationThreshold?: number,
};

export interface Spec extends TurboModule {
  +now: () => number;
  +timeOrigin?: () => number;

  +reportMark: (name: string, startTime: number, entry: unknown) => void;
  +reportMeasure: (
    name: string,
    startTime: number,
    duration: number,
    entry: unknown,
  ) => void;
  +getMarkTime: (name: string) => ?number;
  +clearMarks: (entryName?: string) => void;
  +clearMeasures: (entryName?: string) => void;
  +getEntries: () => ReadonlyArray<RawPerformanceEntry>;
  +getEntriesByName: (
    entryName: string,
    entryType?: ?RawPerformanceEntryType,
  ) => ReadonlyArray<RawPerformanceEntry>;
  +getEntriesByType: (
    entryType: RawPerformanceEntryType,
  ) => ReadonlyArray<RawPerformanceEntry>;
  +getEventCounts: () => ReadonlyArray<[string, number]>;
  +getSimpleMemoryInfo: () => NativeMemoryInfo;
  +getReactNativeStartupTiming: () => ReactNativeStartupTiming;

  +createObserver: (
    callback: NativeBatchedObserverCallback,
  ) => OpaqueNativeObserverHandle;
  +getDroppedEntriesCount: (observer: OpaqueNativeObserverHandle) => number;

  +observe: (
    observer: OpaqueNativeObserverHandle,
    options: PerformanceObserverInit,
  ) => void;
  +disconnect: (observer: OpaqueNativeObserverHandle) => void;
  +takeRecords: (
    observer: OpaqueNativeObserverHandle,
    sort: boolean,
  ) => ReadonlyArray<RawPerformanceEntry>;

  +getSupportedPerformanceEntryTypes: () => ReadonlyArray<RawPerformanceEntryType>;

  +clearEventCountsForTesting: () => void;
}

export default (TurboModuleRegistry.get<Spec>('NativePerformanceCxx'): ?Spec);
