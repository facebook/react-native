/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule QuickPerformanceLogger
 */

'use strict';

var fixOpts = function(opts) {
    var AUTO_SET_TIMESTAMP = -1;
    var DUMMY_INSTANCE_KEY = 0;
    opts = opts || {};
    opts.instanceKey = opts.instanceKey || DUMMY_INSTANCE_KEY;
    opts.timestamp = opts.timestamp || AUTO_SET_TIMESTAMP;
    return opts;
};

var QuickPerformanceLogger = {
  markerStart(markerId, opts) {
    if (typeof markerId !== 'number') {
      return;
    }
    if (global.nativeQPLMarkerStart) {
      opts = fixOpts(opts);
      global.nativeQPLMarkerStart(markerId, opts.instanceKey, opts.timestamp);
    }
  },

  markerEnd(markerId, actionId, opts) {
    if (typeof markerId !== 'number' || typeof actionId !== 'number') {
      return;
    }
    if (global.nativeQPLMarkerEnd) {
      opts = fixOpts(opts);
      global.nativeQPLMarkerEnd(markerId, opts.instanceKey, actionId, opts.timestamp);
    }
  },

  markerNote(markerId, actionId, opts) {
    if (typeof markerId !== 'number' || typeof actionId !== 'number') {
      return;
    }
    if (global.nativeQPLMarkerNote) {
      opts = fixOpts(opts);
      global.nativeQPLMarkerNote(markerId, opts.instanceKey, actionId, opts.timestamp);
    }
  },

  markerTag(markerId, tag, opts) {
    if (typeof markerId !== 'number' || typeof tag !== 'string') {
      return;
    }
    if (global.nativeQPLMarkerTag) {
      opts = fixOpts(opts);
      global.nativeQPLMarkerTag(markerId, opts.instanceKey, tag);
    }
  },

  markerAnnotate(markerId, annotationKey, annotationValue, opts) {
    if (typeof markerId !== 'number' ||
        typeof annotationKey !== 'string' ||
        typeof annotationValue !== 'string') {
      return;
    }
    if (global.nativeQPLMarkerAnnotate) {
      opts = fixOpts(opts);
      global.nativeQPLMarkerAnnotate(markerId, opts.instanceKey, annotationKey, annotationValue);
    }
  },

  markerCancel(markerId, opts) {
    if (typeof markerId !== 'number') {
      return;
    }
    if (global.nativeQPLMarkerCancel) {
      opts = fixOpts(opts);
      global.nativeQPLMarkerCancel(markerId, opts.instanceKey);
    }
  },

  currentTimestamp() {
    if (global.nativeQPLTimestamp) {
      return global.nativeQPLTimestamp();
    }
    return 0;
  },

};

module.exports = QuickPerformanceLogger;
