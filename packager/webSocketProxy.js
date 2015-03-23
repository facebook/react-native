/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var WebSocketServer = require('ws').Server;

function attachToServer(server, path) {
  var wss = new WebSocketServer({
    server: server,
    path: path
  });
  var clients = [];

  wss.on('connection', function(ws) {
    clients.push(ws);

    var allClientsExcept = function(ws) {
      return clients.filter(function(cn) { return cn !== ws; });
    };

    ws.onerror = function() {
      clients = allClientsExcept(ws);
    };

    ws.onclose = function() {
      clients = allClientsExcept(ws);
    };

    ws.on('message', function(message) {
      allClientsExcept(ws).forEach(function(cn) {
        cn.send(message);
      });
    });
  });
}

module.exports = {
  attachToServer: attachToServer
};
