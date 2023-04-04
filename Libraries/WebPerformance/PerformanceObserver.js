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
import NativePerformanceObserver from './NativePerformanceObserver';

export type HighResTimeStamp = number;
// TODO: Extend once new types (such as event) are supported.
// TODO: Get rid of the "undefined" once there is at least one type supported.
export type PerformanceEntryType = 'undefined';

export class PerformanceEntry {
  name: string;
  entryType: PerformanceEntryType;
  startTime: HighResTimeStamp;
  duration: number;

  constructor(init: {
    name: string,
    entryType: PerformanceEntryType,
    startTime: HighResTimeStamp,
    duration: number,
  }) {
    this.name = init.name;
    this.entryType = init.entryType;
    this.startTime = init.startTime;
    this.duration = init.duration;
  }

  // $FlowIgnore: Flow(unclear-type)
  toJSON(): Object {
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
  return 'undefined';
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

let _observedEntryTypeRefCount: Map<PerformanceEntryType, number> = new Map();

let _observers: Set<PerformanceObserver> = new Set();

let _onPerformanceEntryCallbackIsSet: boolean = false;

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
  _entryTypes: $ReadOnlySet<PerformanceEntryType>;

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
    if (options.entryTypes) {
      this._entryTypes = new Set(options.entryTypes);
    } else {
      this._entryTypes = new Set([options.type]);
    }
    this._entryTypes.forEach(type => {
      if (!_observedEntryTypeRefCount.has(type)) {
        NativePerformanceObserver.startReporting(type);
      }
      _observedEntryTypeRefCount.set(
        type,
        (_observedEntryTypeRefCount.get(type) ?? 0) + 1,
      );
    });
    _observers.add(this);
  }

  disconnect(): void {
    if (!NativePerformanceObserver) {
      warnNoNativePerformanceObserver();
      return;
    }
    this._entryTypes.forEach(type => {
      const entryTypeRefCount = _observedEntryTypeRefCount.get(type) ?? 0;
      if (entryTypeRefCount === 1) {
        _observedEntryTypeRefCount.delete(type);
        NativePerformanceObserver.stopReporting(type);
      } else if (entryTypeRefCount !== 0) {
        _observedEntryTypeRefCount.set(type, entryTypeRefCount - 1);
      }
    });
    _observers.delete(this);
    if (_observers.size === 0) {
      NativePerformanceObserver.setOnPerformanceEntryCallback(undefined);
      _onPerformanceEntryCallbackIsSet = false;
    }
  }

  static supportedEntryTypes: $ReadOnlyArray<PerformanceEntryType> =
    // TODO: add types once they are fully supported
    Object.freeze([]);
}

// This is a callback that gets scheduled and periodically called from the native side
function onPerformanceEntry() {
  if (!NativePerformanceObserver) {
    return;
  }
  const rawEntries = NativePerformanceObserver.getPendingEntries();
  const entries = rawEntries.map(rawToPerformanceEntry);
  _observers.forEach(observer => {
    const entriesForObserver: PerformanceEntryList = entries.filter(entry =>
      observer._entryTypes.has(entry.entryType),
    );
    observer._callback(
      new PerformanceObserverEntryList(entriesForObserver),
      observer,
    );
  });
}
