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

class WebsocketEvent {
  constructor(type, eventInitDict) {
    this.type = type.toString();
    if (typeof eventInitDict === 'object') {
      Object.assign(this, eventInitDict);
    }
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
        ev => {
          if (ev.id !== id) {
            return;
          }
          var event = new WebsocketEvent('message', {
            data: ev.data,
          });
          this.dispatchEvent(event);
        },
      ),
      RCTDeviceEventEmitter.addListener(
        'websocketOpen',
        ev => {
          if (ev.id !== id) {
            return;
          }
          this.readyState = this.OPEN;
          var event = new WebsocketEvent('open');
          this.dispatchEvent(event);
        }
      ),
      RCTDeviceEventEmitter.addListener(
        'websocketClosed',
        (ev) => {
          if (ev.id !== id) {
            return;
          }
          this.readyState = this.CLOSED;
          var event = new WebsocketEvent('close');
          this.dispatchEvent(event);

          this._unregisterEvents();
          RCTWebSocketManager.close(id);
        }
      ),
      RCTDeviceEventEmitter.addListener(
        'websocketFailed',
        (ev) => {
          if (ev.id !== id) {
            return;
          }
          this.readyState = this.CLOSED;

          var closeEvent = new WebsocketEvent('close');
          this.dispatchEvent(closeEvent);

          var errorEvent = new WebsocketEvent('error', {
            message: ev.message,
          });
          this.dispatchEvent(errorEvent);

          this._unregisterEvents();
          RCTWebSocketManager.close(id);
        }
      )
    ];
  }

}

module.exports = WebSocket;
