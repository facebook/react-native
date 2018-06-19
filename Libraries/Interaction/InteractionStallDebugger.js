/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const BridgeSpyStallHandler = require('BridgeSpyStallHandler');
const JSEventLoopWatchdog = require('JSEventLoopWatchdog');

const InteractionStallDebugger = {
  install(options: {thresholdMS: number}): void {
    JSEventLoopWatchdog.install(options);
    BridgeSpyStallHandler.register();
  },
};

module.exports = InteractionStallDebugger;
