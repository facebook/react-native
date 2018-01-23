#!/usr/bin/env node

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule websocket_integration_test_server
 */
'use strict';

/* eslint-env node */

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const WebSocket = require('ws');

console.log(`\
WebSocket integration test server

This will send each incoming message back, with the string '_response' appended.
An incoming message of 'exit' will shut down the server.

`);

const server = new WebSocket.Server({port: 5555});
server.on('connection', (ws) => {
  ws.on('message', (message) => {
    console.log('Received message:', message);
    if (message === 'exit') {
      console.log('WebSocket integration test server exit');
      process.exit(0);
    }
    console.log('Cookie:', ws.upgradeReq.headers.cookie);
    ws.send(message + '_response');
  });

  ws.send('hello');
});
