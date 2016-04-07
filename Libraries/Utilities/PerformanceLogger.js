/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PerformanceLogger
 */
'use strict';

const BatchedBridge = require('BatchedBridge');
const fbjsPerformanceNow = require('fbjs/lib/performanceNow');

const performanceNow = global.nativePerformanceNow || fbjsPerformanceNow;

var timespans = {};
var extras = {};

/**
 * This is meant to collect and log performance data in production, which means
 * it needs to have minimal overhead.
 */
var PerformanceLogger = {
  addTimespan(key, lengthInMs, description) {
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

  startTimespan(key, description) {
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
  },

  stopTimespan(key) {
    if (!timespans[key] || !timespans[key].startTime) {
      if (__DEV__) {
        console.log(
          'PerformanceLogger: Attempting to end a timespan that has not started ',
          key,
        );
      }
      return;
    }
    if (timespans[key].endTime) {
      if (__DEV__) {
        console.log(
          'PerformanceLogger: Attempting to end a timespan that has already ended ',
          key
        );
      }
      return;
    }

    timespans[key].endTime = performanceNow();
    timespans[key].totalTime =
      timespans[key].endTime - timespans[key].startTime;
  },

  clear() {
    timespans = {};
    extras = {};
  },

  clearExceptTimespans(keys) {
    timespans = Object.keys(timespans).reduce(function(previous, key) {
      if (keys.indexOf(key) !== -1) {
        previous[key] = timespans[key];
      }
      return previous;
    }, {});
    extras = {};
  },

  getTimespans() {
    return timespans;
  },

  hasTimespan(key) {
    return !!timespans[key];
  },

  logTimespans() {
    for (var key in timespans) {
      if (timespans[key].totalTime) {
        console.log(key + ': ' + timespans[key].totalTime + 'ms');
      }
    }
  },

  addTimespans(newTimespans, labels) {
    for (var i = 0, l = newTimespans.length; i < l; i += 2) {
      var label = labels[i / 2];
      PerformanceLogger.addTimespan(
        label,
        (newTimespans[i + 1] - newTimespans[i]),
        label
      );
    }
  },

  setExtra(key, value) {
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
