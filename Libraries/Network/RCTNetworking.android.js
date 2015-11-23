/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule RCTNetworking
 */
'use strict';

// Do not require the native RCTNetworking module directly! Use this wrapper module instead.
// It will add the necessary requestId, so that you don't have to generate it yourself.
var RCTNetworkingNative = require('NativeModules').Networking;

var _requestId = 1;
var generateRequestId = function() {
  return _requestId++;
};

/**
 * This class is a wrapper around the native RCTNetworking module. It adds a necessary unique
 * requestId to each network request that can be used to abort that request later on.
 */
class RCTNetworking {

  static sendRequest(method, url, headers, data, callback) {
    var requestId = generateRequestId();
    RCTNetworkingNative.sendRequest(
      method,
      url,
      requestId,
      headers,
      data,
      callback);
    return requestId;
  }

  static abortRequest(requestId) {
    RCTNetworkingNative.abortRequest(requestId);
  }

  static clearCookies(callback) {
    RCTNetworkingNative.clearCookies(callback);
  }
}

module.exports = RCTNetworking;
