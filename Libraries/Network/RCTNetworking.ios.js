/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RCTNetworking
 * @flow
 */
'use strict';

const MissingNativeEventEmitterShim = require('MissingNativeEventEmitterShim');
const NativeEventEmitter = require('NativeEventEmitter');
const RCTNetworkingNative = require('NativeModules').Networking;
const convertRequestBody = require('convertRequestBody');

import type {RequestBody} from 'convertRequestBody';

class RCTNetworking extends NativeEventEmitter {

  isAvailable: boolean = true;

  constructor() {
    super(RCTNetworkingNative);
  }

  sendRequest(
    method: string,
    trackingName: string,
    url: string,
    headers: Object,
    data: RequestBody,
    responseType: 'text' | 'base64',
    incrementalUpdates: boolean,
    timeout: number,
    callback: (requestId: number) => any,
    withCredentials: boolean
  ) {
    const body = convertRequestBody(data);
    RCTNetworkingNative.sendRequest({
      method,
      url,
      data: {...body, trackingName},
      headers,
      responseType,
      incrementalUpdates,
      timeout,
      withCredentials
    }, callback);
  }

  abortRequest(requestId: number) {
    RCTNetworkingNative.abortRequest(requestId);
  }

  clearCookies(callback: (result: boolean) => any) {
    RCTNetworkingNative.clearCookies(callback);
  }
}

if (__DEV__ && !RCTNetworkingNative) {
  class MissingNativeRCTNetworkingShim extends MissingNativeEventEmitterShim {
    constructor() {
      super('RCTAppState', 'AppState');
    }

    sendRequest(...args: Array<any>) {
      this.throwMissingNativeModule();
    }

    abortRequest(...args: Array<any>) {
      this.throwMissingNativeModule();
    }

    clearCookies(...args: Array<any>) {
      this.throwMissingNativeModule();
    }
  }

  // This module depends on the native `RCTNetworkingNative` module. If you don't include it,
  // `RCTNetworking.isAvailable` will return `false`, and any method calls will throw.
  // We reassign the class variable to keep the autodoc generator happy.
  RCTNetworking = new MissingNativeRCTNetworkingShim();
} else {
  RCTNetworking = new RCTNetworking();
}

module.exports = RCTNetworking;
