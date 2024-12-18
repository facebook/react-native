/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

import type {
  DOMHighResTimeStamp,
  PerformanceEntryList,
  PerformanceEntryType,
} from './PerformanceEntry';
import type {OpaqueNativeObserverHandle} from './specs/NativePerformance';

import {PerformanceEventTiming} from './EventTiming';
import {
  performanceEntryTypeToRaw,
  rawToPerformanceEntry,
  rawToPerformanceEntryType,
} from './RawPerformanceEntry';
import NativePerformance from './specs/NativePerformance';
import {warnNoNativePerformance} from './Utilities';

export {PerformanceEntry} from './PerformanceEntry';

export class PerformanceObserverEntryList {
  #entries: PerformanceEntryList;

  constructor(entries: PerformanceEntryList) {
    this.#entries = entries;
  }

  getEntries(): PerformanceEntryList {
    return this.#entries;
  }

  getEntriesByType(type: PerformanceEntryType): PerformanceEntryList {
    return this.#entries.filter(entry => entry.entryType === type);
  }

  getEntriesByName(
    name: string,
    type?: PerformanceEntryType,
  ): PerformanceEntryList {
    if (type === undefined) {
      return this.#entries.filter(entry => entry.name === name);
    } else {
      return this.#entries.filter(
        entry => entry.name === name && entry.entryType === type,
      );
    }
  }
}

export type PerformanceObserverCallbackOptions = {
  droppedEntriesCount: number,
};

export type PerformanceObserverCallback = (
  list: PerformanceObserverEntryList,
  observer: PerformanceObserver,
  // The number of buffered entries which got dropped from the buffer due to the buffer being full:
  options?: PerformanceObserverCallbackOptions,
) => void;

export type PerformanceObserverInit = {
  entryTypes?: Array<PerformanceEntryType>,
  type?: PerformanceEntryType,
  buffered?: boolean,
  durationThreshold?: DOMHighResTimeStamp,
};

function getSupportedPerformanceEntryTypes(): $ReadOnlyArray<PerformanceEntryType> {
  if (!NativePerformance) {
    return Object.freeze([]);
  }
  if (!NativePerformance.getSupportedPerformanceEntryTypes) {
    // fallback if getSupportedPerformanceEntryTypes is not defined on native side
    return Object.freeze(['mark', 'measure', 'event']);
  }
  return Object.freeze(
    NativePerformance.getSupportedPerformanceEntryTypes().map(
      rawToPerformanceEntryType,
    ),
  );
}

/**
 * Implementation of the PerformanceObserver interface for RN,
 * corresponding to the standard in https://www.w3.org/TR/performance-timeline/
 *
 * @example
 * const observer = new PerformanceObserver((list, _observer) => {
 *   const entries = list.getEntries();
 *   entries.forEach(entry => {
 *     reportEvent({
 *       eventName: entry.name,
 *       startTime: entry.startTime,
 *       endTime: entry.startTime + entry.duration,
 *       processingStart: entry.processingStart,
 *       processingEnd: entry.processingEnd,
 *       interactionId: entry.interactionId,
 *     });
 *   });
 * });
 * observer.observe({ type: "event" });
 */
export class PerformanceObserver {
  #nativeObserverHandle: OpaqueNativeObserverHandle | null = null;
  #callback: PerformanceObserverCallback;
  #type: 'single' | 'multiple' | void;
  #calledAtLeastOnce = false;

  constructor(callback: PerformanceObserverCallback) {
    this.#callback = callback;
  }

  observe(options: PerformanceObserverInit): void {
    if (!NativePerformance || NativePerformance.observe == null) {
      warnNoNativePerformance();
      return;
    }

    this.#validateObserveOptions(options);

    if (this.#nativeObserverHandle == null) {
      this.#nativeObserverHandle = this.#createNativeObserver();
    }

    if (options.entryTypes) {
      this.#type = 'multiple';
      NativePerformance.observe?.(this.#nativeObserverHandle, {
        entryTypes: options.entryTypes.map(performanceEntryTypeToRaw),
      });
    } else if (options.type) {
      this.#type = 'single';
      NativePerformance.observe?.(this.#nativeObserverHandle, {
        type: performanceEntryTypeToRaw(options.type),
        buffered: options.buffered,
        durationThreshold: options.durationThreshold,
      });
    }
  }

  disconnect(): void {
    if (!NativePerformance) {
      warnNoNativePerformance();
      return;
    }

    if (this.#nativeObserverHandle == null || !NativePerformance.disconnect) {
      return;
    }

    NativePerformance.disconnect(this.#nativeObserverHandle);
  }

  #createNativeObserver(): OpaqueNativeObserverHandle {
    if (!NativePerformance || !NativePerformance.createObserver) {
      warnNoNativePerformance();
      return;
    }

    this.#calledAtLeastOnce = false;

    return NativePerformance.createObserver(() => {
      const rawEntries = NativePerformance.takeRecords?.(
        this.#nativeObserverHandle,
        true, // sort records
      );
      if (!rawEntries) {
        return;
      }

      const entries = rawEntries.map(rawToPerformanceEntry);
      const entryList = new PerformanceObserverEntryList(entries);

      let droppedEntriesCount = 0;
      if (!this.#calledAtLeastOnce) {
        droppedEntriesCount =
          NativePerformance.getDroppedEntriesCount?.(
            this.#nativeObserverHandle,
          ) ?? 0;
        this.#calledAtLeastOnce = true;
      }

      this.#callback(entryList, this, {droppedEntriesCount});
    });
  }

  #validateObserveOptions(options: PerformanceObserverInit): void {
    const {type, entryTypes, durationThreshold} = options;

    if (!type && !entryTypes) {
      throw new TypeError(
        "Failed to execute 'observe' on 'PerformanceObserver': An observe() call must not include both entryTypes and type arguments.",
      );
    }

    if (entryTypes && type) {
      throw new TypeError(
        "Failed to execute 'observe' on 'PerformanceObserver': An observe() call must include either entryTypes or type arguments.",
      );
    }

    if (this.#type === 'multiple' && type) {
      throw new Error(
        "Failed to execute 'observe' on 'PerformanceObserver': This observer has performed observe({entryTypes:...}, therefore it cannot perform observe({type:...})",
      );
    }

    if (this.#type === 'single' && entryTypes) {
      throw new Error(
        "Failed to execute 'observe' on 'PerformanceObserver': This PerformanceObserver has performed observe({type:...}, therefore it cannot perform observe({entryTypes:...})",
      );
    }

    if (entryTypes && durationThreshold != null) {
      throw new TypeError(
        "Failed to execute 'observe' on 'PerformanceObserver': An observe() call must not include both entryTypes and durationThreshold arguments.",
      );
    }
  }

  static supportedEntryTypes: $ReadOnlyArray<PerformanceEntryType> =
    getSupportedPerformanceEntryTypes();
}

export {PerformanceEventTiming};
