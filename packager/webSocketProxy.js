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

  function sendSpecial(message) {
    clients.forEach(function (cn) {
      try {
        cn.send(JSON.stringify(message));
      } catch(e) {
        console.warn('WARN: ' + e.message);
      }
    });
  }

  wss.on('connection', function(ws) {
    var id = Math.random().toString(15).slice(10, 20);
    sendSpecial({$open: id});
    clients.push(ws);

    var allClientsExcept = function(ws) {
      return clients.filter(function(cn) { return cn !== ws; });
    };

    ws.onerror = function() {
      clients = allClientsExcept(ws);
      sendSpecial({$error: id});
    };

    ws.onclose = function() {
      clients = allClientsExcept(ws);
      sendSpecial({$close: id});
    };

    ws.on('message', function(message) {
      allClientsExcept(ws).forEach(function(cn) {
        try {
          cn.send(message);
        } catch(e) {
          // Sometimes this call throws 'not opened'
        }
      });
    });
  });

  return wss;
}

module.exports = {
  attachToServer: attachToServer
};
