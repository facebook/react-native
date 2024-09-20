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
  PerformanceEntryType,
} from './PerformanceEntry';

import warnOnce from '../../../../Libraries/Utilities/warnOnce';
import {PerformanceEventTiming} from './EventTiming';
import {PerformanceEntry} from './PerformanceEntry';
import {
  performanceEntryTypeToRaw,
  rawToPerformanceEntry,
  rawToPerformanceEntryType,
} from './RawPerformanceEntry';
import NativePerformanceObserver from './specs/NativePerformanceObserver';
import type { OpaqueNativeObserverHandle } from './specs/NativePerformanceObserver';

export type PerformanceEntryList = $ReadOnlyArray<PerformanceEntry>;

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
  options?: PerformanceObserverCallbackOptions
) => void;

export type PerformanceObserverInit = {
  entryTypes?: Array<PerformanceEntryType>,
  type?: PerformanceEntryType,
  buffered?: boolean,
  durationThreshold?: DOMHighResTimeStamp,
};

export function warnNoNativePerformanceObserver() {
  warnOnce(
    'missing-native-performance-observer',
    'Missing native implementation of PerformanceObserver',
  );
}

function getSupportedPerformanceEntryTypes(): $ReadOnlyArray<PerformanceEntryType> {
  if (!NativePerformanceObserver) {
    return Object.freeze([]);
  }
  if (!NativePerformanceObserver.getSupportedPerformanceEntryTypes) {
    // fallback if getSupportedPerformanceEntryTypes is not defined on native side
    return Object.freeze(['mark', 'measure', 'event']);
  }
  return Object.freeze(
    NativePerformanceObserver.getSupportedPerformanceEntryTypes().map(
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
    if (!NativePerformanceObserver) {
      warnNoNativePerformanceObserver();
      return;
    }

    this.#validateObserveOptions(options);

    if (this.#nativeObserverHandle == null) {
      this.#nativeObserverHandle = this.#createNativeObserver();
    }

    if (options.entryTypes) {
      this.#type = 'multiple';
      NativePerformanceObserver.observe(this.#nativeObserverHandle, {
        entryTypes: options.entryTypes.map(performanceEntryTypeToRaw),
        type: undefined,
        buffered: undefined,
        durationThreshold:
          options.type === 'event' ? options.durationThreshold : undefined,
      });
    } else if (options.type) {
      this.#type = 'single';
      NativePerformanceObserver.observe(this.#nativeObserverHandle, {
        entryTypes: undefined,
        type: performanceEntryTypeToRaw(options.type),
        buffered: options.buffered,
        durationThreshold:
          options.type === 'event' ? options.durationThreshold : undefined,
      });
    }
  }

  disconnect(): void {
    if (!NativePerformanceObserver) {
      warnNoNativePerformanceObserver();
      return;
    }

    if (this.#nativeObserverHandle != null) {
      return;
    }

    NativePerformanceObserver.disconnect(this.#nativeObserverHandle);
  }

  #createNativeObserver(): OpaqueNativeObserverHandle {
    if (!NativePerformanceObserver) {
      warnNoNativePerformanceObserver();
      return;
    }

    this.#calledAtLeastOnce = false;

    return NativePerformanceObserver.createObserver(() => { // $FlowNotNull
      let entries = NativePerformanceObserver
        .takeRecords(this.#nativeObserverHandle);
      entries = entries.map(rawToPerformanceEntry);
      const entryList = new PerformanceObserverEntryList(entries);

      let droppedEntriesCount = 0;
      if (!this.#calledAtLeastOnce) {
        droppedEntriesCount = NativePerformanceObserver.getDroppedEntriesCount(this.#nativeObserverHandle);
        this.#calledAtLeastOnce = true;
      }

      this.#callback(entryList, this, { droppedEntriesCount });
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

    if (entryTypes && durationThreshold !== undefined) {
      throw new TypeError(
        "Failed to execute 'observe' on 'PerformanceObserver': An observe() call must not include both entryTypes and durationThreshold arguments.",
      );
    }
  }

  static supportedEntryTypes: $ReadOnlyArray<PerformanceEntryType> =
    getSupportedPerformanceEntryTypes();
}

export {PerformanceEventTiming};
