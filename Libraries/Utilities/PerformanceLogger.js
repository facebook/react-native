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


var performanceNow = require('performanceNow');

var timespans = {};

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

    timespans[key].endTime = performanceNow();
    timespans[key].totalTime =
      timespans[key].endTime - timespans[key].startTime;
  },

  clearTimespans() {
    timespans = {};
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
  }
};

module.exports = PerformanceLogger;
