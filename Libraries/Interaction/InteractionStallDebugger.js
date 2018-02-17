/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule InteractionStallDebugger
 * @flow
 */
'use strict';

const BridgeSpyStallHandler = require('BridgeSpyStallHandler');
const JSEventLoopWatchdog = require('JSEventLoopWatchdog');
const ReactPerfStallHandler = require('ReactPerfStallHandler');

const InteractionStallDebugger = {
  install: function(options: {thresholdMS: number}) {
    JSEventLoopWatchdog.install(options);
    BridgeSpyStallHandler.register();
    if (__DEV__) {
      ReactPerfStallHandler.register();
    }
  },
};

module.exports = InteractionStallDebugger;
