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

export interface Spec extends TurboModule {
  +startReporting: (entryType: string) => void;
  +stopReporting: (entryType: string) => void;
  +getPendingEntries: () => $ReadOnlyArray<RawPerformanceEntry>;
  +setOnPerformanceEntryCallback: (callback?: () => void) => void;
}

export default (TurboModuleRegistry.get<Spec>(
  'NativePerformanceObserverCxx',
): ?Spec);
