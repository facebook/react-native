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
} from '../NativePerformance';

import {RawPerformanceEntryTypeValues} from '../../RawPerformanceEntry';
import NativePerformance from '../NativePerformance';
import { logMockEntry } from './NativePerformanceObserver';

const marks: Map<string, number> = new Map();

const NativePerformanceMock: typeof NativePerformance = {
  mark: (name: string, startTime: number): void => {
    NativePerformance?.mark(name, startTime);
    marks.set(name, startTime);
    logMockEntry({
      entryType: RawPerformanceEntryTypeValues.MARK,
      name,
      startTime,
      duration: 0,
    });
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
    NativePerformance?.measure(name, start, end);
    logMockEntry({
      entryType: RawPerformanceEntryTypeValues.MEASURE,
      name,
      startTime: start,
      duration: duration ?? end - start,
    });
  },

  testOnly_logEvent: (
    name: string,
    startTime: number,
    duration: number,
    processingStart: number,
    processingEnd: number,
    interactionId: number,
  ): void => {
    NativePerformance?.testOnly_logEvent(name, startTime, duration, processingStart, processingEnd, interactionId);
    logMockEntry({
      entryType: RawPerformanceEntryTypeValues.EVENT,
      name,
      startTime,
      duration: duration ?? 0,
      processingStart,
      processingEnd,
      interactionId,
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
