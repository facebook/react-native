/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

export type HighResTimeStamp = number;
export type PerformanceEntryType = 'mark' | 'measure' | 'event';

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
