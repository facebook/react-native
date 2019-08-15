#!/usr/bin/env node

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

/* eslint-env node */

const WebSocket = require('ws');

console.log(`\
WebSocket integration test server

This will send each incoming message back, with the string '_response' appended.
An incoming message of 'exit' will shut down the server.

`);

const server = new WebSocket.Server({port: 5555});
server.on('connection', ws => {
  ws.on('message', message => {
    console.log('Received message:', message);
    if (message === 'exit') {
      console.log('WebSocket integration test server exit');
      process.exit(0);
    }
<<<<<<< HEAD
    console.log('Cookie:', ws.upgradeReq.headers.cookie);

    if (message instanceof Buffer) {
      ws.send(message);
    } else {
      ws.send(message + '_response');
    }
=======
    ws.send(message + '_response');
>>>>>>> v0.60.0
  });

  ws.send('hello');
});
