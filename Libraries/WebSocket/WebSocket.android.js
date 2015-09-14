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

var WebSocketBase = require('WebSocketBase');

class WebSocket extends WebSocketBase {

  connectToSocketImpl(url: string): void {
    console.warn('WebSocket is not yet supported on Android');
  }

  closeConnectionImpl(): void{
    console.warn('WebSocket is not yet supported on Android');
  }

  cancelConnectionImpl(): void {
    console.warn('WebSocket is not yet supported on Android');
  }

  sendStringImpl(message: string): void {
    console.warn('WebSocket is not yet supported on Android');
  }

  sendArrayBufferImpl(): void {
    console.warn('WebSocket is not yet supported on Android');
  }
}

module.exports = WebSocket;
