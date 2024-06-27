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
  entryTypes: $ReadOnlyArray<string>;
  type: string;
  buffered: boolean;
};

export type PerformanceObserver = {
  observe(options: PerformanceObserverInit): void;
  disconnect(): void;
  takeRecords(): $ReadOnlyArray<RawPerformanceEntry>;
};

export interface Spec extends TurboModule {
  +createObserver: (callback: () => void) => PerformanceObserver;
  +setOnPerformanceEntryCallback: (callback?: () => void) => void;
  +logRawEntry: (entry: RawPerformanceEntry) => void;
  +getEventCounts: () => $ReadOnlyArray<[string, number]>;
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
