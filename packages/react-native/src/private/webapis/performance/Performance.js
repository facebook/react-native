/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

// flowlint unsafe-getters-setters:off

import type {
  DOMHighResTimeStamp,
  PerformanceEntryList,
  PerformanceEntryType,
} from './PerformanceEntry';
import type {DetailType, PerformanceMarkOptions} from './UserTiming';

import {EventCounts} from './EventTiming';
import {
  performanceEntryTypeToRaw,
  rawToPerformanceEntry,
} from './internals/RawPerformanceEntry';
import {warnNoNativePerformance} from './internals/Utilities';
import MemoryInfo from './MemoryInfo';
import ReactNativeStartupTiming from './ReactNativeStartupTiming';
import NativePerformance from './specs/NativePerformance';
import {PerformanceMark, PerformanceMeasure} from './UserTiming';

declare var global: {
  // This value is defined directly via JSI, if available.
  +nativePerformanceNow?: ?() => number,
};

const getCurrentTimeStamp: () => DOMHighResTimeStamp =
  NativePerformance?.now ?? global.nativePerformanceNow ?? (() => Date.now());

export type PerformanceMeasureOptions = {
  detail?: DetailType,
  start?: DOMHighResTimeStamp,
  duration?: DOMHighResTimeStamp,
  end?: DOMHighResTimeStamp,
};

const ENTRY_TYPES_AVAILABLE_FROM_TIMELINE: $ReadOnlyArray<PerformanceEntryType> =
  ['mark', 'measure'];

/**
 * Partial implementation of the Performance interface for RN,
 * corresponding to the standard in
 * https://www.w3.org/TR/user-timing/#extensions-performance-interface
 */
export default class Performance {
  eventCounts: EventCounts = new EventCounts();

  // Get the current JS memory information.
  get memory(): MemoryInfo {
    if (NativePerformance?.getSimpleMemoryInfo) {
      // JSI API implementations may have different variants of names for the JS
      // heap information we need here. We will parse the result based on our
      // guess of the implementation for now.
      const memoryInfo = NativePerformance.getSimpleMemoryInfo();
      if (memoryInfo.hasOwnProperty('hermes_heapSize')) {
        // We got memory information from Hermes
        const {
          hermes_heapSize: totalJSHeapSize,
          hermes_allocatedBytes: usedJSHeapSize,
        } = memoryInfo;

        return new MemoryInfo({
          jsHeapSizeLimit: null, // We don't know the heap size limit from Hermes.
          totalJSHeapSize,
          usedJSHeapSize,
        });
      } else {
        // JSC and V8 has no native implementations for memory information in JSI::Instrumentation
        return new MemoryInfo();
      }
    }

    return new MemoryInfo();
  }

  // Startup metrics is not used in web, but only in React Native.
  get rnStartupTiming(): ReactNativeStartupTiming {
    if (NativePerformance?.getReactNativeStartupTiming) {
      const {
        startTime,
        endTime,
        initializeRuntimeStart,
        initializeRuntimeEnd,
        executeJavaScriptBundleEntryPointStart,
        executeJavaScriptBundleEntryPointEnd,
      } = NativePerformance.getReactNativeStartupTiming();
      return new ReactNativeStartupTiming({
        startTime,
        endTime,
        initializeRuntimeStart,
        initializeRuntimeEnd,
        executeJavaScriptBundleEntryPointStart,
        executeJavaScriptBundleEntryPointEnd,
      });
    }
    return new ReactNativeStartupTiming();
  }

  mark(
    markName: string,
    markOptions?: PerformanceMarkOptions,
  ): PerformanceMark {
    let computedStartTime;
    if (NativePerformance?.markWithResult) {
      computedStartTime = NativePerformance.markWithResult(
        markName,
        markOptions?.startTime,
      );
    } else {
      warnNoNativePerformance();
      computedStartTime = performance.now();
    }

    return new PerformanceMark(markName, {
      startTime: computedStartTime,
      detail: markOptions?.detail,
    });
  }

  clearMarks(markName?: string): void {
    if (!NativePerformance?.clearMarks) {
      warnNoNativePerformance();
      return;
    }

    NativePerformance.clearMarks(markName);
  }

  measure(
    measureName: string,
    startMarkOrOptions?: string | PerformanceMeasureOptions,
    endMark?: string,
  ): PerformanceMeasure {
    let options;
    let startMarkName,
      endMarkName = endMark,
      duration,
      startTime = 0,
      endTime = 0;

    if (typeof startMarkOrOptions === 'string') {
      startMarkName = startMarkOrOptions;
      options = {};
    } else if (startMarkOrOptions !== undefined) {
      options = startMarkOrOptions;
      if (endMark !== undefined) {
        throw new TypeError(
          "Performance.measure: Can't have both options and endMark",
        );
      }
      if (options.start === undefined && options.end === undefined) {
        throw new TypeError(
          'Performance.measure: Must have at least one of start/end specified in options',
        );
      }
      if (
        options.start !== undefined &&
        options.end !== undefined &&
        options.duration !== undefined
      ) {
        throw new TypeError(
          "Performance.measure: Can't have both start/end and duration explicitly in options",
        );
      }

      if (typeof options.start === 'number') {
        startTime = options.start;
      } else {
        startMarkName = options.start;
      }

      if (typeof options.end === 'number') {
        endTime = options.end;
      } else {
        endMarkName = options.end;
      }

      duration = options.duration ?? duration;
    }

    let computedStartTime = startTime;
    let computedDuration = duration;

    if (NativePerformance?.measureWithResult) {
      [computedStartTime, computedDuration] =
        NativePerformance.measureWithResult(
          measureName,
          startTime,
          endTime,
          duration,
          startMarkName,
          endMarkName,
        );
    } else {
      warnNoNativePerformance();
    }

    const measure = new PerformanceMeasure(measureName, {
      startTime: computedStartTime,
      duration: computedDuration ?? 0,
      detail: options?.detail,
    });

    return measure;
  }

  clearMeasures(measureName?: string): void {
    if (!NativePerformance?.clearMeasures) {
      warnNoNativePerformance();
      return;
    }

    NativePerformance?.clearMeasures(measureName);
  }

  /**
   * Returns a double, measured in milliseconds.
   * https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
   */
  now(): DOMHighResTimeStamp {
    return getCurrentTimeStamp();
  }

  /**
   * An extension that allows to get back to JS all currently logged marks/measures
   * (in our case, be it from JS or native), see
   * https://www.w3.org/TR/performance-timeline/#extensions-to-the-performance-interface
   */
  getEntries(): PerformanceEntryList {
    if (!NativePerformance?.getEntries) {
      warnNoNativePerformance();
      return [];
    }
    return NativePerformance.getEntries().map(rawToPerformanceEntry);
  }

  getEntriesByType(entryType: PerformanceEntryType): PerformanceEntryList {
    if (
      entryType != null &&
      !ENTRY_TYPES_AVAILABLE_FROM_TIMELINE.includes(entryType)
    ) {
      console.warn('Deprecated API for given entry type.');
      return [];
    }

    if (!NativePerformance?.getEntriesByType) {
      warnNoNativePerformance();
      return [];
    }

    return NativePerformance.getEntriesByType(
      performanceEntryTypeToRaw(entryType),
    ).map(rawToPerformanceEntry);
  }

  getEntriesByName(
    entryName: string,
    entryType?: PerformanceEntryType,
  ): PerformanceEntryList {
    if (
      entryType != null &&
      !ENTRY_TYPES_AVAILABLE_FROM_TIMELINE.includes(entryType)
    ) {
      console.warn('Deprecated API for given entry type.');
      return [];
    }

    if (!NativePerformance?.getEntriesByName) {
      warnNoNativePerformance();
      return [];
    }

    return NativePerformance.getEntriesByName(
      entryName,
      entryType != null ? performanceEntryTypeToRaw(entryType) : undefined,
    ).map(rawToPerformanceEntry);
  }
}
