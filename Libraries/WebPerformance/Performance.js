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

  clearMarks(markName?: string): void {}

  now(): HighResTimeStamp {
    return getCurrentTimeStamp();
  }
}
