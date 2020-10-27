/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import NativeEventEmitter from '../EventEmitter/NativeEventEmitter';
import NativeNetworkingIOS from './NativeNetworkingIOS';
import type {NativeResponseType} from './XMLHttpRequest';
import convertRequestBody from './convertRequestBody';
import type {RequestBody} from './convertRequestBody';

class RCTNetworking extends NativeEventEmitter {
  constructor() {
    const disableCallsIntoModule =
      typeof global.__disableRCTNetworkingExtraneousModuleCalls === 'function'
        ? global.__disableRCTNetworkingExtraneousModuleCalls()
        : false;

    super(NativeNetworkingIOS, {
      __SECRET_DISABLE_CALLS_INTO_MODULE_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: disableCallsIntoModule,
    });
  }

  sendRequest(
    method: string,
    trackingName: string,
    url: string,
    headers: {...},
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
