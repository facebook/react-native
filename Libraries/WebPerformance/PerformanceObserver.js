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
  RawPerformanceEntry,
  RawPerformanceEntryType,
} from './NativePerformanceObserver';

import warnOnce from '../Utilities/warnOnce';
import NativePerformanceObserver, {
  RawPerformanceEntryTypeValues,
} from './NativePerformanceObserver';

export type HighResTimeStamp = number;
export type PerformanceEntryType = 'mark' | 'measure' | 'event' | 'first-input';

export class PerformanceEntry {
  name: string;
  entryType: PerformanceEntryType;
  startTime: HighResTimeStamp;
  duration: HighResTimeStamp;

  constructor(init: {
    name: string,
    entryType: PerformanceEntryType,
    startTime: HighResTimeStamp,
    duration: HighResTimeStamp,
  }) {
    this.name = init.name;
    this.entryType = init.entryType;
    this.startTime = init.startTime;
    this.duration = init.duration;
  }

  toJSON(): {
    name: string,
    entryType: PerformanceEntryType,
    startTime: HighResTimeStamp,
    duration: HighResTimeStamp,
  } {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
    };
  }
}

function rawToPerformanceEntryType(
  type: RawPerformanceEntryType,
): PerformanceEntryType {
  switch (type) {
    case RawPerformanceEntryTypeValues.MARK:
      return 'mark';
    case RawPerformanceEntryTypeValues.MEASURE:
      return 'measure';
    case RawPerformanceEntryTypeValues.EVENT:
      return 'event';
    case RawPerformanceEntryTypeValues.FIRST_INPUT:
      return 'first-input';
    default:
      throw new TypeError(
        `unexpected performance entry type received: ${type}`,
      );
  }
}

function rawToPerformanceEntry(entry: RawPerformanceEntry): PerformanceEntry {
  return new PerformanceEntry({
    name: entry.name,
    entryType: rawToPerformanceEntryType(entry.entryType),
    startTime: entry.startTime,
    duration: entry.duration,
  });
}

export type PerformanceEntryList = $ReadOnlyArray<PerformanceEntry>;

export class PerformanceObserverEntryList {
  _entries: PerformanceEntryList;

  constructor(entries: PerformanceEntryList) {
    this._entries = entries;
  }

  getEntries(): PerformanceEntryList {
    return this._entries;
  }

  getEntriesByType(type: PerformanceEntryType): PerformanceEntryList {
    return this._entries.filter(entry => entry.entryType === type);
  }

  getEntriesByName(
    name: string,
    type?: PerformanceEntryType,
  ): PerformanceEntryList {
    if (type === undefined) {
      return this._entries.filter(entry => entry.name === name);
    } else {
      return this._entries.filter(
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
    };

type PerformanceObserverConfig = {|
  callback: PerformanceObserverCallback,
  entryTypes: $ReadOnlySet<PerformanceEntryType>,
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
    const entriesForObserver: PerformanceEntryList = entries.filter(
      entry => observerConfig.entryTypes.has(entry.entryType) !== -1,
    );
    observerConfig.callback(
      new PerformanceObserverEntryList(entriesForObserver),
      observer,
      droppedEntriesCount,
    );
  }
};

function warnNoNativePerformanceObserver() {
  warnOnce(
    'missing-native-performance-observer',
    'Missing native implementation of PerformanceObserver',
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
  _callback: PerformanceObserverCallback;
  _type: 'single' | 'multiple' | void;

  constructor(callback: PerformanceObserverCallback) {
    this._callback = callback;
  }

  observe(options: PerformanceObserverInit): void {
    if (!NativePerformanceObserver) {
      warnNoNativePerformanceObserver();
      return;
    }

    this._validateObserveOptions(options);

    let requestedEntryTypes;

    if (options.entryTypes) {
      this._type = 'multiple';
      requestedEntryTypes = new Set(options.entryTypes);
    } else {
      this._type = 'single';
      requestedEntryTypes = new Set([options.type]);
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
      callback: this._callback,
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
      ? difference(requestedEntryTypes, currentEntryTypes)
      : requestedEntryTypes;
    for (const type of newEntryTypes) {
      if (!observerCountPerEntryType.has(type)) {
        NativePerformanceObserver.startReporting(type);
      }
      observerCountPerEntryType.set(
        type,
        (observerCountPerEntryType.get(type) ?? 0) + 1,
      );
    }
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
    for (const type of observerConfig.entryTypes) {
      const numberOfObserversForThisType =
        observerCountPerEntryType.get(type) ?? 0;
      if (numberOfObserversForThisType === 1) {
        observerCountPerEntryType.delete(type);
        NativePerformanceObserver.stopReporting(type);
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
  }

  _validateObserveOptions(options: PerformanceObserverInit): void {
    const {type, entryTypes} = options;

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

    if (this._type === 'multiple' && type) {
      throw new Error(
        "Failed to execute 'observe' on 'PerformanceObserver': This observer has performed observe({entryTypes:...}, therefore it cannot perform observe({type:...})",
      );
    }

    if (this._type === 'single' && entryTypes) {
      throw new Error(
        "Failed to execute 'observe' on 'PerformanceObserver': This PerformanceObserver has performed observe({type:...}, therefore it cannot perform observe({entryTypes:...})",
      );
    }
  }

  static supportedEntryTypes: $ReadOnlyArray<PerformanceEntryType> =
    Object.freeze(['mark', 'measure', 'event', 'first-input']);
}

function union<T>(a: $ReadOnlySet<T>, b: $ReadOnlySet<T>): Set<T> {
  return new Set([...a, ...b]);
}

function difference<T>(a: $ReadOnlySet<T>, b: $ReadOnlySet<T>): Set<T> {
  return new Set([...a].filter(x => !b.has(x)));
}
