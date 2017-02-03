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

// Do not require the native RCTNetworking module directly! Use this wrapper module instead.
// It will add the necessary requestId, so that you don't have to generate it yourself.
const FormData = require('FormData');
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
    callback: (requestId: number) => any
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
      timeout
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

module.exports = new RCTNetworking();
