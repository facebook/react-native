/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule XMLHttpRequestBase
 * @flow
 */
'use strict';

/**
 * Shared base for platform-specific XMLHttpRequest implementations.
 */
class XMLHttpRequestBase {

  UNSENT: number;
  OPENED: number;
  HEADERS_RECEIVED: number;
  LOADING: number;
  DONE: number;

  onreadystatechange: ?Function;
  onload: ?Function;
  upload: any;
  readyState: number;
  responseHeaders: ?Object;
  responseText: ?string;
  status: number;

  _method: ?string;
  _url: ?string;
  _headers: Object;
  _sent: boolean;
  _aborted: boolean;
  _lowerCaseResponseHeaders: Object;

  constructor() {
    this.UNSENT = 0;
    this.OPENED = 1;
    this.HEADERS_RECEIVED = 2;
    this.LOADING = 3;
    this.DONE = 4;

    this.onreadystatechange = null;
    this.onload = null;
    this.upload = undefined; /* Upload not supported yet */

    this._reset();
    this._method = null;
    this._url = null;
    this._aborted = false;
  }

  _reset() {
    this.readyState = this.UNSENT;
    this.responseHeaders = undefined;
    this.responseText = '';
    this.status = 0;

    this._headers = {};
    this._sent = false;
    this._lowerCaseResponseHeaders = {};
  }

  getAllResponseHeaders(): ?string {
    if (!this.responseHeaders) {
      // according to the spec, return null if no response has been received
      return null;
    }
    var headers = this.responseHeaders || {};
    return Object.keys(headers).map((headerName) => {
      return headerName + ': ' + headers[headerName];
    }).join('\n');
  }

  getResponseHeader(header: string): ?string {
    var value = this._lowerCaseResponseHeaders[header.toLowerCase()];
    return value !== undefined ? value : null;
  }

  setRequestHeader(header: string, value: any): void {
    if (this.readyState !== this.OPENED) {
      throw new Error('Request has not been opened');
    }
    this._headers[header.toLowerCase()] = value;
  }

  open(method: string, url: string, async: ?boolean): void {
    /* Other optional arguments are not supported yet */
    if (this.readyState !== this.UNSENT) {
      throw new Error('Cannot open, already sending');
    }
    if (async !== undefined && !async) {
      // async is default
      throw new Error('Synchronous http requests are not supported');
    }
    this._reset();
    this._method = method;
    this._url = url;
    this._aborted = false;
    this.setReadyState(this.OPENED);
  }

  sendImpl(method: ?string, url: ?string, headers: Object, data: any): void {
    throw new Error('Subclass must define sendImpl method');
  }

  abortImpl(): void {
    throw new Error('Subclass must define abortImpl method');
  }

  send(data: any): void {
    if (this.readyState !== this.OPENED) {
      throw new Error('Request has not been opened');
    }
    if (this._sent) {
      throw new Error('Request has already been sent');
    }
    this._sent = true;
    this.sendImpl(this._method, this._url, this._headers, data);
  }

  abort(): void {
    this._aborted = true;
    this.abortImpl();
    // only call onreadystatechange if there is something to abort,
    // below logic is per spec
    if (!(this.readyState === this.UNSENT ||
        (this.readyState === this.OPENED && !this._sent) ||
        this.readyState === this.DONE)) {
      this._reset();
      this.setReadyState(this.DONE);
    }
    // Reset again after, in case modified in handler
    this._reset();
  }

  callback(status: number, responseHeaders: ?Object, responseText: string): void {
    if (this._aborted) {
      return;
    }
    this.status = status;
    this.setResponseHeaders(responseHeaders || {});
    this.responseText = responseText;
    this.setReadyState(this.DONE);
  }

  setResponseHeaders(responseHeaders: ?Object): void {
    this.responseHeaders = responseHeaders || null;
    var headers = responseHeaders || {};
    this._lowerCaseResponseHeaders =
      Object.keys(headers).reduce((lcaseHeaders, headerName) => {
        lcaseHeaders[headerName.toLowerCase()] = headers[headerName];
        return lcaseHeaders;
      }, {});
  }

  setReadyState(newState: number): void {
    this.readyState = newState;
    // TODO: workaround flow bug with nullable function checks
    var onreadystatechange = this.onreadystatechange;
    if (onreadystatechange) {
      // We should send an event to handler, but since we don't process that
      // event anywhere, let's leave it empty
      onreadystatechange(null);
    }
    if (newState === this.DONE && !this._aborted) {
      this._sendLoad();
    }
  }

  _sendLoad(): void {
    // TODO: workaround flow bug with nullable function checks
    var onload = this.onload;
    if (onload) {
      // We should send an event to handler, but since we don't process that
      // event anywhere, let's leave it empty
      onload(null);
    }
  }
}

module.exports = XMLHttpRequestBase;
