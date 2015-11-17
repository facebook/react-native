/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule XMLHttpRequest
 * @flow
 */
'use strict';

var FormData = require('FormData');
var RCTNetworking = require('RCTNetworking');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

var XMLHttpRequestBase = require('XMLHttpRequestBase');

class XMLHttpRequest extends XMLHttpRequestBase {
  constructor() {
    super();
    // iOS supports upload
    this.upload = {};
  }

  sendImpl(method: ?string, url: ?string, headers: Object, data: any): void {
    if (typeof data === 'string') {
      data = {string: data};
    } else if (data instanceof FormData) {
      data = {formData: data.getParts()};
    }
    RCTNetworking.sendRequest(
      {
        method,
        url,
        data,
        headers,
        incrementalUpdates: this.onreadystatechange ? true : false,
      },
      this.didCreateRequest.bind(this)
    );
  }
}

module.exports = XMLHttpRequest;
