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

import type {HighResTimeStamp} from './PerformanceEntry';

import warnOnce from '../Utilities/warnOnce';
import EventCounts from './EventCounts';
import MemoryInfo from './MemoryInfo';
import NativePerformance from './NativePerformance';
import {PerformanceEntry} from './PerformanceEntry';

type DetailType = mixed;

export type PerformanceMarkOptions = {
  detail?: DetailType,
  startTime?: HighResTimeStamp,
};

declare var global: {
  // This value is defined directly via JSI, if available.
  +nativePerformanceNow?: ?() => number,
};

const getCurrentTimeStamp: () => HighResTimeStamp = global.nativePerformanceNow
  ? global.nativePerformanceNow
  : () => Date.now();

export class PerformanceMark extends PerformanceEntry {
  detail: DetailType;

  constructor(markName: string, markOptions?: PerformanceMarkOptions) {
    super({
      name: markName,
      entryType: 'mark',
      startTime: markOptions?.startTime ?? getCurrentTimeStamp(),
      duration: 0,
    });

    if (markOptions) {
      this.detail = markOptions.detail;
    }
  }
}

export type TimeStampOrName = HighResTimeStamp | string;

export type PerformanceMeasureOptions = {
  detail?: DetailType,
  start?: TimeStampOrName,
  end?: TimeStampOrName,
  duration?: HighResTimeStamp,
};

export class PerformanceMeasure extends PerformanceEntry {
  detail: DetailType;

  constructor(measureName: string, measureOptions?: PerformanceMeasureOptions) {
    super({
      name: measureName,
      entryType: 'measure',
      startTime: 0,
      duration: measureOptions?.duration ?? 0,
    });

    if (measureOptions) {
      this.detail = measureOptions.detail;
    }
  }
}

function warnNoNativePerformance() {
  warnOnce(
    'missing-native-performance',
    'Missing native implementation of Performance',
  );
}

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
        const {hermes_heapSize, hermes_allocatedBytes} = memoryInfo;
        const totalJSHeapSize = Number(hermes_heapSize);
        const usedJSHeapSize = Number(hermes_allocatedBytes);

        return new MemoryInfo({
          jsHeapSizeLimit: null, // We don't know the heap size limit from Hermes.
          totalJSHeapSize: isNaN(totalJSHeapSize) ? null : totalJSHeapSize,
          usedJSHeapSize: isNaN(usedJSHeapSize) ? null : usedJSHeapSize,
        });
      } else {
        // JSC and V8 has no native implementations for memory information in JSI::Instrumentation
        return new MemoryInfo();
      }
    }

    return new MemoryInfo();
  }

  mark(
    markName: string,
    markOptions?: PerformanceMarkOptions,
  ): PerformanceMark {
    const mark = new PerformanceMark(markName, markOptions);

    if (NativePerformance?.mark) {
      NativePerformance.mark(markName, mark.startTime, mark.duration);
    } else {
      warnNoNativePerformance();
    }

    return mark;
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

    const measure = new PerformanceMeasure(measureName, options);

    if (NativePerformance?.measure) {
      NativePerformance.measure(
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

    return measure;
  }

  clearMeasures(measureName?: string): void {
    if (!NativePerformance?.clearMeasures) {
      warnNoNativePerformance();
      return;
    }

    NativePerformance.clearMeasures(measureName);
  }

  /**
   * Returns a double, measured in milliseconds.
   * https://developer.mozilla.org/en-US/docs/Web/API/Performance/now
   */
  now(): HighResTimeStamp {
    return getCurrentTimeStamp();
  }
}
