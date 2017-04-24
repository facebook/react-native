/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PerformanceLogger
 * @flow
 */
'use strict';

const BatchedBridge = require('BatchedBridge');
const Systrace = require('Systrace');

const performanceNow = global.nativePerformanceNow || require('fbjs/lib/performanceNow');

type Timespan = {
  description?: string,
  totalTime?: number,
  startTime?: number,
  endTime?: number,
};

let timespans: {[key:string]: Timespan} = {};
let extras: {[key:string]: any} = {};
const cookies: {[key:string]: number} = {};

const PRINT_TO_CONSOLE = false;

/**
 * This is meant to collect and log performance data in production, which means
 * it needs to have minimal overhead.
 */
const PerformanceLogger = {
  addTimespan(key: string, lengthInMs: number, description?: string) {
    if (timespans[key]) {
      if (__DEV__) {
        console.log(
          'PerformanceLogger: Attempting to add a timespan that already exists ',
          key
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
        console.log(
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
    if (__DEV__ && PRINT_TO_CONSOLE) {
      console.log('PerformanceLogger.js', 'start: ' + key);
    }
  },

  stopTimespan(key: string) {
    const timespan = timespans[key];
    if (!timespan || !timespan.startTime) {
      if (__DEV__) {
        console.log(
          'PerformanceLogger: Attempting to end a timespan that has not started ',
          key,
        );
      }
      return;
    }
    if (timespan.endTime) {
      if (__DEV__) {
        console.log(
          'PerformanceLogger: Attempting to end a timespan that has already ended ',
          key
        );
      }
      return;
    }

    timespan.endTime = performanceNow();
    timespan.totalTime = timespan.endTime - (timespan.startTime || 0);
    if (__DEV__ && PRINT_TO_CONSOLE) {
      console.log('PerformanceLogger.js', 'end: ' + key);
    }

    Systrace.endAsyncEvent(key, cookies[key]);
    delete cookies[key];
  },

  clear() {
    timespans = {};
    extras = {};
  },

  clearCompleted() {
    for (const key in timespans) {
      if (timespans[key].totalTime) {
        delete timespans[key];
      }
    }
    extras = {};
  },

  clearExceptTimespans(keys: Array<string>) {
    timespans = Object.keys(timespans).reduce(function(previous, key) {
      if (keys.indexOf(key) !== -1) {
        previous[key] = timespans[key];
      }
      return previous;
    }, {});
    extras = {};
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
        console.log(key + ': ' + timespans[key].totalTime + 'ms');
      }
    }
  },

  addTimespans(newTimespans: Array<number>, labels: Array<string>) {
    for (let i = 0, l = newTimespans.length; i < l; i += 2) {
      const label = labels[i / 2];
      PerformanceLogger.addTimespan(
        label,
        (newTimespans[i + 1] - newTimespans[i]),
        label
      );
    }
  },

  setExtra(key: string, value: any) {
    if (extras[key]) {
      if (__DEV__) {
        console.log(
          'PerformanceLogger: Attempting to set an extra that already exists ',
          key
        );
      }
      return;
    }
    extras[key] = value;
  },

  getExtras() {
    return extras;
  }
};

BatchedBridge.registerCallableModule(
  'PerformanceLogger',
  PerformanceLogger
);

module.exports = PerformanceLogger;
