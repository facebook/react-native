/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';


function attachToServer(server, path) {
  var WebSocketServer = require('ws').Server;
  var wss = new WebSocketServer({
    server: server,
    path: path
  });
  var clients = [];

  function sendFrom(source, data) {
    clients.forEach((client) => {
      if (client !== source) {
        try {
          client.send(data);
        } catch (e) {
          // Sometimes this call throws 'not opened'
        }
      }
    });
  }

  wss.on('connection', function(ws) {
    clients.push(ws);
    ws.onclose =
    ws.onerror = () => {
      ws.onmessage = null;
      clients = clients.filter((client) => client !== ws);
    };
    ws.onmessage = ({data}) => sendFrom(ws, data);
  });

  return {
    broadcast: (message) => {
      sendFrom(null, JSON.stringify(message));
    }
  };
}

module.exports = {
  attachToServer: attachToServer
};
