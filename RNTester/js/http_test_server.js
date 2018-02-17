#!/usr/bin/env node
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @providesModule http_test_server
 */
'use strict';

/* eslint-env node */

console.log(`\
Test server for WebSocketExample

This will set a cookie named "wstest" on the response of any incoming request.
`);

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const connect = require('connect');
const http = require('http');

const app = connect();

app.use(function(req, res) {
  console.log('received request');
  res.setHeader('Set-Cookie', ['wstest=OK; Path=/']);
  res.end('Cookie has been set!\n');
});

http.createServer(app).listen(5556);
