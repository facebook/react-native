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

var RCTNetworkingNative = require('NativeModules').Networking;

/**
 * This class is a wrapper around the native RCTNetworking module.
 */
class RCTNetworking {

  static sendRequest(query, callback) {
    RCTNetworkingNative.sendRequest(query, callback);
  }

  static abortRequest(requestId) {
    RCTNetworkingNative.cancelRequest(requestId);
  }

}

module.exports = RCTNetworking;
