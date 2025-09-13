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

export type PerformanceResourceTimingJSON = {
  ...PerformanceEntryJSON,
  fetchStart: DOMHighResTimeStamp,
  requestStart: DOMHighResTimeStamp,
  connectStart: DOMHighResTimeStamp,
  connectEnd: DOMHighResTimeStamp,
  responseStart: DOMHighResTimeStamp,
  responseEnd: DOMHighResTimeStamp,
  responseStatus: ?number,
  ...
};

export interface PerformanceResourceTimingInit {
  +name: string;
  +startTime: DOMHighResTimeStamp;
  +duration: DOMHighResTimeStamp;
  +fetchStart: DOMHighResTimeStamp;
  +requestStart: DOMHighResTimeStamp;
  +connectStart: DOMHighResTimeStamp;
  +connectEnd: DOMHighResTimeStamp;
  +responseStart: DOMHighResTimeStamp;
  +responseEnd: DOMHighResTimeStamp;
  +responseStatus?: number;
}

export class PerformanceResourceTiming extends PerformanceEntry {
  #fetchStart: DOMHighResTimeStamp;
  #requestStart: DOMHighResTimeStamp;
  #connectStart: DOMHighResTimeStamp;
  #connectEnd: DOMHighResTimeStamp;
  #responseStart: DOMHighResTimeStamp;
  #responseEnd: DOMHighResTimeStamp;
  #responseStatus: ?number;

  constructor(init: PerformanceResourceTimingInit) {
    super('resource', init);

    this.#fetchStart = init.fetchStart;
    this.#requestStart = init.requestStart;
    this.#connectStart = init.connectStart;
    this.#connectEnd = init.connectEnd;
    this.#responseStart = init.responseStart;
    this.#responseEnd = init.responseEnd;
    this.#responseStatus = init.responseStatus;
  }

  get fetchStart(): DOMHighResTimeStamp {
    return this.#fetchStart;
  }

  get requestStart(): DOMHighResTimeStamp {
    return this.#requestStart;
  }

  get connectStart(): DOMHighResTimeStamp {
    return this.#connectStart;
  }

  get connectEnd(): DOMHighResTimeStamp {
    return this.#connectEnd;
  }

  get responseStart(): DOMHighResTimeStamp {
    return this.#responseStart;
  }

  get responseEnd(): DOMHighResTimeStamp {
    return this.#responseEnd;
  }

  get responseStatus(): ?number {
    return this.#responseStatus;
  }

  toJSON(): PerformanceResourceTimingJSON {
    return {
      ...super.toJSON(),
      fetchStart: this.#fetchStart,
      requestStart: this.#requestStart,
      connectStart: this.#connectStart,
      connectEnd: this.#connectEnd,
      responseStart: this.#responseStart,
      responseEnd: this.#responseEnd,
      responseStatus: this.#responseStatus,
    };
  }
}

export const PerformanceResourceTiming_public: typeof PerformanceResourceTiming =
  /* eslint-disable no-shadow */
  // $FlowExpectedError[incompatible-type]
  function PerformanceResourceTiming() {
    throw new TypeError(
      "Failed to construct 'PerformanceResourceTiming': Illegal constructor",
    );
  };

// $FlowExpectedError[prop-missing]
PerformanceResourceTiming_public.prototype =
  PerformanceResourceTiming.prototype;
