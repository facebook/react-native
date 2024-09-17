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

export type PerformanceObserverCallback = (
  list: PerformanceObserverEntryList,
  observer: PerformanceObserver,
  // The number of buffered entries which got dropped from the buffer due to the buffer being full:
  droppedEntryCount?: number,
) => void;

export type PerformanceObserverInit =
  | {
      entryTypes: Array<PerformanceEntryType>,
    }
  | {
      type: PerformanceEntryType,
      durationThreshold?: DOMHighResTimeStamp,
    };

type PerformanceObserverConfig = {|
  callback: PerformanceObserverCallback,
  entryTypes: $ReadOnlySet<PerformanceEntryType>,
  durationThreshold: ?number,
|};

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
  #nativeObserverHandle: mixed | void;
  #callback: PerformanceObserverCallback;
  #type: 'single' | 'multiple' | void;

  constructor(callback: PerformanceObserverCallback) {
    this.#callback = callback;
  }

  observe(options: PerformanceObserverInit): void {
    if (!NativePerformanceObserver) {
      warnNoNativePerformanceObserver();
      return;
    }

    this.#validateObserveOptions(options);

    let requestedEntryTypes;

    if (options.entryTypes) {
      this.#type = 'multiple';
      requestedEntryTypes = new Set(options.entryTypes);
    } else {
      this.#type = 'single';
      requestedEntryTypes = new Set([options.type]);
    }

    if (!this.#nativeObserverHandle) {
      this.#nativeObserverHandle = this.#createNativeObserver();
    }

    // The same observer may receive multiple calls to "observe", so we need
    // to check what is new on this call vs. previous ones.
    NativePerformanceObserver.observe(this.#observerHandle, {
      entryTypes,
      durationThreshold:
        options.type === 'event' ? options.durationThreshold : undefined,
    });
  }

  disconnect(): void {
    if (!NativePerformanceObserver) {
      warnNoNativePerformanceObserver();
      return;
    }

    if (!this.#nativeObserverHandle) {
      return;
    }

    NativePerformanceObserver.disconnect(this.#nativeObserverHandle);
  }

  #createNativeObserver() {
    return NativePerformanceObserver.createObserver(() => {
      const entryList = new PerformanceObserverEntryList(NativePerformanceObserver.takeRecords(this.#observerHandle));
      const droppedEntriesCount = NativePerformanceObserver.getDroppedEntriesCount(this.#nativeObserverHandle);
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
