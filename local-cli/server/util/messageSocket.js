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
  var interfaceSocket, shellSocket;

  function send(dest, message) {
    if (!dest) {
      return;
    }

    try {
      dest.send(message);
    } catch(e) {
      console.warn(e);
      // Sometimes this call throws 'not opened'
    }
  }

  wss.on('connection', function(ws) {
    const {url} = ws.upgradeReq;

    if (url.indexOf('role=interface') > -1) {
      if (interfaceSocket) {
        ws.close(1011, 'Another debugger is already connected');
        return;
      }
      interfaceSocket = ws;
      interfaceSocket.onerror =
      interfaceSocket.onclose = () => {
        interfaceSocket = null;
        // if (shellSocket) {
        //   shellSocket.close(1011, 'Interface was disconnected');
        // }
      };

      interfaceSocket.onmessage = ({data}) => {
        send(shellSocket, data)
      };
    } else if (url.indexOf('role=shell') > -1) {
      if (shellSocket) {
        shellSocket.onerror = shellSocket.onclose = shellSocket.onmessage = null;
        shellSocket.close(1011, 'Another client connected');
      }
      shellSocket = ws;
      shellSocket.onerror =
      shellSocket.onclose = () => {
        shellSocket = null;
        send(interfaceSocket, JSON.stringify({method: '$disconnected'}));
      };
      shellSocket.onmessage = ({data}) => send(interfaceSocket, data);

      // console.log('CLIENT ----');
      // if (doIt) {
      //   console.log('> sending: %s', str);
      //   send(shellSocket, str);
      //   console.log('< sending');
      // }

    } else {
      ws.close(1011, 'Missing role param');
    }
  });

  return {
    server: wss,
    isChromeConnected: function() {
      return !!interfaceSocket;
    }
  };
}

module.exports = {
  attachToServer: attachToServer
};
