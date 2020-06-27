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

// Do not require the native RCTNetworking module directly! Use this wrapper module instead.
// It will add the necessary requestId, so that you don't have to generate it yourself.
import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import NativeNetworkingAndroid from './NativeNetworkingAndroid';
import convertRequestBody from './convertRequestBody';
import type {RequestBody} from './convertRequestBody';

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
    super(NativeNetworkingAndroid);
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
    callback: (requestId: number) => mixed,
    withCredentials: boolean,
  ) {
    const body = convertRequestBody(data);
    if (body && body.formData) {
      body.formData = body.formData.map(part => ({
        ...part,
        headers: convertHeadersMapToArray(part.headers),
      }));
    }
    const requestId = generateRequestId();
    NativeNetworkingAndroid.sendRequest(
      method,
      url,
      requestId,
      convertHeadersMapToArray(headers),
      {...body, trackingName},
      responseType,
      incrementalUpdates,
      timeout,
      withCredentials,
    );
    callback(requestId);
  }

  abortRequest(requestId: number) {
    NativeNetworkingAndroid.abortRequest(requestId);
  }

  clearCookies(callback: (result: boolean) => any) {
    NativeNetworkingAndroid.clearCookies(callback);
  }
}

module.exports = (new RCTNetworking(): RCTNetworking);
