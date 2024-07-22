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
  PerformanceEntryJSON,
} from './PerformanceEntry';

import {PerformanceEntry} from './PerformanceEntry';

export type PerformanceEventTimingJSON = {
  ...PerformanceEntryJSON,
  processingStart: DOMHighResTimeStamp,
  processingEnd: DOMHighResTimeStamp,
  interactionId: number,
  ...
};

export default class PerformanceEventTiming extends PerformanceEntry {
  #processingStart: DOMHighResTimeStamp;
  #processingEnd: DOMHighResTimeStamp;
  #interactionId: number;

  constructor(init: {
    name: string,
    startTime?: DOMHighResTimeStamp,
    duration?: DOMHighResTimeStamp,
    processingStart?: DOMHighResTimeStamp,
    processingEnd?: DOMHighResTimeStamp,
    interactionId?: number,
  }) {
    super({
      name: init.name,
      entryType: 'event',
      startTime: init.startTime ?? 0,
      duration: init.duration ?? 0,
    });
    this.#processingStart = init.processingStart ?? 0;
    this.#processingEnd = init.processingEnd ?? 0;
    this.#interactionId = init.interactionId ?? 0;
  }

  get processingStart(): DOMHighResTimeStamp {
    return this.#processingStart;
  }

  get processingEnd(): DOMHighResTimeStamp {
    return this.#processingEnd;
  }

  get interactionId(): number {
    return this.#interactionId;
  }

  toJSON(): PerformanceEventTimingJSON {
    return {
      ...super.toJSON(),
      processingStart: this.#processingStart,
      processingEnd: this.#processingEnd,
      interactionId: this.#interactionId,
    };
  }
}
