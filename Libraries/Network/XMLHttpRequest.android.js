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
var XMLHttpRequestBase = require('XMLHttpRequestBase');

type Header = [string, string];

function convertHeadersMapToArray(headers: Object): Array<Header> {
  var headerArray = [];
  for (var name in headers) {
    headerArray.push([name, headers[name]]);
  }
  return headerArray;
}

class XMLHttpRequest extends XMLHttpRequestBase {

  _requestId: ?number;

  constructor() {
    super();
    this._requestId = null;
  }

  sendImpl(method: ?string, url: ?string, headers: Object, data: any): void {
    var body;
    if (typeof data === 'string') {
      body = {string: data};
    } else if (data instanceof FormData) {
      body = {
        formData: data.getParts().map((part) => {
          part.headers = convertHeadersMapToArray(part.headers);
          return part;
        }),
      };
    } else {
      body = data;
    }

    this._requestId = RCTNetworking.sendRequest(
      method,
      url,
      convertHeadersMapToArray(headers),
      body,
      this.callback.bind(this)
    );
  }

  abortImpl(): void {
    this._requestId && RCTNetworking.abortRequest(this._requestId);
  }
}

module.exports = XMLHttpRequest;
