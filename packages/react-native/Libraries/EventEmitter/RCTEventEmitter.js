/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const BatchedBridge = require('../BatchedBridge/BatchedBridge');

const RCTEventEmitter = {
  register(eventEmitter: any) {
    if (global.RN$Bridgeless) {
      global.RN$registerCallableModule('RCTEventEmitter', () => eventEmitter);
    } else {
      BatchedBridge.registerCallableModule('RCTEventEmitter', eventEmitter);
    }
  },
};

module.exports = RCTEventEmitter;
