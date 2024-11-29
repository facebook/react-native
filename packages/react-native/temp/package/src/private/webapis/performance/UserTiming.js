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

import type {DOMHighResTimeStamp} from './PerformanceEntry';

import {PerformanceEntry} from './PerformanceEntry';

export type DetailType = mixed;

export type PerformanceMarkOptions = {
  detail?: DetailType,
  startTime?: DOMHighResTimeStamp,
};

export type TimeStampOrName = DOMHighResTimeStamp | string;

export type PerformanceMeasureInit = {
  detail?: DetailType,
  startTime?: DOMHighResTimeStamp,
  duration?: DOMHighResTimeStamp,
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
  #detail: DetailType;

  constructor(measureName: string, measureOptions?: PerformanceMeasureInit) {
    super({
      name: measureName,
      entryType: 'measure',
      startTime: measureOptions?.startTime ?? 0,
      duration: measureOptions?.duration ?? 0,
    });

    if (measureOptions) {
      this.#detail = measureOptions.detail;
    }
  }

  get detail(): DetailType {
    return this.#detail;
  }
}
