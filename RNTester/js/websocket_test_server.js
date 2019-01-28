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

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const WebSocket = require('ws');

const fs = require('fs');
const path = require('path');

console.log(`\
Test server for WebSocketExample

This will send each incoming message right back to the other side.
Restart with the '--binary' command line flag to have it respond with an
ArrayBuffer instead of a string.
`);

const respondWithBinary = process.argv.indexOf('--binary') !== -1;
const server = new WebSocket.Server({port: 5555});
server.on('connection', ws => {
  ws.on('message', message => {
    console.log('Received message:', message);
    console.log('Cookie:', ws.upgradeReq.headers.cookie);
    if (respondWithBinary) {
      message = Buffer.from(message);
    }
    if (message === 'getImage') {
      message = fs.readFileSync(path.resolve(__dirname, 'flux@3x.png'));
    }
    console.log('Replying with:', message);
    ws.send(message);
  });

  console.log('Incoming connection!');
  ws.send('Why hello there!');
});
