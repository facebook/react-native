/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RCTDeviceEventEmitter
 * @flow
 */
'use strict';

const EventEmitter = require('EventEmitter');
const BatchedBridge = require('BatchedBridge');

import type EmitterSubscription from 'EmitterSubscription';

/**
 * Deprecated - subclass NativeEventEmitter to create granular event modules instead of
 * adding all event listeners directly to RCTDeviceEventEmitter.
 */
class RCTDeviceEventEmitter extends EventEmitter {

  addListener(eventType: string, listener: any, context: ?Object): EmitterSubscription {
    if (eventType.lastIndexOf('statusBar', 0) === 0) {
      console.warn('`%s` event should be registered via the StatusBarIOS module', eventType);
      return require('StatusBarIOS').addListener(eventType, listener, context);
    }
    if (eventType.lastIndexOf('keyboard', 0) === 0) {
      console.warn('`%s` event should be registered via the Keyboard module', eventType);
      return require('Keyboard').addListener(eventType, listener, context);
    }
    return super.addListener(eventType, listener, context);
  }

  nativeAddListener(eventType: string, listener: any, context: ?Object): EmitterSubscription {
    return super.addListener(eventType, listener, context);
  }
}

RCTDeviceEventEmitter = new RCTDeviceEventEmitter();

BatchedBridge.registerCallableModule(
  'RCTDeviceEventEmitter',
  RCTDeviceEventEmitter
);

module.exports = RCTDeviceEventEmitter;
