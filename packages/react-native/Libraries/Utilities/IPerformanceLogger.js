/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

export type Timespan = {
  startTime: number,
  endTime?: number,
  totalTime?: number,
  startExtras?: Extras,
  endExtras?: Extras,
};

// Extra values should be serializable primitives
export type ExtraValue = number | string | boolean;

export type Extras = {[key: string]: ExtraValue};

export interface IPerformanceLogger {
  addTimespan(
    key: string,
    startTime: number,
    endTime: number,
    startExtras?: Extras,
    endExtras?: Extras,
  ): void;
  append(logger: IPerformanceLogger): void;
  clear(): void;
  clearCompleted(): void;
  close(): void;
  currentTimestamp(): number;
  getExtras(): $ReadOnly<{[key: string]: ?ExtraValue, ...}>;
  getPoints(): $ReadOnly<{[key: string]: ?number, ...}>;
  getPointExtras(): $ReadOnly<{[key: string]: ?Extras, ...}>;
  getTimespans(): $ReadOnly<{[key: string]: ?Timespan, ...}>;
  hasTimespan(key: string): boolean;
  isClosed(): boolean;
  logEverything(): void;
  markPoint(key: string, timestamp?: number, extras?: Extras): void;
  removeExtra(key: string): ?ExtraValue;
  setExtra(key: string, value: ExtraValue): void;
  startTimespan(key: string, timestamp?: number, extras?: Extras): void;
  stopTimespan(key: string, timestamp?: number, extras?: Extras): void;
}
