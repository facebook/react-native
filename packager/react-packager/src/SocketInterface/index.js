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
const SocketClient = require('./SocketClient');
const SocketServer = require('./SocketServer');
const _ = require('underscore');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const tmpdir = require('os').tmpdir();
const {spawn} = require('child_process');

const CREATE_SERVER_TIMEOUT = 30000;

const SocketInterface = {
  getOrCreateSocketFor(options) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      Object.keys(options).sort().forEach(key => {
        if (options[key] && typeof options[key] !== 'string') {
          hash.update(JSON.stringify(options[key]));
        } else {
          hash.update(options[key]);
        }
      });

      const sockPath = path.join(
        tmpdir,
        'react-packager-' + hash.digest('hex')
      );

      if (fs.existsSync(sockPath)) {
        resolve(SocketClient.create(sockPath));
        return;
      }

      const logPath = path.join(tmpdir, 'react-packager.log');

      const timeout = setTimeout(
        () => reject(
          new Error(
            'Took too long to start server. Server logs: \n' +
            fs.readFileSync(logPath, 'utf8')
          )
        ),
        CREATE_SERVER_TIMEOUT,
      );

      const log = fs.openSync(logPath, 'a');

      // Enable server debugging by default since it's going to a log file.
      const env = _.clone(process.env);
      env.DEBUG = 'ReactPackager:SocketServer';

      // We have to go through the main entry point to make sure
      // we go through the babel require hook.
      const child = spawn(
        process.execPath,
        [path.join(__dirname, '..', '..', 'index.js')],
        {
          detached: true,
          env: env,
          stdio: ['ipc', log, log]
        }
      );

      child.unref();

      child.on('message', m => {
        if (m && m.type && m.type === 'createdServer') {
          clearTimeout(timeout);
          child.disconnect();
          resolve(SocketClient.create(sockPath));
        }
      });


      if (options.blacklistRE) {
        options.blacklistRE = { source: options.blacklistRE.source };
      }

      child.send({
        type: 'createSocketServer',
        data: { sockPath, options }
      });
    });
  },

  listenOnServerMessages() {
    return SocketServer.listenOnServerIPCMessages();
  }

};

module.exports = SocketInterface;
