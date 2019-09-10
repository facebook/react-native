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

const NativeEventEmitter = require('../EventEmitter/NativeEventEmitter');

const convertRequestBody = require('./convertRequestBody');

import NativeNetworkingIOS from './NativeNetworkingIOS';
import type {NativeResponseType} from './XMLHttpRequest';
import type {RequestBody} from './convertRequestBody';

class RCTNetworking extends NativeEventEmitter {
  constructor() {
    super(NativeNetworkingIOS);
  }

  sendRequest(
    method: string,
    trackingName: string,
    url: string,
    headers: Object,
    data: RequestBody,
    responseType: NativeResponseType,
    incrementalUpdates: boolean,
    timeout: number,
    callback: (requestId: number) => void,
    withCredentials: boolean,
  ) {
    const body = convertRequestBody(data);
    NativeNetworkingIOS.sendRequest(
      {
        method,
        url,
        data: {...body, trackingName},
        headers,
        responseType,
        incrementalUpdates,
        timeout,
        withCredentials,
      },
      callback,
    );
  }

  abortRequest(requestId: number) {
    NativeNetworkingIOS.abortRequest(requestId);
  }

  clearCookies(callback: (result: boolean) => void) {
    NativeNetworkingIOS.clearCookies(callback);
  }
}

module.exports = (new RCTNetworking(): RCTNetworking);
