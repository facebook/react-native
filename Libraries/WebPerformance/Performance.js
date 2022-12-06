/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

import type {HighResTimeStamp} from './PerformanceObserver';

import NativePerformance from './NativePerformance';
import {PerformanceEntry} from './PerformanceObserver';

type DetailType = mixed;

export type PerformanceMarkOptions = {
  detail?: DetailType,
  startTime?: HighResTimeStamp,
};

function getCurrentTimeStamp(): HighResTimeStamp {
  return global.nativePerformanceNow?.() ?? Date.now();
}

export class PerformanceMark extends PerformanceEntry {
  detail: DetailType;

  constructor(markName: string, markOptions?: PerformanceMarkOptions) {
    let startTime = markOptions?.startTime ?? getCurrentTimeStamp();
    super({name: markName, entryType: 'mark', startTime, duration: 0});
    if (markOptions !== undefined) {
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
    if (measureOptions !== undefined) {
      this.detail = measureOptions.detail;
    }
  }
}

/**
 * Partial implementation of the Performance interface for RN,
 * corresponding to the standard in
 *  https://www.w3.org/TR/user-timing/#extensions-performance-interface
 */
export default class Performance {
  mark(
    markName: string,
    markOptions?: PerformanceMarkOptions,
  ): PerformanceMark {
    const mark = new PerformanceMark(markName, markOptions);
    NativePerformance?.mark?.(markName, mark.startTime, mark.duration);
    return mark;
  }
  clearMarks(markName?: string): void {
    NativePerformance?.clearMarks?.(markName);
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
    NativePerformance?.measure?.(
      measureName,
      startTime,
      endTime,
      duration,
      startMarkName,
      endMarkName,
    );
    return measure;
  }
  clearMeasures(measureName?: string): void {
    NativePerformance?.clearMeasures?.(measureName);
  }

  now(): HighResTimeStamp {
    return getCurrentTimeStamp();
  }
}
