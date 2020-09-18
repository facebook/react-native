/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const Systrace = require('../Performance/Systrace');

const infoLog = require('./infoLog');
const performanceNow: () => number =
  global.nativeQPLTimestamp ?? global.performance.now.bind(global.performance);

type Timespan = {
  startTime: number,
  endTime?: number,
  totalTime?: number,
};

// Extra values should be serializable primitives
type ExtraValue = number | string | boolean;

export interface IPerformanceLogger {
  addTimespan(key: string, startTime: number, endTime: number): void;
  startTimespan(key: string): void;
  stopTimespan(key: string): void;
  clear(): void;
  clearCompleted(): void;
  currentTimestamp(): number;
  getTimespans(): {[key: string]: Timespan, ...};
  hasTimespan(key: string): boolean;
  setExtra(key: string, value: ExtraValue): void;
  getExtras(): {[key: string]: ExtraValue, ...};
  removeExtra(key: string): ExtraValue | void;
  markPoint(key: string, timestamp?: number): void;
  getPoints(): {[key: string]: number, ...};
  logEverything(): void;
}

const _cookies: {[key: string]: number, ...} = {};

const PRINT_TO_CONSOLE: false = false; // Type as false to prevent accidentally committing `true`;

class PerformanceLogger implements IPerformanceLogger {
  _timespans: {[key: string]: Timespan} = {};
  _extras: {[key: string]: ExtraValue} = {};
  _points: {[key: string]: number} = {};

  addTimespan(key: string, startTime: number, endTime: number) {
    if (this._timespans[key]) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to add a timespan that already exists ',
          key,
        );
      }
      return;
    }

    this._timespans[key] = {
      startTime,
      endTime,
      totalTime: endTime - (startTime || 0),
    };
  }

  startTimespan(key: string) {
    if (this._timespans[key]) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to start a timespan that already exists ',
          key,
        );
      }
      return;
    }

    this._timespans[key] = {
      startTime: performanceNow(),
    };
    _cookies[key] = Systrace.beginAsyncEvent(key);
    if (PRINT_TO_CONSOLE) {
      infoLog('PerformanceLogger.js', 'start: ' + key);
    }
  }

  stopTimespan(key: string) {
    const timespan = this._timespans[key];
    if (!timespan || timespan.startTime == null) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to end a timespan that has not started ',
          key,
        );
      }
      return;
    }
    if (timespan.endTime != null) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to end a timespan that has already ended ',
          key,
        );
      }
      return;
    }

    timespan.endTime = performanceNow();
    timespan.totalTime = timespan.endTime - (timespan.startTime || 0);
    if (PRINT_TO_CONSOLE) {
      infoLog('PerformanceLogger.js', 'end: ' + key);
    }

    if (_cookies[key] != null) {
      Systrace.endAsyncEvent(key, _cookies[key]);
      delete _cookies[key];
    }
  }

  clear() {
    this._timespans = {};
    this._extras = {};
    this._points = {};
    if (PRINT_TO_CONSOLE) {
      infoLog('PerformanceLogger.js', 'clear');
    }
  }

  clearCompleted() {
    for (const key in this._timespans) {
      if (this._timespans[key].totalTime != null) {
        delete this._timespans[key];
      }
    }
    this._extras = {};
    this._points = {};
    if (PRINT_TO_CONSOLE) {
      infoLog('PerformanceLogger.js', 'clearCompleted');
    }
  }

  currentTimestamp() {
    return performanceNow();
  }

  getTimespans() {
    return this._timespans;
  }

  hasTimespan(key: string) {
    return !!this._timespans[key];
  }

  setExtra(key: string, value: ExtraValue) {
    if (this._extras.hasOwnProperty(key)) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to set an extra that already exists ',
          {key, currentValue: this._extras[key], attemptedValue: value},
        );
      }
      return;
    }
    this._extras[key] = value;
  }

  getExtras() {
    return this._extras;
  }

  removeExtra(key: string): ExtraValue | void {
    const value = this._extras[key];
    delete this._extras[key];
    return value;
  }

  markPoint(key: string, timestamp?: number) {
    if (this._points[key]) {
      if (PRINT_TO_CONSOLE && __DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to mark a point that has been already logged ',
          key,
        );
      }
      return;
    }
    this._points[key] = timestamp ?? performanceNow();
  }

  getPoints() {
    return this._points;
  }

  logEverything() {
    if (PRINT_TO_CONSOLE) {
      // log timespans
      for (const key in this._timespans) {
        if (this._timespans[key].totalTime != null) {
          infoLog(key + ': ' + this._timespans[key].totalTime + 'ms');
        }
      }

      // log extras
      infoLog(this._extras);

      // log points
      for (const key in this._points) {
        infoLog(key + ': ' + this._points[key] + 'ms');
      }
    }
  }
}

/**
 * This function creates performance loggers that can be used to collect and log
 * various performance data such as timespans, points and extras.
 * The loggers need to have minimal overhead since they're used in production.
 */
function createPerformanceLogger(): IPerformanceLogger {
  return new PerformanceLogger();
}

module.exports = createPerformanceLogger;
