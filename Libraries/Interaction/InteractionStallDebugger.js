/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
