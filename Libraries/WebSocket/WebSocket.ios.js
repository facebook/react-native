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
var RCTWebSocketFactory = require('NativeModules').WebSocketFactory;

var WebSocketBase = require('WebSocketBase');

var WebSocketId = 0;

class WebSocket extends WebSocketBase {
  _socketId: number;
  _subs: any;

  connectToSocketImpl(url: string): void {
    RCTWebSocketFactory.connect(url);
    this._socketId = WebSocketId++;
    this._registerEvents(this._socketId);
  }

  closeConnectionImpl(): void{
    RCTWebSocketFactory.close(this._socketId)
  }

  cancelConnectionImpl(): void {
    RCTWebSocketFactory.close(this._socketId)
  }

  sendStringImpl(message: string): void {
    RCTWebSocketFactory.send(message, this._socketId);
  }

  sendArrayBufferImpl(): void {
    // TODO
  }

  _unregisterEvents(): void{
    this._subs.forEach(e => e.remove())
    this._subs = [];
  }

  _registerEvents(id: number): void{
    this._subs = [
      RCTDeviceEventEmitter.addListener(
        'websocketMessage',
        function(ev){
          if(ev.id != id)
            return;
          this.onmessage && this.onmessage({
            data:ev.data
          });
        }.bind(this)
      ),
      RCTDeviceEventEmitter.addListener(
        'websocketOpen',
        function(ev){
          if(ev.id != id)
            return;
          this.readyState = this.OPEN
          this.onopen && this.onopen();
        }.bind(this)
      ),
      RCTDeviceEventEmitter.addListener(
        'websocketClosed',
        function(ev){
          if(ev.id != id)
            return;
          this.readyState = this.CLOSED
          this.onclose && this.onclose(ev)
          this._unregisterEvents();
          RCTWebSocketFactory.destroy(id)
        }.bind(this)
      ),
      RCTDeviceEventEmitter.addListener(
        'websocketFailed',
        function(ev){
          if(ev.id != id)
            return;
          this.onerror && this.onerror(new Error(ev.message))
          this._unregisterEvents();
          RCTWebSocketFactory.destroy(id)
        }.bind(this)
      )
    ]
  }

}

module.exports = WebSocket;
