/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule RCTEventEmitter
 * @flow
 */
'use strict';

const BatchedBridge = require('BatchedBridge');

const RCTEventEmitter = {
  register(eventEmitter: any) {
    BatchedBridge.registerCallableModule(
      'RCTEventEmitter',
      eventEmitter
    );
  }
};

module.exports = RCTEventEmitter;
