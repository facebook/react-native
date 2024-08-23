/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

import type {HighResTimeStamp, PerformanceEntryType} from './PerformanceEntry';

import warnOnce from '../../../../Libraries/Utilities/warnOnce';
import {PerformanceEntry} from './PerformanceEntry';
import PerformanceEventTiming from './PerformanceEventTiming';
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
      durationThreshold?: HighResTimeStamp,
    };

type PerformanceObserverConfig = {|
  callback: PerformanceObserverCallback,
  // Map of {entryType: durationThreshold}
  entryTypes: $ReadOnlyMap<PerformanceEntryType, ?number>,
|};

const observerCountPerEntryType: Map<PerformanceEntryType, number> = new Map();
const registeredObservers: Map<PerformanceObserver, PerformanceObserverConfig> =
  new Map();
let isOnPerformanceEntryCallbackSet: boolean = false;

// This is a callback that gets scheduled and periodically called from the native side
const onPerformanceEntry = () => {
  if (!NativePerformanceObserver) {
    return;
  }
  const entryResult = NativePerformanceObserver.popPendingEntries();
  const rawEntries = entryResult?.entries ?? [];
  const droppedEntriesCount = entryResult?.droppedEntriesCount;
  if (rawEntries.length === 0) {
    return;
  }
  const entries = rawEntries.map(rawToPerformanceEntry);
  for (const [observer, observerConfig] of registeredObservers.entries()) {
    const entriesForObserver: PerformanceEntryList = entries.filter(entry => {
      if (!observerConfig.entryTypes.has(entry.entryType)) {
        return false;
      }
      const durationThreshold = observerConfig.entryTypes.get(entry.entryType);
      return entry.duration >= (durationThreshold ?? 0);
    });
    if (entriesForObserver.length !== 0) {
      try {
        observerConfig.callback(
          new PerformanceObserverEntryList(entriesForObserver),
          observer,
          droppedEntriesCount,
        );
      } catch (error) {
        console.error(error);
      }
    }
  }
};

export function warnNoNativePerformanceObserver() {
  warnOnce(
    'missing-native-performance-observer',
    'Missing native implementation of PerformanceObserver',
  );
}

function applyDurationThresholds() {
  const durationThresholds: Map<PerformanceEntryType, ?number> = Array.from(
    registeredObservers.values(),
  )
    .map(config => config.entryTypes)
    .reduce(
      (accumulator, currentValue) => union(accumulator, currentValue),
      new Map(),
    );

  for (const [entryType, durationThreshold] of durationThresholds) {
    NativePerformanceObserver?.setDurationThreshold(
      performanceEntryTypeToRaw(entryType),
      durationThreshold ?? 0,
    );
  }
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
export default class PerformanceObserver {
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
      requestedEntryTypes = new Map(
        options.entryTypes.map(t => [t, undefined]),
      );
    } else {
      this.#type = 'single';
      requestedEntryTypes = new Map([
        [options.type, options.durationThreshold],
      ]);
    }

    // The same observer may receive multiple calls to "observe", so we need
    // to check what is new on this call vs. previous ones.
    const currentEntryTypes = registeredObservers.get(this)?.entryTypes;
    const nextEntryTypes = currentEntryTypes
      ? union(requestedEntryTypes, currentEntryTypes)
      : requestedEntryTypes;

    // This `observe` call is a no-op because there are no new things to observe.
    if (currentEntryTypes && currentEntryTypes.size === nextEntryTypes.size) {
      return;
    }

    registeredObservers.set(this, {
      callback: this.#callback,
      entryTypes: nextEntryTypes,
    });

    if (!isOnPerformanceEntryCallbackSet) {
      NativePerformanceObserver.setOnPerformanceEntryCallback(
        onPerformanceEntry,
      );
      isOnPerformanceEntryCallbackSet = true;
    }

    // We only need to start listenening to new entry types being observed in
    // this observer.
    const newEntryTypes = currentEntryTypes
      ? difference(
          new Set(requestedEntryTypes.keys()),
          new Set(currentEntryTypes.keys()),
        )
      : new Set(requestedEntryTypes.keys());
    for (const type of newEntryTypes) {
      if (!observerCountPerEntryType.has(type)) {
        const rawType = performanceEntryTypeToRaw(type);
        NativePerformanceObserver.startReporting(rawType);
      }
      observerCountPerEntryType.set(
        type,
        (observerCountPerEntryType.get(type) ?? 0) + 1,
      );
    }
    applyDurationThresholds();
  }

  disconnect(): void {
    if (!NativePerformanceObserver) {
      warnNoNativePerformanceObserver();
      return;
    }

    const observerConfig = registeredObservers.get(this);
    if (!observerConfig) {
      return;
    }

    // Disconnect this observer
    for (const type of observerConfig.entryTypes.keys()) {
      const numberOfObserversForThisType =
        observerCountPerEntryType.get(type) ?? 0;
      if (numberOfObserversForThisType === 1) {
        observerCountPerEntryType.delete(type);
        NativePerformanceObserver.stopReporting(
          performanceEntryTypeToRaw(type),
        );
      } else if (numberOfObserversForThisType !== 0) {
        observerCountPerEntryType.set(type, numberOfObserversForThisType - 1);
      }
    }

    // Disconnect all observers if this was the last one
    registeredObservers.delete(this);
    if (registeredObservers.size === 0) {
      NativePerformanceObserver.setOnPerformanceEntryCallback(undefined);
      isOnPerformanceEntryCallbackSet = false;
    }

    applyDurationThresholds();
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

// As a Set union, except if value exists in both, we take minimum
function union<T>(
  a: $ReadOnlyMap<T, ?number>,
  b: $ReadOnlyMap<T, ?number>,
): Map<T, ?number> {
  const res = new Map<T, ?number>();
  for (const [k, v] of a) {
    if (!b.has(k)) {
      res.set(k, v);
    } else {
      res.set(k, Math.min(v ?? 0, b.get(k) ?? 0));
    }
  }
  return res;
}

function difference<T>(a: $ReadOnlySet<T>, b: $ReadOnlySet<T>): Set<T> {
  return new Set([...a].filter(x => !b.has(x)));
}

export {PerformanceEventTiming};
