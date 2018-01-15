/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */

'use strict';

const WebSocket = require('ws');

const parseMessage = require('./messageSocket').parseMessage;

const PROTOCOL_VERSION = 2;
const TARGET_SERVER = 'server';

function getMessageId() {
  return `${Date.now()}:${Math.random()}`;
}

class JsPackagerClient {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.msgCallbacks = new Map();

    this.openPromise = new Promise((resolve, reject) => {
      this.ws.on('error', error => reject(error));
      this.ws.on('open', resolve);
    });

    this.ws.on('message', (data, flags) => {
      const message = parseMessage(data, flags.binary);
      const msgCallback = this.msgCallbacks.get(message.id);
      if (message === undefined || message.id === undefined) {
        // gracefully ignore wrong messages or broadcasts
      } else if (msgCallback === undefined) {
        console.warn(`Response with non-existing message id: '${message.id}'`);
      } else {
        if (message.error === undefined) {
          msgCallback.resolve(message.result);
        } else {
          msgCallback.reject(message.error);
        }
      }
    });
  }

  sendRequest(method, target, params) {
    return this.openPromise.then(() => new Promise((resolve, reject) => {
      const messageId = getMessageId();
      this.msgCallbacks.set(messageId, {resolve: resolve, reject: reject});
      this.ws.send(
        JSON.stringify({
          version: PROTOCOL_VERSION,
          target: target,
          method: method,
          id: messageId,
          params: params,
        }),
        error => {
          if (error !== undefined) {
            this.msgCallbacks.delete(messageId);
            reject(error);
          }
        });
    }));
  }

  sendNotification(method, target, params) {
    return this.openPromise.then(() => new Promise((resolve, reject) => {
      this.ws.send(
        JSON.stringify({
          version: PROTOCOL_VERSION,
          target: target,
          method: method,
          params: params,
        }),
        error => {
          if (error !== undefined) {
            reject(error);
          } else {
            resolve();
          }
        });
    }));
  }

  sendBroadcast(method, params) {
    return this.sendNotification(method, undefined, params);
  }

  getPeers() {
    return new Promise((resolve, reject) => {
      this.sendRequest('getpeers', TARGET_SERVER, undefined).then(
        response => {
          if (!response instanceof Map) {
            reject('Results received from server are of wrong format:\n' +
                   JSON.stringify(response));
          } else {
            resolve(response);
          }
        },
        reject);
    });
  }

  getId() {
    return this.sendRequest('getid', TARGET_SERVER, undefined);
  }
}

module.exports = JsPackagerClient;
