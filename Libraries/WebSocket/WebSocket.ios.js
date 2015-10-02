/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule WebSocket
 *
 */
'use strict';

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTWebSocketManager = require('NativeModules').WebSocketManager;

var WebSocketBase = require('WebSocketBase');

class Event {
  constructor(type) {
    this.type = type.toString();
  }
}

class MessageEvent extends Event {
  constructor(type, eventInitDict) {
    super(type);
    Object.assign(this, eventInitDict);
  }
}

var WebSocketId = 0;

class WebSocket extends WebSocketBase {
  _socketId: number;
  _subs: any;

  connectToSocketImpl(url: string): void {
    this._socketId = WebSocketId++;
    RCTWebSocketManager.connect(url, this._socketId);
    this._registerEvents(this._socketId);
  }

  closeConnectionImpl(): void {
    RCTWebSocketManager.close(this._socketId);
  }

  cancelConnectionImpl(): void {
    RCTWebSocketManager.close(this._socketId);
  }

  sendStringImpl(message: string): void {
    RCTWebSocketManager.send(message, this._socketId);
  }

  sendArrayBufferImpl(): void {
    // TODO
    console.warn('Sending ArrayBuffers is not yet supported');
  }

  _unregisterEvents(): void {
    this._subs.forEach(e => e.remove());
    this._subs = [];
  }

  _registerEvents(id: number): void {
    this._subs = [
      RCTDeviceEventEmitter.addListener(
        'websocketMessage',
        function(ev) {
          if (ev.id !== id) {
            return;
          }
          var event = new MessageEvent('message', {
            data: ev.data
          });
          this.onmessage && this.onmessage(event);
          this.dispatchEvent(event);
        }.bind(this)
      ),
      RCTDeviceEventEmitter.addListener(
        'websocketOpen',
        function(ev) {
          if (ev.id !== id) {
            return;
          }
          this.readyState = this.OPEN;
          var event = new Event('open');
          this.onopen && this.onopen(event);
          this.dispatchEvent(event);
        }.bind(this)
      ),
      RCTDeviceEventEmitter.addListener(
        'websocketClosed',
        function(ev) {
          if (ev.id !== id) {
            return;
          }
          this.readyState = this.CLOSED;
          var event = new Event('close');
          this.onclose && this.onclose(event);
          this.dispatchEvent(event);
          this._unregisterEvents();
          RCTWebSocketManager.close(id);
        }.bind(this)
      ),
      RCTDeviceEventEmitter.addListener(
        'websocketFailed',
        function(ev) {
          if (ev.id !== id) {
            return;
          }
          var event = new Event('error');
          event.message = ev.message;
          this.onerror && this.onerror(event);
          this.dispatchEvent(event);
          this._unregisterEvents();
          RCTWebSocketManager.close(id);
        }.bind(this)
      )
    ];
  }

}

module.exports = WebSocket;
