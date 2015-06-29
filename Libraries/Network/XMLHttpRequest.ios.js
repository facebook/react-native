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
var RCTNetworking = require('NativeModules').Networking;
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

var XMLHttpRequestBase = require('XMLHttpRequestBase');

class XMLHttpRequest extends XMLHttpRequestBase {

  _requestId: ?number;
  _subscriptions: [any];

  constructor() {
    super();
    this._requestId = null;
    this._subscriptions = [];
  }

  _didCreateRequest(requestId: number): void {
    this._requestId = requestId;
    this._subscriptions.push(RCTDeviceEventEmitter.addListener(
      'didReceiveNetworkResponse',
      (args) => this._didReceiveResponse.call(this, args[0], args[1], args[2])
    ));
    this._subscriptions.push(RCTDeviceEventEmitter.addListener(
      'didReceiveNetworkData',
      (args) =>  this._didReceiveData.call(this, args[0], args[1])
    ));
    this._subscriptions.push(RCTDeviceEventEmitter.addListener(
      'didCompleteNetworkResponse',
      (args) => this._didCompleteResponse.call(this, args[0], args[1])
    ));
  }

  _didReceiveResponse(requestId: number, status: number, responseHeaders: ?Object): void {
    if (requestId === this._requestId) {
      this.status = status;
      this.setResponseHeaders(responseHeaders);
      this.setReadyState(this.HEADERS_RECEIVED);
    }
  }

  _didReceiveData(requestId: number, responseText: string): void {
    if (requestId === this._requestId) {
      if (!this.responseText) {
        this.responseText = responseText;
      } else {
        this.responseText += responseText;
      }
      this.setReadyState(this.LOADING);
    }
  }

  _didCompleteResponse(requestId: number, error: string): void {
    if (requestId === this._requestId) {
      if (error) {
        this.responseText = error;
      }
      this._clearSubscriptions();
      this._requestId = null;
      this.setReadyState(this.DONE);
    }
  }

  _clearSubscriptions(): void {
    for (var i = 0; i < this._subscriptions.length; i++) {
      var sub = this._subscriptions[i];
      sub.remove();
    }
    this._subscriptions = [];
  }

  sendImpl(method: ?string, url: ?string, headers: Object, data: any): void {
    if (typeof data === 'string') {
      data = {string: data};
    }
    if (data instanceof FormData) {
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
      this._didCreateRequest.bind(this)
    );
  }

  abortImpl(): void {
    if (this._requestId) {
      RCTNetworking.cancelRequest(this._requestId);
      this._clearSubscriptions();
      this._requestId = null;
    }
  }
}

module.exports = XMLHttpRequest;
