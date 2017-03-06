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

const FormData = require('FormData');
const NativeEventEmitter = require('NativeEventEmitter');
const RCTNetworkingNative = require('NativeModules').Networking;
const convertRequestBody = require('convertRequestBody');

import type {RequestBody} from 'convertRequestBody';

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
    RCTNetworkingNative.sendRequest({
      method,
      url,
      data: {...body, trackingName},
      headers,
      responseType,
      incrementalUpdates,
      timeout
    }, callback);
  }

  abortRequest(requestId: number) {
    RCTNetworkingNative.abortRequest(requestId);
  }

  clearCookies(callback: (result: boolean) => any) {
    RCTNetworkingNative.clearCookies(callback);
  }
}

module.exports = new RCTNetworking();
