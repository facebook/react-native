/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const RCTWebSocketModule = require('../BatchedBridge/NativeModules')
  .WebSocketModule;
const NativeEventEmitter = require('../EventEmitter/NativeEventEmitter');

const base64 = require('base64-js');

const originalRCTWebSocketConnect = RCTWebSocketModule.connect;
const originalRCTWebSocketSend = RCTWebSocketModule.send;
const originalRCTWebSocketSendBinary = RCTWebSocketModule.sendBinary;
const originalRCTWebSocketClose = RCTWebSocketModule.close;

let eventEmitter: NativeEventEmitter;
let subscriptions: Array<EventSubscription>;

let closeCallback;
let sendCallback;
let connectCallback;
let onOpenCallback;
let onMessageCallback;
let onErrorCallback;
let onCloseCallback;

let isInterceptorEnabled = false;

/**
 * A network interceptor which monkey-patches RCTWebSocketModule methods
 * to gather all websocket network requests/responses, in order to show
 * their information in the React Native inspector development tool.
 */

const WebSocketInterceptor = {
  /**
   * Invoked when RCTWebSocketModule.close(...) is called.
   */
  setCloseCallback(callback) {
    closeCallback = callback;
  },

  /**
   * Invoked when RCTWebSocketModule.send(...) or sendBinary(...) is called.
   */
  setSendCallback(callback) {
    sendCallback = callback;
  },

  /**
   * Invoked when RCTWebSocketModule.connect(...) is called.
   */
  setConnectCallback(callback) {
    connectCallback = callback;
  },

  /**
   * Invoked when event "websocketOpen" happens.
   */
  setOnOpenCallback(callback) {
    onOpenCallback = callback;
  },

  /**
   * Invoked when event "websocketMessage" happens.
   */
  setOnMessageCallback(callback) {
    onMessageCallback = callback;
  },

  /**
   * Invoked when event "websocketFailed" happens.
   */
  setOnErrorCallback(callback) {
    onErrorCallback = callback;
  },

  /**
   * Invoked when event "websocketClosed" happens.
   */
  setOnCloseCallback(callback) {
    onCloseCallback = callback;
  },

  isInterceptorEnabled() {
    return isInterceptorEnabled;
  },

  _unregisterEvents() {
    subscriptions.forEach(e => e.remove());
    subscriptions = [];
  },

  /**
   * Add listeners to the RCTWebSocketModule events to intercept them.
   */
  _registerEvents() {
    subscriptions = [
      eventEmitter.addListener('websocketMessage', ev => {
        if (onMessageCallback) {
          onMessageCallback(
            ev.id,
            ev.type === 'binary'
              ? WebSocketInterceptor._arrayBufferToString(ev.data)
              : ev.data,
          );
        }
      }),
      eventEmitter.addListener('websocketOpen', ev => {
        if (onOpenCallback) {
          onOpenCallback(ev.id);
        }
      }),
      eventEmitter.addListener('websocketClosed', ev => {
        if (onCloseCallback) {
          onCloseCallback(ev.id, {code: ev.code, reason: ev.reason});
        }
      }),
      eventEmitter.addListener('websocketFailed', ev => {
        if (onErrorCallback) {
          onErrorCallback(ev.id, {message: ev.message});
        }
      }),
    ];
  },

  enableInterception() {
    if (isInterceptorEnabled) {
      return;
    }
    eventEmitter = new NativeEventEmitter(RCTWebSocketModule);
    WebSocketInterceptor._registerEvents();

    // Override `connect` method for all RCTWebSocketModule requests
    // to intercept the request url, protocols, options and socketId,
    // then pass them through the `connectCallback`.
    RCTWebSocketModule.connect = function(url, protocols, options, socketId) {
      if (connectCallback) {
        connectCallback(url, protocols, options, socketId);
      }
      originalRCTWebSocketConnect.apply(this, arguments);
    };

    // Override `send` method for all RCTWebSocketModule requests to intercept
    // the data sent, then pass them through the `sendCallback`.
    RCTWebSocketModule.send = function(data, socketId) {
      if (sendCallback) {
        sendCallback(data, socketId);
      }
      originalRCTWebSocketSend.apply(this, arguments);
    };

    // Override `sendBinary` method for all RCTWebSocketModule requests to
    // intercept the data sent, then pass them through the `sendCallback`.
    RCTWebSocketModule.sendBinary = function(data, socketId) {
      if (sendCallback) {
        sendCallback(WebSocketInterceptor._arrayBufferToString(data), socketId);
      }
      originalRCTWebSocketSendBinary.apply(this, arguments);
    };

    // Override `close` method for all RCTWebSocketModule requests to intercept
    // the close information, then pass them through the `closeCallback`.
    RCTWebSocketModule.close = function() {
      if (closeCallback) {
        if (arguments.length === 3) {
          closeCallback(arguments[0], arguments[1], arguments[2]);
        } else {
          closeCallback(null, null, arguments[0]);
        }
      }
      originalRCTWebSocketClose.apply(this, arguments);
    };

    isInterceptorEnabled = true;
  },

  _arrayBufferToString(data) {
    const value = base64.toByteArray(data).buffer;
    if (value === undefined || value === null) {
      return '(no value)';
    }
    if (
      typeof ArrayBuffer !== 'undefined' &&
      typeof Uint8Array !== 'undefined' &&
      value instanceof ArrayBuffer
    ) {
      return `ArrayBuffer {${String(Array.from(new Uint8Array(value)))}}`;
    }
    return value;
  },

  // Unpatch RCTWebSocketModule methods and remove the callbacks.
  disableInterception() {
    if (!isInterceptorEnabled) {
      return;
    }
    isInterceptorEnabled = false;
    RCTWebSocketModule.send = originalRCTWebSocketSend;
    RCTWebSocketModule.sendBinary = originalRCTWebSocketSendBinary;
    RCTWebSocketModule.close = originalRCTWebSocketClose;
    RCTWebSocketModule.connect = originalRCTWebSocketConnect;

    connectCallback = null;
    closeCallback = null;
    sendCallback = null;
    onOpenCallback = null;
    onMessageCallback = null;
    onCloseCallback = null;
    onErrorCallback = null;

    WebSocketInterceptor._unregisterEvents();
  },
};

module.exports = WebSocketInterceptor;
