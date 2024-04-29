/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

import type {HighResTimeStamp} from './PerformanceEntry';

import {PerformanceEntry} from './PerformanceEntry';

type DetailType = mixed;

export type PerformanceMarkOptions = {
  detail?: DetailType,
  startTime?: HighResTimeStamp,
};

export type TimeStampOrName = HighResTimeStamp | string;

export type PerformanceMeasureOptions = {
  detail?: DetailType,
  start?: TimeStampOrName,
  end?: TimeStampOrName,
  duration?: HighResTimeStamp,
};

export class PerformanceMark extends PerformanceEntry {
  detail: DetailType;

  constructor(markName: string, markOptions?: PerformanceMarkOptions) {
    super({
      name: markName,
      entryType: 'mark',
      startTime: markOptions?.startTime ?? performance.now(),
      duration: 0,
    });

    if (markOptions) {
      this.detail = markOptions.detail;
    }
  }
}

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
