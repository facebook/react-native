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

export type RawPerformanceEntryType = number;

export type OpaqueNativeObserverHandle = mixed;

export type NativeBatchedObserverCallback = () => void;

export type RawPerformanceEntry = {|
  name: string,
  entryType: RawPerformanceEntryType,
  startTime: number,
  duration: number,
  // For "event" entries only:
  processingStart?: number,
  processingEnd?: number,
  interactionId?: number,
|};

export type GetPendingEntriesResult = {|
  entries: $ReadOnlyArray<RawPerformanceEntry>,
  droppedEntriesCount: number,
|};

export type PerformanceObserverInit = {
  entryTypes?: $ReadOnlyArray<number>;
  type?: number;
  buffered?: boolean;
  durationThreshold?: number;
};

export interface Spec extends TurboModule {
  +getEventCounts: () => $ReadOnlyArray<[string, number]>;
  +createObserver: (callback: NativeBatchedObserverCallback) => OpaqueNativeObserverHandle;
  +getDroppedEntriesCount: (observer: OpaqueNativeObserverHandle) => number;

  +observe: (observer: OpaqueNativeObserverHandle, options: PerformanceObserverInit) => void;
  +disconnect: (observer: OpaqueNativeObserverHandle) => void;
  +takeRecords: (observer: OpaqueNativeObserverHandle) => $ReadOnlyArray<RawPerformanceEntry>;

  +clearEntries: (
    entryType?: RawPerformanceEntryType,
    entryName?: string,
  ) => void;
  +getEntries: (
    entryType?: RawPerformanceEntryType,
    entryName?: string,
  ) => $ReadOnlyArray<RawPerformanceEntry>;
  +getSupportedPerformanceEntryTypes: () => $ReadOnlyArray<RawPerformanceEntryType>;

}

export default (TurboModuleRegistry.get<Spec>(
  'NativePerformanceObserverCxx',
): ?Spec);
