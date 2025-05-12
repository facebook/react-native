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
  #name: string;
  #entryType: PerformanceEntryType;
  #startTime: DOMHighResTimeStamp;
  #duration: DOMHighResTimeStamp;

  constructor(init: {
    name: string,
    entryType: PerformanceEntryType,
    startTime: DOMHighResTimeStamp,
    duration: DOMHighResTimeStamp,
  }) {
    this.#name = init.name;
    this.#entryType = init.entryType;
    this.#startTime = init.startTime;
    this.#duration = init.duration;
  }

  get name(): string {
    return this.#name;
  }

  get entryType(): PerformanceEntryType {
    return this.#entryType;
  }

  get startTime(): DOMHighResTimeStamp {
    return this.#startTime;
  }

  get duration(): DOMHighResTimeStamp {
    return this.#duration;
  }

  toJSON(): PerformanceEntryJSON {
    return {
      name: this.#name,
      entryType: this.#entryType,
      startTime: this.#startTime,
      duration: this.#duration,
    };
  }
}

export type PerformanceEntryList = $ReadOnlyArray<PerformanceEntry>;
