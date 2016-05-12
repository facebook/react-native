/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NativeEventEmitter
 * @flow
 */
'use strict';

const Platform = require('Platform');
const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
const invariant = require('fbjs/lib/invariant');

import type EmitterSubscription from 'EmitterSubscription';

/**
 * Abstract base class for implementing event-emitting modules. This implements
 * a subset of the standard EventEmitter node module API.
 */
class NativeEventEmitter {

  _nativeModule: Object;

  constructor(nativeModule: Object) {
    if (Platform.OS === 'ios') {
      invariant(nativeModule, 'Native module cannot be null.');
      this._nativeModule = nativeModule;
    }
  }

  addListener(eventType: string, listener: any, context: ?Object): EmitterSubscription {
    if (Platform.OS === 'ios') {
      this._nativeModule.addListener(eventType);
    }
    return RCTDeviceEventEmitter.nativeAddListener(eventType, listener, context);
  }

  once(eventType: string, listener: any, context: ?Object): EmitterSubscription {
    return this.addListener(eventType, () => {
      this.removeCurrentListener();
      listener.apply(context, arguments);
    });
  }

  removeAllListeners(eventType: string) {
    invariant(eventType, 'eventType argument is required.');
    if (Platform.OS === 'ios') {
      const count = RCTDeviceEventEmitter.listeners(eventType).length;
      this._nativeModule.removeListeners(count);
    }
    RCTDeviceEventEmitter.removeAllListeners(eventType);
  }

  removeCurrentListener() {
    if (Platform.OS === 'ios') {
      this._nativeModule.removeListeners(1);
    }
    RCTDeviceEventEmitter.removeCurrentListener();
  }
}

module.exports = NativeEventEmitter;
