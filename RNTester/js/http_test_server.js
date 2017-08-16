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
 * @providesModule http_test_server
 */
'use strict';

/* eslint-env node */

console.log(`\
Test server for WebSocketExample

This will set a cookie named "wstest" on the response of any incoming request.
`);

const connect = require('connect');
const http = require('http');

const app = connect();

app.use(function(req, res) {
  console.log('received request');
  const cookieOptions = {
    //httpOnly: true, // the cookie is not accessible by the user (javascript,...)
    secure: false, // allow HTTP
  };
  res.cookie('wstest', 'OK', cookieOptions);
  res.end('Cookie has been set!\n');
});

http.createServer(app).listen(5556);
