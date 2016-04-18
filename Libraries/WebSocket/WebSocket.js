/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule WebSocket
 * @flow
 */
'use strict';

const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
const RCTWebSocketModule = require('NativeModules').WebSocketModule;
const Platform = require('Platform');
const WebSocketEvent = require('WebSocketEvent');

const EventTarget = require('event-target-shim');
const base64 = require('base64-js');

import type EventSubscription from 'EventSubscription';

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

const CLOSE_NORMAL = 1000;

const WEBSOCKET_EVENTS = [
  'close',
  'error',
  'message',
  'open',
];

let nextWebSocketId = 0;

/**
 * Browser-compatible WebSockets implementation.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
 * See https://github.com/websockets/ws
 */
class WebSocket extends EventTarget(WEBSOCKET_EVENTS) {
  static CONNECTING = CONNECTING;
  static OPEN = OPEN;
  static CLOSING = CLOSING;
  static CLOSED = CLOSED;

  CONNECTING: number = CONNECTING;
  OPEN: number = OPEN;
  CLOSING: number = CLOSING;
  CLOSED: number = CLOSED;

  _socketId: number;
  _subscriptions: Array<EventSubscription>;

  onclose: ?Function;
  onerror: ?Function;
  onmessage: ?Function;
  onopen: ?Function;

  binaryType: ?string;
  bufferedAmount: number;
  extension: ?string;
  protocol: ?string;
  readyState: number = CONNECTING;
  url: ?string;

  constructor(url: string, protocols: ?string | ?Array<string>, options: ?{origin?: string}) {
    super();
    if (typeof protocols === 'string') {
      protocols = [protocols];
    }

    if (!Array.isArray(protocols)) {
      protocols = null;
    }

    this._socketId = nextWebSocketId++;
    RCTWebSocketModule.connect(url, protocols, options, this._socketId);
    this._registerEvents();
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === this.CLOSING ||
        this.readyState === this.CLOSED) {
      return;
    }

    this.readyState = this.CLOSING;
    this._close(code, reason);
  }

  send(data: any): void {
    if (this.readyState === this.CONNECTING) {
      throw new Error('INVALID_STATE_ERR');
    }

    if (typeof data === 'string') {
      RCTWebSocketModule.send(data, this._socketId);
    } else if (data instanceof ArrayBuffer) {
      console.warn('Sending ArrayBuffers is not yet supported');
    } else {
      throw new Error('Not supported data type');
    }
  }

  _close(code?: number, reason?: string): void {
    if (Platform.OS === 'android') {
      // See https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
      var statusCode = typeof code === 'number' ? code : CLOSE_NORMAL;
      var closeReason = typeof reason === 'string' ? reason : '';
      RCTWebSocketModule.close(statusCode, closeReason, this._socketId);
    } else {
      RCTWebSocketModule.close(this._socketId);
    }
  }

  _unregisterEvents(): void {
    this._subscriptions.forEach(e => e.remove());
    this._subscriptions = [];
  }

  _registerEvents(): void {
    this._subscriptions = [
      RCTDeviceEventEmitter.addListener('websocketMessage', ev => {
        if (ev.id !== this._socketId) {
          return;
        }
        var event = new WebSocketEvent('message', {
          data: (ev.type === 'binary') ? base64.toByteArray(ev.data).buffer : ev.data
        });
        this.dispatchEvent(event);
      }),
      RCTDeviceEventEmitter.addListener('websocketOpen', ev => {
        if (ev.id !== this._socketId) {
          return;
        }
        this.readyState = this.OPEN;
        var event = new WebSocketEvent('open');
        this.dispatchEvent(event);
      }),
      RCTDeviceEventEmitter.addListener('websocketClosed', ev => {
        if (ev.id !== this._socketId) {
          return;
        }
        this.readyState = this.CLOSED;
        var event = new WebSocketEvent('close');
        event.code = ev.code;
        event.reason = ev.reason;
        this.dispatchEvent(event);
        this._unregisterEvents();
        this.close();
      }),
      RCTDeviceEventEmitter.addListener('websocketFailed', ev => {
        if (ev.id !== this._socketId) {
          return;
        }
        var event = new WebSocketEvent('error');
        event.message = ev.message;
        this.dispatchEvent(event);

        event = new WebSocketEvent('close');
        event.message = ev.message;
        this.dispatchEvent(event);

        this._unregisterEvents();
        this.close();
      })
    ];
  }
}

module.exports = WebSocket;
