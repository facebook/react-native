/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {
  NativeMemoryInfo,
  ReactNativeStartupTiming,
  Spec as NativePerformance,
} from '../NativePerformance';

import NativePerformanceObserver from '../NativePerformanceObserver';
import {RawPerformanceEntryTypeValues} from '../RawPerformanceEntry';

const marks: Map<string, number> = new Map();

const NativePerformanceMock: NativePerformance = {
  mark: (name: string, startTime: number): void => {
    NativePerformanceObserver?.logRawEntry({
      name,
      entryType: RawPerformanceEntryTypeValues.MARK,
      startTime,
      duration: 0,
    });
    marks.set(name, startTime);
  },

  measure: (
    name: string,
    startTime: number,
    endTime: number,
    duration?: number,
    startMark?: string,
    endMark?: string,
  ): void => {
    const start = startMark != null ? marks.get(startMark) ?? 0 : startTime;
    const end = endMark != null ? marks.get(endMark) ?? 0 : endTime;
    NativePerformanceObserver?.logRawEntry({
      name,
      entryType: RawPerformanceEntryTypeValues.MEASURE,
      startTime: start,
      duration: duration ?? (end ? end - start : 0),
    });
  },

  getSimpleMemoryInfo: (): NativeMemoryInfo => {
    return {};
  },

  getReactNativeStartupTiming: (): ReactNativeStartupTiming => {
    return {
      startTime: 0,
      endTime: 0,
      executeJavaScriptBundleEntryPointStart: 0,
      executeJavaScriptBundleEntryPointEnd: 0,
      initializeRuntimeStart: 0,
      initializeRuntimeEnd: 0,
    };
  },
};

export default NativePerformanceMock;
