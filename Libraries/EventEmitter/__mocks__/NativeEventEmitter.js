/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const EventEmitter = require('../../vendor/emitter/EventEmitter');
const RCTDeviceEventEmitter = require('../RCTDeviceEventEmitter');

/**
 * Mock the NativeEventEmitter as a normal JS EventEmitter.
 */
class NativeEventEmitter extends EventEmitter {
  constructor() {
    super(RCTDeviceEventEmitter.sharedSubscriber);
  }
}

module.exports = NativeEventEmitter;
