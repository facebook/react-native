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
export type PerformanceEntryType = 'mark' | 'measure';

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
) => void;

export type PerformanceObserverInit =
  | {
      entryTypes: Array<PerformanceEntryType>,
    }
  | {
      type: PerformanceEntryType,
    };

const _observedEntryTypeRefCount: Map<PerformanceEntryType, number> = new Map();

type PerformanceObserverConfig = {|
  callback: PerformanceObserverCallback,
  entryTypes: $ReadOnlySet<PerformanceEntryType>,
|};

const _observers: Map<PerformanceObserver, PerformanceObserverConfig> =
  new Map();

let _onPerformanceEntryCallbackIsSet: boolean = false;

// This is a callback that gets scheduled and periodically called from the native side
const onPerformanceEntry = () => {
  if (!NativePerformanceObserver) {
    return;
  }
  const rawEntries = NativePerformanceObserver.popPendingEntries?.() ?? [];
  if (rawEntries.length === 0) {
    return;
  }
  const entries = rawEntries.map(rawToPerformanceEntry);
  for (const [observer, observerConfig] of _observers.entries()) {
    const entriesForObserver: PerformanceEntryList = entries.filter(
      entry => observerConfig.entryTypes.has(entry.entryType) !== -1,
    );
    observerConfig.callback(
      new PerformanceObserverEntryList(entriesForObserver),
      observer,
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

  constructor(callback: PerformanceObserverCallback) {
    this._callback = callback;
  }

  observe(options: PerformanceObserverInit) {
    if (!NativePerformanceObserver) {
      warnNoNativePerformanceObserver();
      return;
    }

    if (!_onPerformanceEntryCallbackIsSet) {
      NativePerformanceObserver.setOnPerformanceEntryCallback(
        onPerformanceEntry,
      );
      _onPerformanceEntryCallbackIsSet = true;
    }

    let entryTypes = new Set(
      options.type != null ? [options.type] : options.entryTypes,
    );
    for (const type of entryTypes) {
      if (!_observedEntryTypeRefCount.has(type)) {
        NativePerformanceObserver.startReporting(type);
      }
      _observedEntryTypeRefCount.set(
        type,
        (_observedEntryTypeRefCount.get(type) ?? 0) + 1,
      );
    }
    // The same observer may have "observe" called multiple times,
    // with different entry types
    const observerConfig = _observers.get(this);
    if (observerConfig !== undefined) {
      entryTypes = new Set([...entryTypes, ...observerConfig.entryTypes]);
    }
    _observers.set(this, {entryTypes, callback: this._callback});
  }

  disconnect(): void {
    if (!NativePerformanceObserver) {
      warnNoNativePerformanceObserver();
      return;
    }

    const observerConfig = _observers.get(this);
    if (!observerConfig) {
      return;
    }

    for (const type of observerConfig.entryTypes) {
      const entryTypeRefCount = _observedEntryTypeRefCount.get(type) ?? 0;
      if (entryTypeRefCount === 1) {
        _observedEntryTypeRefCount.delete(type);
        NativePerformanceObserver.stopReporting(type);
      } else if (entryTypeRefCount !== 0) {
        _observedEntryTypeRefCount.set(type, entryTypeRefCount - 1);
      }
    }

    _observers.delete(this);
    if (_observers.size === 0) {
      NativePerformanceObserver.setOnPerformanceEntryCallback(undefined);
      _onPerformanceEntryCallbackIsSet = false;
    }
  }

  static supportedEntryTypes: $ReadOnlyArray<PerformanceEntryType> =
    Object.freeze(['mark', 'measure']);
}
