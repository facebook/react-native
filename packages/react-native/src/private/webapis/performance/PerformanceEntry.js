/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

// flowlint unsafe-getters-setters:off

import {setPlatformObject} from '../webidl/PlatformObjects';

export type DOMHighResTimeStamp = number;
export type PerformanceEntryType =
  | 'mark'
  | 'measure'
  | 'event'
  | 'longtask'
  | 'resource';

export type PerformanceEntryJSON = {
  name: string,
  entryType: PerformanceEntryType,
  startTime: DOMHighResTimeStamp,
  duration: DOMHighResTimeStamp,
  ...
};

export class PerformanceEntry {
  // We don't use private fields because they're significantly slower to
  // initialize on construction and to access.
  // We also need these to be protected so they can be initialized in subclasses
  // where we avoid calling `super()` for performance reasons.
  __name: string;
  __entryType: PerformanceEntryType;
  __startTime: DOMHighResTimeStamp;
  __duration: DOMHighResTimeStamp;

  constructor(init: {
    name: string,
    entryType: PerformanceEntryType,
    startTime: DOMHighResTimeStamp,
    duration: DOMHighResTimeStamp,
  }) {
    this.__name = init.name;
    this.__entryType = init.entryType;
    this.__startTime = init.startTime;
    this.__duration = init.duration;
  }

  get name(): string {
    return this.__name;
  }

  get entryType(): PerformanceEntryType {
    return this.__entryType;
  }

  get startTime(): DOMHighResTimeStamp {
    return this.__startTime;
  }

  get duration(): DOMHighResTimeStamp {
    return this.__duration;
  }

  toJSON(): PerformanceEntryJSON {
    return {
      name: this.__name,
      entryType: this.__entryType,
      startTime: this.__startTime,
      duration: this.__duration,
    };
  }
}

setPlatformObject(PerformanceEntry);

export type PerformanceEntryList = $ReadOnlyArray<PerformanceEntry>;
