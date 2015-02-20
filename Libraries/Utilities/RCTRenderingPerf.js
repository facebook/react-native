/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule RCTRenderingPerf
 */
'use strict';

var ReactDefaultPerf = require('ReactDefaultPerf');
var ReactPerf = require('ReactPerf');

var invariant = require('invariant');

var perfModules = [];
var enabled = false;

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

    ReactDefaultPerf.start();
    perfModules.forEach((module) => module.start());
  },

  stop: function() {
    if (!enabled) {
      return;
    }

    ReactDefaultPerf.stop();
    ReactDefaultPerf.printInclusive();
    ReactDefaultPerf.printWasted();
    perfModules.forEach((module) => module.stop());
  },

  register: function(module) {
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
