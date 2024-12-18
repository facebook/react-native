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
import NativePerformance from './specs/NativePerformance';
import {warnNoNativePerformance} from './Utilities';

export type PerformanceEventTimingJSON = {
  ...PerformanceEntryJSON,
  processingStart: DOMHighResTimeStamp,
  processingEnd: DOMHighResTimeStamp,
  interactionId: number,
  ...
};

export class PerformanceEventTiming extends PerformanceEntry {
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

type EventCountsForEachCallbackType =
  | (() => void)
  | ((value: number) => void)
  | ((value: number, key: string) => void)
  | ((value: number, key: string, map: Map<string, number>) => void);

let cachedEventCounts: ?Map<string, number>;

function getCachedEventCounts(): Map<string, number> {
  if (cachedEventCounts) {
    return cachedEventCounts;
  }

  if (!NativePerformance || !NativePerformance?.getEventCounts) {
    warnNoNativePerformance();
    cachedEventCounts = new Map();
    return cachedEventCounts;
  }

  const eventCounts = new Map<string, number>(
    NativePerformance.getEventCounts?.() ?? [],
  );
  cachedEventCounts = eventCounts;

  // $FlowFixMe[incompatible-call]
  global.queueMicrotask(() => {
    // To be consistent with the calls to the API from the same task,
    // but also not to refetch the data from native too often,
    // schedule to invalidate the cache later,
    // after the current task is guaranteed to have finished.
    cachedEventCounts = null;
  });

  return eventCounts;
}

/**
 * Implementation of the EventCounts Web Performance API
 * corresponding to the standard in
 * https://www.w3.org/TR/event-timing/#eventcounts
 */
export class EventCounts {
  get size(): number {
    return getCachedEventCounts().size;
  }

  entries(): Iterator<[string, number]> {
    return getCachedEventCounts().entries();
  }

  forEach(callback: EventCountsForEachCallbackType): void {
    return getCachedEventCounts().forEach(callback);
  }

  get(key: string): ?number {
    return getCachedEventCounts().get(key);
  }

  has(key: string): boolean {
    return getCachedEventCounts().has(key);
  }

  keys(): Iterator<string> {
    return getCachedEventCounts().keys();
  }

  values(): Iterator<number> {
    return getCachedEventCounts().values();
  }
}
