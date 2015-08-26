/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Promise = require('promise');
const Server = require('../Server');
const bser = require('bser');
const debug = require('debug')('ReactPackager:SocketServer');
const fs = require('fs');
const net = require('net');

const MAX_IDLE_TIME = 10 * 60 * 1000;

class SocketServer {
  constructor(sockPath, options) {
    this._server = net.createServer();
    this._server.listen(sockPath);
    this._ready = new Promise((resolve, reject) => {
      this._server.on('error', (e) => reject(e));
      this._server.on('listening', () => {
        debug(
          'Process %d listening on socket path %s ' +
          'for server with options %j',
          process.pid,
          sockPath,
          options
        );
        resolve(this);
      });
    });
    this._server.on('connection', (sock) => this._handleConnection(sock));

    // Disable the file watcher.
    options.nonPersistent = true;
    this._packagerServer = new Server(options);
    this._jobs = 0;
    this._dieEventually();

    process.on('exit', () => fs.unlinkSync(sockPath));
  }

  onReady() {
    return this._ready;
  }

  _handleConnection(sock) {
    debug('connection to server', process.pid);

    const bunser = new bser.BunserBuf();
    sock.on('data', (buf) => bunser.append(buf));
    bunser.on('value', (m) => this._handleMessage(sock, m));
  }

  _handleMessage(sock, m) {
    if (!m || !m.id || !m.data) {
      console.error('SocketServer recieved a malformed message: %j', m);
      return;
    }

    debug('got request', m);

    // Debounce the kill timer.
    this._dieEventually();

    const handleError = (error) => {
      debug('request error', error);
      this._jobs--;
      this._reply(sock, m.id, 'error', error.stack);
    };

    switch (m.type) {
      case 'getDependencies':
        this._jobs++;
        this._packagerServer.getDependencies(m.data).then(
          ({ dependencies }) => this._reply(sock, m.id, 'result', dependencies),
          handleError,
        );
        break;

      case 'buildBundle':
        this._jobs++;
        this._packagerServer.buildBundle(m.data).then(
          (result) => this._reply(sock, m.id, 'result', result),
          handleError,
        );
        break;

      default:
        this._reply(sock, m.id, 'error', 'Unknown message type: ' + m.type);
    }
  }

  _reply(sock, id, type, data) {
    debug('request finished', type);

    this._jobs--;
    data = toJSON(data);

    sock.write(bser.dumpToBuffer({
      id,
      type,
      data,
    }));
  }

  _dieEventually() {
    clearTimeout(this._deathTimer);
    this._deathTimer = setTimeout(() => {
      if (this._jobs <= 0) {
        debug('server dying', process.pid);
        process.exit(1);
      }
      this._dieEventually();
    }, MAX_IDLE_TIME);
  }

  static listenOnServerIPCMessages() {
    process.on('message', (message) => {
      if (!(message && message.type && message.type === 'createSocketServer')) {
        return;
      }

      debug('server got ipc message', message);

      const {options, sockPath} = message.data;
      // regexp doesn't naturally serialize to json.
      options.blacklistRE = new RegExp(options.blacklistRE.source);

      new SocketServer(sockPath, options).onReady().then(
        () => {
          debug('succesfully created server');
          process.send({ type: 'createdServer' });
        },
        error => {
          debug('error creating server', error.code);
          if (error.code === 'EADDRINUSE') {
            // Server already listening, this may happen if multiple
            // clients where started in quick succussion (buck).
            process.send({ type: 'createdServer' });
          } else {
            throw error;
          }
        }
      ).done();
    });
  }
}

// TODO move this to bser code.
function toJSON(object) {
  if (!(object && typeof object === 'object')) {
    return object;
  }

  if (object.toJSON) {
    return object.toJSON();
  }

  for (var p in object) {
    object[p] = toJSON(object[p]);
  }

  return object;
}

module.exports = SocketServer;
