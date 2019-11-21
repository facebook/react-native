/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const Systrace = require('../Performance/Systrace');

const infoLog = require('./infoLog');
const performanceNow =
  global.nativeQPLTimestamp ||
  global.nativePerformanceNow ||
  require('fbjs/lib/performanceNow');

type Timespan = {
  description?: string,
  totalTime?: number,
  startTime?: number,
  endTime?: number,
  ...
};

export type IPerformanceLogger = {
  addTimespan(string, number, string | void): void,
  startTimespan(string, string | void): void,
  stopTimespan(string): void,
  clear(): void,
  clearCompleted(): void,
  clearExceptTimespans(Array<string>): void,
  currentTimestamp(): number,
  getTimespans(): {[key: string]: Timespan, ...},
  hasTimespan(string): boolean,
  logTimespans(): void,
  addTimespans(Array<number>, Array<string>): void,
  setExtra(string, any): void,
  getExtras(): {[key: string]: any, ...},
  removeExtra(string): ?any,
  logExtras(): void,
  markPoint(string, number | void): void,
  getPoints(): {[key: string]: number, ...},
  logPoints(): void,
  logEverything(): void,
  ...
};

const _cookies: {[key: string]: number, ...} = {};

const PRINT_TO_CONSOLE: false = false; // Type as false to prevent accidentally committing `true`;

/**
 * This function creates performance loggers that can be used to collect and log
 * various performance data such as timespans, points and extras.
 * The loggers need to have minimal overhead since they're used in production.
 */
function createPerformanceLogger(): IPerformanceLogger {
  const result: IPerformanceLogger & {
    _timespans: {[key: string]: Timespan, ...},
    _extras: {[key: string]: any, ...},
    _points: {[key: string]: number, ...},
    ...
  } = {
    _timespans: {},
    _extras: {},
    _points: {},

    addTimespan(key: string, lengthInMs: number, description?: string) {
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
        description: description,
        totalTime: lengthInMs,
      };
    },

    startTimespan(key: string, description?: string) {
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
        description: description,
        startTime: performanceNow(),
      };
      _cookies[key] = Systrace.beginAsyncEvent(key);
      if (PRINT_TO_CONSOLE) {
        infoLog('PerformanceLogger.js', 'start: ' + key);
      }
    },

    stopTimespan(key: string) {
      const timespan = this._timespans[key];
      if (!timespan || !timespan.startTime) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          infoLog(
            'PerformanceLogger: Attempting to end a timespan that has not started ',
            key,
          );
        }
        return;
      }
      if (timespan.endTime) {
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

      Systrace.endAsyncEvent(key, _cookies[key]);
      delete _cookies[key];
    },

    clear() {
      this._timespans = {};
      this._extras = {};
      this._points = {};
      if (PRINT_TO_CONSOLE) {
        infoLog('PerformanceLogger.js', 'clear');
      }
    },

    clearCompleted() {
      for (const key in this._timespans) {
        if (this._timespans[key].totalTime) {
          delete this._timespans[key];
        }
      }
      this._extras = {};
      this._points = {};
      if (PRINT_TO_CONSOLE) {
        infoLog('PerformanceLogger.js', 'clearCompleted');
      }
    },

    clearExceptTimespans(keys: Array<string>) {
      this._timespans = Object.keys(this._timespans).reduce(function(
        previous,
        key,
      ) {
        if (keys.indexOf(key) !== -1) {
          previous[key] = this._timespans[key];
        }
        return previous;
      },
      {});
      this._extras = {};
      this._points = {};
      if (PRINT_TO_CONSOLE) {
        infoLog('PerformanceLogger.js', 'clearExceptTimespans', keys);
      }
    },

    currentTimestamp() {
      return performanceNow();
    },

    getTimespans() {
      return this._timespans;
    },

    hasTimespan(key: string) {
      return !!this._timespans[key];
    },

    logTimespans() {
      if (PRINT_TO_CONSOLE) {
        for (const key in this._timespans) {
          if (this._timespans[key].totalTime) {
            infoLog(key + ': ' + this._timespans[key].totalTime + 'ms');
          }
        }
      }
    },

    addTimespans(newTimespans: Array<number>, labels: Array<string>) {
      for (let ii = 0, l = newTimespans.length; ii < l; ii += 2) {
        const label = labels[ii / 2];
        this.addTimespan(label, newTimespans[ii + 1] - newTimespans[ii], label);
      }
    },

    setExtra(key: string, value: any) {
      if (this._extras[key]) {
        if (PRINT_TO_CONSOLE && __DEV__) {
          infoLog(
            'PerformanceLogger: Attempting to set an extra that already exists ',
            {key, currentValue: this._extras[key], attemptedValue: value},
          );
        }
        return;
      }
      this._extras[key] = value;
    },

    getExtras() {
      return this._extras;
    },

    removeExtra(key: string): ?any {
      const value = this._extras[key];
      delete this._extras[key];
      return value;
    },

    logExtras() {
      if (PRINT_TO_CONSOLE) {
        infoLog(this._extras);
      }
    },

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
    },

    getPoints() {
      return this._points;
    },

    logPoints() {
      if (PRINT_TO_CONSOLE) {
        for (const key in this._points) {
          infoLog(key + ': ' + this._points[key] + 'ms');
        }
      }
    },

    logEverything() {
      this.logTimespans();
      this.logExtras();
      this.logPoints();
    },
  };
  return result;
}

module.exports = createPerformanceLogger;
