/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule WebSocketBase
 * @flow
 */
'use strict';

var EventTarget = require('event-target-shim');

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

/**
 * Shared base for platform-specific WebSocket implementations.
 */
class WebSocketBase extends EventTarget {
  CONNECTING: number;
  OPEN: number;
  CLOSING: number;
  CLOSED: number;

  onclose: ?Function;
  onerror: ?Function;
  onmessage: ?Function;
  onopen: ?Function;

  binaryType: ?string;
  bufferedAmount: number;
  extension: ?string;
  protocol: ?string;
  readyState: number;
  url: ?string;

  constructor(url: string, protocols: ?string | ?Array<string>, options: ?{origin?: string}) {
    super();
    this.CONNECTING = CONNECTING;
    this.OPEN = OPEN;
    this.CLOSING = CLOSING;
    this.CLOSED = CLOSED;

    if (typeof protocols === 'string') {
      protocols = [protocols];
    }

    if (!Array.isArray(protocols)) {
      protocols = null;
    }

    this.readyState = this.CONNECTING;
    this.connectToSocketImpl(url, protocols, options);
  }

  close(): void {
    if (this.readyState === this.CLOSING ||
        this.readyState === this.CLOSED) {
      return;
    }

    if (this.readyState === this.CONNECTING) {
      this.cancelConnectionImpl();
    }

    this.readyState = this.CLOSING;
    this.closeConnectionImpl();
  }

  send(data: any): void {
    if (this.readyState === this.CONNECTING) {
      throw new Error('INVALID_STATE_ERR');
    }

    if (typeof data === 'string') {
      this.sendStringImpl(data);
    } else if (data instanceof ArrayBuffer) {
      this.sendArrayBufferImpl(data);
    } else {
      throw new Error('Not supported data type');
    }
  }

  closeConnectionImpl(): void {
    throw new Error('Subclass must define closeConnectionImpl method');
  }

  connectToSocketImpl(url: string, protocols: ?Array<string>, options: ?{origin?: string}): void {
    throw new Error('Subclass must define connectToSocketImpl method');
  }

  cancelConnectionImpl(): void {
    throw new Error('Subclass must define cancelConnectionImpl method');
  }

  sendStringImpl(message: string): void {
    throw new Error('Subclass must define sendStringImpl method');
  }

  sendArrayBufferImpl(): void {
    throw new Error('Subclass must define sendArrayBufferImpl method');
  }
}

WebSocketBase.CONNECTING = CONNECTING;
WebSocketBase.OPEN = OPEN;
WebSocketBase.CLOSING = CLOSING;
WebSocketBase.CLOSED = CLOSED;

module.exports = WebSocketBase;
