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

export class PerformanceEventTiming extends PerformanceEntry {
  processingStart: HighResTimeStamp;
  processingEnd: HighResTimeStamp;
  interactionId: number;

  constructor(init: {
    name: string,
    startTime?: HighResTimeStamp,
    duration?: HighResTimeStamp,
    processingStart?: HighResTimeStamp,
    processingEnd?: HighResTimeStamp,
    interactionId?: number,
  }) {
    super({
      name: init.name,
      entryType: 'event',
      startTime: init.startTime ?? 0,
      duration: init.duration ?? 0,
    });
    this.processingStart = init.processingStart ?? 0;
    this.processingEnd = init.processingEnd ?? 0;
    this.interactionId = init.interactionId ?? 0;
  }
}
