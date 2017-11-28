/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MissingNativeEventEmitterShim
 * @flow
 */
'use strict';

const EmitterSubscription = require('EmitterSubscription');
const EventEmitter = require('EventEmitter');

const invariant = require('fbjs/lib/invariant');

class MissingNativeEventEmitterShim extends EventEmitter {
  isAvailable: boolean = false;
  _nativeModuleName: string;
  _nativeEventEmitterName: string;

  constructor(nativeModuleName: string, nativeEventEmitterName: string) {
    super(null);
    this._nativeModuleName = nativeModuleName;
    this._nativeEventEmitterName = nativeEventEmitterName;
  }

  throwMissingNativeModule() {
    invariant(
      false,
      `Cannot use '${this._nativeEventEmitterName}' module when ` +
      `native '${this._nativeModuleName}' is not included in the build. ` +
      `Either include it, or check '${this._nativeEventEmitterName}'.isAvailable ` +
      'before calling any methods.'
    );
  }

  // EventEmitter
  addListener(eventType: string, listener: Function, context: ?Object) {
    this.throwMissingNativeModule();
  }

  removeAllListeners(eventType: string) {
    this.throwMissingNativeModule();
  }

  removeSubscription(subscription: EmitterSubscription) {
    this.throwMissingNativeModule();
  }
}

module.exports = MissingNativeEventEmitterShim;
