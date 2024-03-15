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

export interface Spec extends TurboModule {
  +now?: () => number;
  +mark: (name: string, startTime: number) => void;
  +measure: (
    name: string,
    startTime: number,
    endTime: number,
    duration?: number,
    startMark?: string,
    endMark?: string,
  ) => void;
  +getSimpleMemoryInfo: () => NativeMemoryInfo;
  +getReactNativeStartupTiming: () => ReactNativeStartupTiming;
}

export default (TurboModuleRegistry.get<Spec>('NativePerformanceCxx'): ?Spec);
