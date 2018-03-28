/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactPerfStallHandler
 * @flow
 */
'use strict';

const JSEventLoopWatchdog = require('JSEventLoopWatchdog');
const ReactPerf = require('ReactPerf');

const ReactPerfStallHandler = {
  register: function() {
    ReactPerf.start();
    JSEventLoopWatchdog.addHandler({
      onStall: () => {
        ReactPerf.stop();
        ReactPerf.printInclusive();
        ReactPerf.printWasted();
        ReactPerf.start();
      },
      onIterate: () => {
        ReactPerf.stop();
        ReactPerf.start();
      },
    });
  },
};

module.exports = ReactPerfStallHandler;
