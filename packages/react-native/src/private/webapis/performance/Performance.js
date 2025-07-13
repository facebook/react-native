/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// flowlint unsafe-getters-setters:off

import type {
  DOMHighResTimeStamp,
  PerformanceEntryList,
  PerformanceEntryType,
} from './PerformanceEntry';
import type {
  DetailType,
  PerformanceMarkOptions,
  PerformanceMeasureInit,
} from './UserTiming';

import DOMException from '../errors/DOMException';
import structuredClone from '../structuredClone/structuredClone';
import {setPlatformObject} from '../webidl/PlatformObjects';
import {EventCounts} from './EventTiming';
import {
  performanceEntryTypeToRaw,
  rawToPerformanceEntry,
} from './internals/RawPerformanceEntry';
import {
  getCurrentTimeStamp,
  warnNoNativePerformance,
} from './internals/Utilities';
import MemoryInfo from './MemoryInfo';
import ReactNativeStartupTiming from './ReactNativeStartupTiming';
import NativePerformance from './specs/NativePerformance';
import {PerformanceMark, PerformanceMeasure} from './UserTiming';

export type PerformanceMeasureOptions =
  | $ReadOnly<{
      detail?: DetailType,
      start?: DOMHighResTimeStamp | string,
      duration?: DOMHighResTimeStamp,
    }>
  | $ReadOnly<{
      detail?: DetailType,
      start?: DOMHighResTimeStamp | string,
      end?: DOMHighResTimeStamp | string,
    }>;

const ENTRY_TYPES_AVAILABLE_FROM_TIMELINE: $ReadOnlyArray<PerformanceEntryType> =
  ['mark', 'measure'];

const cachedNativeMark = NativePerformance?.markWithResult;
const cachedNativeMeasure = NativePerformance?.measure;
const cachedNativeClearMarks = NativePerformance?.clearMarks;
const cachedNativeClearMeasures = NativePerformance?.clearMeasures;

const MARK_OPTIONS_REUSABLE_OBJECT: {...PerformanceMarkOptions} = {
  startTime: 0,
  detail: undefined,
};

const MEASURE_OPTIONS_REUSABLE_OBJECT: {...PerformanceMeasureInit} = {
  startTime: 0,
  duration: 0,
  detail: undefined,
};

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
    // IMPORTANT: this method has been micro-optimized.
    // Please run the benchmarks in `Performance-benchmarks-itest` to ensure
    // changes do not regress performance.

    if (markName === undefined) {
      throw new TypeError(
        `Failed to execute 'mark' on 'Performance': 1 argument required, but only 0 present.`,
      );
    }

    const resolvedMarkName =
      typeof markName === 'string' ? markName : String(markName);

    let resolvedDetail;
    const detail = markOptions?.detail;
    if (detail !== undefined) {
      resolvedDetail = structuredClone(detail);
    }

    let computedStartTime;
    if (cachedNativeMark) {
      let resolvedStartTime;

      const startTime = markOptions?.startTime;
      if (startTime !== undefined) {
        resolvedStartTime =
          typeof startTime === 'number' ? startTime : Number(startTime);
        if (resolvedStartTime < 0) {
          throw new TypeError(
            `Failed to execute 'mark' on 'Performance': '${resolvedMarkName}' cannot have a negative start time.`,
          );
        } else if (
          // This is faster than calling Number.isFinite()
          // eslint-disable-next-line no-self-compare
          resolvedStartTime !== resolvedStartTime ||
          resolvedStartTime === Infinity
        ) {
          throw new TypeError(
            `Failed to execute 'mark' on 'Performance': Failed to read the 'startTime' property from 'PerformanceMarkOptions': The provided double value is non-finite.`,
          );
        }
      }

      computedStartTime = cachedNativeMark(resolvedMarkName, resolvedStartTime);
    } else {
      warnNoNativePerformance();
      computedStartTime = getCurrentTimeStamp();
    }

    MARK_OPTIONS_REUSABLE_OBJECT.startTime = computedStartTime;
    MARK_OPTIONS_REUSABLE_OBJECT.detail = resolvedDetail;

    return new PerformanceMark(resolvedMarkName, MARK_OPTIONS_REUSABLE_OBJECT);
  }

  clearMarks(markName?: string): void {
    if (!cachedNativeClearMarks) {
      warnNoNativePerformance();
      return;
    }

    cachedNativeClearMarks(markName);
  }

  measure(
    measureName: string,
    startMarkOrOptions?: string | PerformanceMeasureOptions,
    endMark?: string,
  ): PerformanceMeasure {
    // IMPORTANT: this method has been micro-optimized.
    // Please run the benchmarks in `Performance-benchmarks-itest` to ensure
    // changes do not regress performance.

    if (measureName === undefined) {
      throw new TypeError(
        `Failed to execute 'measure' on 'Performance': 1 argument required, but only 0 present.`,
      );
    }

    let resolvedMeasureName =
      typeof measureName === 'string' ? measureName : String(measureName);
    let resolvedStartTime: number | void;
    let resolvedStartMark: string | void;
    let resolvedEndTime: number | void;
    let resolvedEndMark: string | void;
    let resolvedDuration: number | void;
    let resolvedDetail: mixed;

    if (startMarkOrOptions != null) {
      switch (typeof startMarkOrOptions) {
        case 'object': {
          if (endMark !== undefined) {
            throw new TypeError(
              `Failed to execute 'measure' on 'Performance': If a non-empty PerformanceMeasureOptions object was passed, |end_mark| must not be passed.`,
            );
          }

          const start = startMarkOrOptions.start;
          switch (typeof start) {
            case 'number': {
              resolvedStartTime = start;
              break;
            }
            case 'string': {
              resolvedStartMark = start;
              break;
            }
            case 'undefined': {
              break;
            }
            default: {
              resolvedStartMark = String(start);
            }
          }

          const end = startMarkOrOptions.end;
          switch (typeof end) {
            case 'number': {
              resolvedEndTime = end;
              break;
            }
            case 'string': {
              resolvedEndMark = end;
              break;
            }
            case 'undefined': {
              break;
            }
            default: {
              resolvedEndMark = String(end);
            }
          }

          const duration = startMarkOrOptions.duration;
          switch (typeof duration) {
            case 'number': {
              resolvedDuration = duration;
              break;
            }
            case 'undefined':
              break;
            default: {
              resolvedDuration = Number(duration);
              if (!Number.isFinite(resolvedDuration)) {
                throw new TypeError(
                  `Failed to execute 'measure' on 'Performance': Failed to read the 'duration' property from 'PerformanceMeasureOptions': The provided double value is non-finite.`,
                );
              }
            }
          }

          if (
            resolvedDuration !== undefined &&
            (resolvedEndMark !== undefined || resolvedEndTime !== undefined)
          ) {
            throw new TypeError(
              `Failed to execute 'measure' on 'Performance': If a non-empty PerformanceMeasureOptions object was passed, it must not have all of its 'start', 'duration', and 'end' properties defined`,
            );
          }

          const detail = startMarkOrOptions.detail;
          if (detail !== undefined) {
            resolvedDetail = structuredClone(detail);
          }

          break;
        }
        case 'string': {
          resolvedStartMark = startMarkOrOptions;

          if (endMark !== undefined) {
            resolvedEndMark = String(endMark);
          }
          break;
        }
        default: {
          resolvedStartMark = String(startMarkOrOptions);
        }
      }
    }

    let computedStartTime = 0;
    let computedDuration = 0;

    if (cachedNativeMeasure) {
      try {
        [computedStartTime, computedDuration] = cachedNativeMeasure(
          resolvedMeasureName,
          resolvedStartTime,
          resolvedEndTime,
          resolvedDuration,
          resolvedStartMark,
          resolvedEndMark,
        );
      } catch (error) {
        throw new DOMException(
          "Failed to execute 'measure' on 'Performance': " + error.message,
          'SyntaxError',
        );
      }
    } else if (NativePerformance?.measureWithResult) {
      try {
        [computedStartTime, computedDuration] =
          NativePerformance.measureWithResult(
            resolvedMeasureName,
            resolvedStartTime ?? 0,
            resolvedEndTime ?? 0,
            resolvedDuration,
            resolvedStartMark,
            resolvedEndMark,
          );
      } catch (error) {
        throw new DOMException(
          "Failed to execute 'measure' on 'Performance': " + error.message,
          'SyntaxError',
        );
      }
    } else {
      warnNoNativePerformance();
    }

    MEASURE_OPTIONS_REUSABLE_OBJECT.startTime = computedStartTime;
    MEASURE_OPTIONS_REUSABLE_OBJECT.duration = computedDuration ?? 0;
    MEASURE_OPTIONS_REUSABLE_OBJECT.detail = resolvedDetail;

    return new PerformanceMeasure(
      resolvedMeasureName,
      MEASURE_OPTIONS_REUSABLE_OBJECT,
    );
  }

  clearMeasures(measureName?: string): void {
    if (!cachedNativeClearMeasures) {
      warnNoNativePerformance();
      return;
    }

    cachedNativeClearMeasures(measureName);
  }

  /**
   * Returns a double, measured in milliseconds.
   * https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
   */
  now: () => DOMHighResTimeStamp = getCurrentTimeStamp;

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

setPlatformObject(Performance);
