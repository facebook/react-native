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

const Systrace = require('Systrace');

const infoLog = require('infoLog');
const performanceNow =
  global.nativeQPLTimestamp ||
  global.nativePerformanceNow ||
  require('fbjs/lib/performanceNow');

type Timespan = {
  description?: string,
  totalTime?: number,
  startTime?: number,
  endTime?: number,
};

let timespans: {[key: string]: Timespan} = {};
let extras: {[key: string]: any} = {};
let points: {[key: string]: number} = {};
const cookies: {[key: string]: number} = {};

const PRINT_TO_CONSOLE: false = false; // Type as false to prevent accidentally committing `true`;

/**
 * This is meant to collect and log performance data in production, which means
 * it needs to have minimal overhead.
 */
const PerformanceLogger = {
  addTimespan(key: string, lengthInMs: number, description?: string) {
    if (timespans[key]) {
      if (__DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to add a timespan that already exists ',
          key,
        );
      }
      return;
    }

    timespans[key] = {
      description: description,
      totalTime: lengthInMs,
    };
  },

  startTimespan(key: string, description?: string) {
    if (timespans[key]) {
      if (__DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to start a timespan that already exists ',
          key,
        );
      }
      return;
    }

    timespans[key] = {
      description: description,
      startTime: performanceNow(),
    };
    cookies[key] = Systrace.beginAsyncEvent(key);
    if (PRINT_TO_CONSOLE) {
      infoLog('PerformanceLogger.js', 'start: ' + key);
    }
  },

  stopTimespan(key: string) {
    const timespan = timespans[key];
    if (!timespan || !timespan.startTime) {
      if (__DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to end a timespan that has not started ',
          key,
        );
      }
      return;
    }
    if (timespan.endTime) {
      if (__DEV__) {
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

    Systrace.endAsyncEvent(key, cookies[key]);
    delete cookies[key];
  },

  clear() {
    timespans = {};
    extras = {};
    points = {};
    if (PRINT_TO_CONSOLE) {
      infoLog('PerformanceLogger.js', 'clear');
    }
  },

  clearCompleted() {
    for (const key in timespans) {
      if (timespans[key].totalTime) {
        delete timespans[key];
      }
    }
    extras = {};
    points = {};
    if (PRINT_TO_CONSOLE) {
      infoLog('PerformanceLogger.js', 'clearCompleted');
    }
  },

  clearExceptTimespans(keys: Array<string>) {
    timespans = Object.keys(timespans).reduce(function(previous, key) {
      if (keys.indexOf(key) !== -1) {
        previous[key] = timespans[key];
      }
      return previous;
    }, {});
    extras = {};
    points = {};
    if (PRINT_TO_CONSOLE) {
      infoLog('PerformanceLogger.js', 'clearExceptTimespans', keys);
    }
  },

  currentTimestamp() {
    return performanceNow();
  },

  getTimespans() {
    return timespans;
  },

  hasTimespan(key: string) {
    return !!timespans[key];
  },

  logTimespans() {
    for (const key in timespans) {
      if (timespans[key].totalTime) {
        infoLog(key + ': ' + timespans[key].totalTime + 'ms');
      }
    }
  },

  addTimespans(newTimespans: Array<number>, labels: Array<string>) {
    for (let ii = 0, l = newTimespans.length; ii < l; ii += 2) {
      const label = labels[ii / 2];
      PerformanceLogger.addTimespan(
        label,
        newTimespans[ii + 1] - newTimespans[ii],
        label,
      );
    }
  },

  setExtra(key: string, value: any) {
    if (extras[key]) {
      if (__DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to set an extra that already exists ',
          {key, currentValue: extras[key], attemptedValue: value},
        );
      }
      return;
    }
    extras[key] = value;
  },

  getExtras() {
    return extras;
  },

  logExtras() {
    infoLog(extras);
  },

  markPoint(key: string, timestamp?: number) {
    if (points[key]) {
      if (__DEV__) {
        infoLog(
          'PerformanceLogger: Attempting to mark a point that has been already logged ',
          key,
        );
      }
      return;
    }
    points[key] = timestamp ?? performanceNow();
  },

  getPoints() {
    return points;
  },

  logPoints() {
    for (const key in points) {
      infoLog(key + ': ' + points[key] + 'ms');
    }
  },
};

module.exports = PerformanceLogger;
