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

export type NativeMemoryInfo = {[key: string]: number};

export type ReactNativeStartupTiming = {|
  startTime: number,
  endTime: number,
  executeJavaScriptBundleEntryPointStart: number,
  executeJavaScriptBundleEntryPointEnd: number,
|};

export interface Spec extends TurboModule {
  +mark: (name: string, startTime: number, duration: number) => void;
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
