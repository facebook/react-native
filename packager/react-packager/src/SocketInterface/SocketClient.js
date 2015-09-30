/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Bundle = require('../Bundler/Bundle');
const Promise = require('promise');
const bser = require('bser');
const debug = require('debug')('ReactNativePackager:SocketClient');
const fs = require('fs');
const net = require('net');
const path  = require('path');
const tmpdir = require('os').tmpdir();

const LOG_PATH = path.join(tmpdir, 'react-packager.log');

class SocketClient {
  static create(sockPath) {
    return new SocketClient(sockPath).onReady();
  }

  constructor(sockPath) {
    debug('connecting to', sockPath);

    this._sock = net.connect(sockPath);
    this._ready = new Promise((resolve, reject) => {
      this._sock.on('connect', () => {
        this._sock.removeAllListeners('error');
        process.on('uncaughtException', (error) => {
          console.error('uncaught error', error.stack);
          setImmediate(() => process.exit(1));
        });
        resolve(this);
      });
      this._sock.on('error', (e) => {
        e.message = `Error connecting to server on ${sockPath} ` +
                    `with error: ${e.message}`;
        e.message += getServerLogs();

        reject(e);
      });
    });

    this._resolvers = Object.create(null);
    const bunser = new bser.BunserBuf();
    this._sock.on('data', (buf) => bunser.append(buf));
    bunser.on('value', (message) => this._handleMessage(message));

    this._sock.on('close', () => {
      if (!this._closing) {
        const terminate = (result) => {
          const sockPathExists = fs.existsSync(sockPath);
          throw new Error(
            'Server closed unexpectedly.\n' +
            'Server ping connection attempt result: ' + result + '\n' +
            'Socket path: `' + sockPath + '` ' +
            (sockPathExists ? ' exists.' : 'doesn\'t exist') + '\n' +
            getServerLogs()
          );
        };

        // before throwing ping the server to see if it's still alive
        const socket = net.connect(sockPath);
        socket.on('connect', () => {
          socket.end();
          terminate('OK');
        });
        socket.on('error', error => terminate(error));
      }
    });
  }

  onReady() {
    return this._ready;
  }

  getDependencies(main) {
    return this._send({
      type: 'getDependencies',
      data: main,
    });
  }

  getOrderedDependencyPaths(main) {
    return this._send({
      type: 'getOrderedDependencyPaths',
      data: main,
    });
  }

  buildBundle(options) {
    return this._send({
      type: 'buildBundle',
      data: options,
    }).then(json => Bundle.fromJSON(json));
  }

  _send(message) {
    message.id = uid();
    this._sock.write(bser.dumpToBuffer(message));
    return new Promise((resolve, reject) => {
      this._resolvers[message.id] = {resolve, reject};
    });
  }

  _handleMessage(message) {
    if (!(message && message.id && message.type)) {
      throw new Error(
        'Malformed message from server ' + JSON.stringify(message)
      );
    }

    debug('got message with type', message.type);

    const resolver = this._resolvers[message.id];
    if (!resolver) {
      throw new Error(
        'Unrecognized message id (' + message.id + ') ' +
        'message already resolved or never existed.'
      );
    }

    delete this._resolvers[message.id];

    if (message.type === 'error') {
      resolver.reject(new Error(
        message.data + '\n' + 'See logs ' + LOG_PATH
      ));
    } else {
      resolver.resolve(message.data);
    }
  }

  close() {
    debug('closing connection');
    this._closing = true;
    this._sock.end();
  }
}

module.exports = SocketClient;

function uid(len) {
  len = len || 7;
  return Math.random().toString(35).substr(2, len);
}

function getServerLogs() {
  if (fs.existsSync(LOG_PATH)) {
    return '\nServer logs:\n' + fs.readFileSync(LOG_PATH, 'utf8');
  }

  return '';
}
