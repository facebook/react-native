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

var RCTNetworking = require('RCTNetworking');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

const EventTarget = require('event-target-shim');
const invariant = require('fbjs/lib/invariant');
const utf8 = require('utf8');
const warning = require('fbjs/lib/warning');

type ResponseType = '' | 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';
type Response = ?Object | string;

const UNSENT = 0;
const OPENED = 1;
const HEADERS_RECEIVED = 2;
const LOADING = 3;
const DONE = 4;

const SUPPORTED_RESPONSE_TYPES = {
  arraybuffer: typeof global.ArrayBuffer === 'function',
  blob: typeof global.Blob === 'function',
  document: false,
  json: true,
  text: true,
  '': true,
};

const REQUEST_EVENTS = [
  'abort',
  'error',
  'load',
  'loadstart',
  'progress',
  'timeout',
  'loadend',
];

const XHR_EVENTS = REQUEST_EVENTS.concat('readystatechange');

class XMLHttpRequestEventTarget extends EventTarget(...REQUEST_EVENTS) {
  onload: ?Function;
  onloadstart: ?Function;
  onprogress: ?Function;
  ontimeout: ?Function;
  onerror: ?Function;
  onloadend: ?Function;
}

/**
 * Shared base for platform-specific XMLHttpRequest implementations.
 */
class XMLHttpRequestBase extends EventTarget(...XHR_EVENTS) {

  static UNSENT: number = UNSENT;
  static OPENED: number = OPENED;
  static HEADERS_RECEIVED: number = HEADERS_RECEIVED;
  static LOADING: number = LOADING;
  static DONE: number = DONE;

  UNSENT: number = UNSENT;
  OPENED: number = OPENED;
  HEADERS_RECEIVED: number = HEADERS_RECEIVED;
  LOADING: number = LOADING;
  DONE: number = DONE;

  // EventTarget automatically initializes these to `null`.
  onload: ?Function;
  onloadstart: ?Function;
  onprogress: ?Function;
  ontimeout: ?Function;
  onerror: ?Function;
  onloadend: ?Function;
  onreadystatechange: ?Function;

  readyState: number = UNSENT;
  responseHeaders: ?Object;
  responseText: string = '';
  status: number = 0;
  timeout: number = 0;
  responseURL: ?string;

  upload: XMLHttpRequestEventTarget = new XMLHttpRequestEventTarget();

  _requestId: ?number;
  _subscriptions: [any];

  _aborted: boolean = false;
  _cachedResponse: Response;
  _hasError: boolean = false;
  _headers: Object;
  _lowerCaseResponseHeaders: Object;
  _method: ?string = null;
  _response: string | ?Object;
  _responseType: ResponseType;
  _sent: boolean;
  _url: ?string = null;
  _timedOut: boolean = false;
  _incrementalEvents: boolean = false;

  constructor() {
    super();
    this._reset();
  }

  _reset(): void {
    this.readyState = this.UNSENT;
    this.responseHeaders = undefined;
    this.responseText = '';
    this.status = 0;
    delete this.responseURL;

    this._requestId = null;

    this._cachedResponse = undefined;
    this._hasError = false;
    this._headers = {};
    this._responseType = '';
    this._sent = false;
    this._lowerCaseResponseHeaders = {};

    this._clearSubscriptions();
    this._timedOut = false;
  }

  // $FlowIssue #10784535
  get responseType(): ResponseType {
    return this._responseType;
  }

  // $FlowIssue #10784535
  set responseType(responseType: ResponseType): void {
    if (this.readyState > HEADERS_RECEIVED) {
      throw new Error(
        "Failed to set the 'responseType' property on 'XMLHttpRequest': The " +
        "response type cannot be set if the object's state is LOADING or DONE"
      );
    }
    if (!SUPPORTED_RESPONSE_TYPES.hasOwnProperty(responseType)) {
      warning(
        `The provided value '${responseType}' is not a valid 'responseType'.`);
      return;
    }

    // redboxes early, e.g. for 'arraybuffer' on ios 7
    invariant(
      SUPPORTED_RESPONSE_TYPES[responseType] || responseType === 'document',
      `The provided value '${responseType}' is unsupported in this environment.`
    );
    this._responseType = responseType;
  }

  // $FlowIssue #10784535
  get response(): Response {
    const {responseType} = this;
    if (responseType === '' || responseType === 'text') {
      return this.readyState < LOADING || this._hasError
        ? ''
        : this.responseText;
    }

    if (this.readyState !== DONE) {
      return null;
    }

    if (this._cachedResponse !== undefined) {
      return this._cachedResponse;
    }

    switch (this.responseType) {
      case 'document':
        this._cachedResponse = null;
        break;

      case 'arraybuffer':
        this._cachedResponse = toArrayBuffer(
          this.responseText, this.getResponseHeader('content-type') || '');
        break;

      case 'blob':
        this._cachedResponse = new global.Blob(
          [this.responseText],
          {type: this.getResponseHeader('content-type') || ''}
        );
        break;

      case 'json':
        try {
          this._cachedResponse = JSON.parse(this.responseText);
        } catch (_) {
          this._cachedResponse = null;
        }
        break;

      default:
        this._cachedResponse = null;
    }

    return this._cachedResponse;
  }

  didCreateRequest(requestId: number): void {
    this._requestId = requestId;
    this._subscriptions.push(RCTDeviceEventEmitter.addListener(
      'didSendNetworkData',
      (args) => this.__didUploadProgress(...args)
    ));
    this._subscriptions.push(RCTDeviceEventEmitter.addListener(
      'didReceiveNetworkResponse',
      (args) => this._didReceiveResponse(...args)
    ));
    this._subscriptions.push(RCTDeviceEventEmitter.addListener(
      'didReceiveNetworkData',
      (args) =>  this._didReceiveData(...args)
    ));
    this._subscriptions.push(RCTDeviceEventEmitter.addListener(
      'didCompleteNetworkResponse',
      (args) => this.__didCompleteResponse(...args)
    ));
  }

  // exposed for testing
  __didUploadProgress(requestId: number, progress: number, total: number): void {
    if (requestId === this._requestId) {
      this.upload.dispatchEvent({
        type: 'progress',
        lengthComputable: true,
        loaded: progress,
        total,
      });
    }
  }

  _didReceiveResponse(requestId: number, status: number, responseHeaders: ?Object, responseURL: ?string): void {
    if (requestId === this._requestId) {
      this.status = status;
      this.setResponseHeaders(responseHeaders);
      this.setReadyState(this.HEADERS_RECEIVED);
      if (responseURL || responseURL === '') {
        this.responseURL = responseURL;
      } else {
        delete this.responseURL;
      }
    }
  }

  _didReceiveData(requestId: number, responseText: string): void {
    if (requestId === this._requestId) {
      if (!this.responseText) {
        this.responseText = responseText;
      } else {
        this.responseText += responseText;
      }
      this._cachedResponse = undefined; // force lazy recomputation
      this.setReadyState(this.LOADING);
    }
  }

  // exposed for testing
  __didCompleteResponse(requestId: number, error: string, timeOutError: boolean): void {
    if (requestId === this._requestId) {
      if (error) {
        this.responseText = error;
        this._hasError = true;
        if (timeOutError) {
          this._timedOut = true;
        }
      }
      this._clearSubscriptions();
      this._requestId = null;
      this.setReadyState(this.DONE);
    }
  }

  _clearSubscriptions(): void {
    (this._subscriptions || []).forEach(sub => {
      sub.remove();
    });
    this._subscriptions = [];
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
    if (!url) {
      throw new Error('Cannot load an empty url');
    }
    this._reset();
    this._method = method.toUpperCase();
    this._url = url;
    this._aborted = false;
    this.setReadyState(this.OPENED);
  }

  sendImpl(
    method: ?string,
    url: ?string,
    headers: Object,
    data: any,
    incrementalEvents: boolean,
    timeout: number
  ): void {
    throw new Error('Subclass must define sendImpl method');
  }

  send(data: any): void {
    if (this.readyState !== this.OPENED) {
      throw new Error('Request has not been opened');
    }
    if (this._sent) {
      throw new Error('Request has already been sent');
    }
    this._sent = true;
    const incrementalEvents = this._incrementalEvents || !!this.onreadystatechange;
    this.sendImpl(
      this._method,
      this._url,
      this._headers,
      data,
      incrementalEvents,
      this.timeout
    );
  }

  abort(): void {
    this._aborted = true;
    if (this._requestId) {
      RCTNetworking.abortRequest(this._requestId);
    }
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
    this.dispatchEvent({type: 'readystatechange'});
    if (newState === this.DONE && !this._aborted) {
      if (this._hasError) {
        if (this._timedOut) {
          this.dispatchEvent({type: 'timeout'});
        } else {
          this.dispatchEvent({type: 'error'});
        }
      } else {
        this.dispatchEvent({type: 'load'});
      }
    }
  }

  /* global EventListener */
  addEventListener(type: string, listener: EventListener): void {
    // If we dont' have a 'readystatechange' event handler, we don't
    // have to send repeated LOADING events with incremental updates
    // to responseText, which will avoid a bunch of native -> JS
    // bridge traffic.
    if (type === 'readystatechange') {
      this._incrementalEvents = true;
    }
    super.addEventListener(type, listener);
  }
}


function toArrayBuffer(text: string, contentType: string): ArrayBuffer {
  const {length} = text;
  if (length === 0) {
    return new ArrayBuffer(0);
  }

  const charsetMatch = contentType.match(/;\s*charset=([^;]*)/i);
  const charset = charsetMatch ? charsetMatch[1].trim() : 'utf-8';

  if (/^utf-?8$/i.test(charset)) {
    return utf8.encode(text);
  } else { //TODO: utf16 / ucs2 / utf32
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = text.charCodeAt(i); // Uint8Array automatically masks with 0xff
    }
    return array.buffer;
  }
}

module.exports = XMLHttpRequestBase;
