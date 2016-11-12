/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RCTRenderingPerf
 * @flow
 */
'use strict';

var ReactDebugTool = require('ReactDebugTool');
var ReactPerf = require('ReactPerf');

var invariant = require('fbjs/lib/invariant');
var performanceNow = require('fbjs/lib/performanceNow');

type perfModule = {
  start: () => void,
  stop: () => void,
}

var perfModules = [];
var enabled = false;
var lastRenderStartTime = 0;
var totalRenderDuration = 0;

var RCTRenderingPerfDevtool = {
  onBeginLifeCycleTimer(debugID, timerType) {
    if (timerType === 'render') {
      lastRenderStartTime = performanceNow();
    }
  },
  onEndLifeCycleTimer(debugID, timerType) {
    if (timerType === 'render') {
      var lastRenderDuration = performanceNow() - lastRenderStartTime;
      totalRenderDuration += lastRenderDuration;
    }
  },
};

var RCTRenderingPerf = {
  // Once perf is enabled, it stays enabled
  toggle: function() {
    console.log('Render perfomance measurements enabled');
    enabled = true;
  },

  start: function() {
    if (!enabled) {
      return;
    }

    ReactPerf.start();
    ReactDebugTool.addDevtool(RCTRenderingPerfDevtool);
    perfModules.forEach((module) => module.start());
  },

  stop: function() {
    if (!enabled) {
      return;
    }

    ReactPerf.stop();
    ReactPerf.printInclusive();
    ReactPerf.printWasted();
    ReactDebugTool.removeDevtool(RCTRenderingPerfDevtool);

    console.log(`Total time spent in render(): ${totalRenderDuration.toFixed(2)} ms`);
    lastRenderStartTime = 0;
    totalRenderDuration = 0;

    perfModules.forEach((module) => module.stop());
  },

  register: function(module: perfModule) {
    invariant(
      typeof module.start === 'function',
      'Perf module should have start() function'
    );
    invariant(
      typeof module.stop === 'function',
      'Perf module should have stop() function'
    );
    perfModules.push(module);
  }
};

module.exports = RCTRenderingPerf;
