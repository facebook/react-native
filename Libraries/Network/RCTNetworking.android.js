/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule RCTNetworking
 * @flow
 */
'use strict';

// Do not require the native RCTNetworking module directly! Use this wrapper module instead.
// It will add the necessary requestId, so that you don't have to generate it yourself.
const MissingNativeEventEmitterShim = require('MissingNativeEventEmitterShim');
const NativeEventEmitter = require('NativeEventEmitter');
const RCTNetworkingNative = require('NativeModules').Networking;
const convertRequestBody = require('convertRequestBody');

import type {RequestBody} from 'convertRequestBody';

type Header = [string, string];

// Convert FormData headers to arrays, which are easier to consume in
// native on Android.
function convertHeadersMapToArray(headers: Object): Array<Header> {
  const headerArray = [];
  for (const name in headers) {
    headerArray.push([name, headers[name]]);
  }
  return headerArray;
}

let _requestId = 1;
function generateRequestId(): number {
  return _requestId++;
}

/**
 * This class is a wrapper around the native RCTNetworking module. It adds a necessary unique
 * requestId to each network request that can be used to abort that request later on.
 */
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
    if (body && body.formData) {
      body.formData = body.formData.map((part) => ({
        ...part,
        headers: convertHeadersMapToArray(part.headers),
      }));
    }
    const requestId = generateRequestId();
    RCTNetworkingNative.sendRequest(
      method,
      url,
      requestId,
      convertHeadersMapToArray(headers),
      {...body, trackingName},
      responseType,
      incrementalUpdates,
      timeout,
      withCredentials
    );
    callback(requestId);
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
      super('RCTNetworking', 'Networking');
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
