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

var RCTRenderingPerf = {
  toggle: function() {
    if (ReactPerf.enableMeasure) {
      ReactDefaultPerf.stop();
      ReactDefaultPerf.printInclusive();
      ReactDefaultPerf.printWasted();
      perfModules.forEach((module) => module.stop());
    } else {
      ReactDefaultPerf.start();
      console.log('Render perfomance measurements started');
      perfModules.forEach((module) => module.start());
    }
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
