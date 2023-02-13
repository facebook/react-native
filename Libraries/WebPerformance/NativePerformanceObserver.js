/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../TurboModule/RCTExport';

import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

export const RawPerformanceEntryTypeValues = {
  UNDEFINED: 0,
  MARK: 1,
  MEASURE: 2,
  EVENT: 3,
};

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

export interface Spec extends TurboModule {
  +startReporting: (entryType: RawPerformanceEntryType) => void;
  +stopReporting: (entryType: RawPerformanceEntryType) => void;
  +popPendingEntries: () => GetPendingEntriesResult;
  +setOnPerformanceEntryCallback: (callback?: () => void) => void;
}

export default (TurboModuleRegistry.get<Spec>(
  'NativePerformanceObserverCxx',
): ?Spec);
