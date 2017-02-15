/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const WebSocketServer = require('ws').Server;
const PROTOCOL_VERSION = 1;

function parseMessage(data, binary) {
  if (binary) {
    console.error('Expected text message, got binary!');
    return undefined;
  }
  try {
    const message = JSON.parse(data);
    if (message.version === PROTOCOL_VERSION) {
      return message;
    }
    console.error('Received message had wrong protocol version: '
                  + message.version);
  } catch (e) {
    console.error('Failed to parse the message as JSON:\n' + data);
  }
  return undefined;
}

function attachToServer(server, path) {
  const wss = new WebSocketServer({
    server: server,
    path: path
  });
  const clients = new Map();
  let nextClientId = 0;

  function handleSendBroadcast(broadcasterId, message) {
    const forwarded = {
      version: PROTOCOL_VERSION,
      target: message.target,
      action: message.action,
    };
    for (const [otherId, otherWs] of clients) {
      if (otherId !== broadcasterId) {
        try {
          otherWs.send(JSON.stringify(forwarded));
        } catch (e) {
          console.error(`Failed to send broadcast to client: '${otherId}' ` +
                        `due to:\n ${e.toString()}`);
        }
      }
    }
  }

  wss.on('connection', function(clientWs) {
    const clientId = `client#${nextClientId++}`;

    function handleCatchedError(message, error) {
      const errorMessage = {
        target: message.target,
        action: message.action === undefined ? 'undefined' : 'defined',
      };
      console.error(
        `Handling message from ${clientId} failed with:\n${error}\n` +
        `message:\n${JSON.stringify(errorMessage)}`);
    }

    clients.set(clientId, clientWs);
    clientWs.onclose =
    clientWs.onerror = () => {
      clientWs.onmessage = null;
      clients.delete(clientId);
    };
    clientWs.onmessage = (event) => {
      const message = parseMessage(event.data, event.binary);
      if (message === undefined) {
        console.error('Received message not matching protocol');
        return;
      }

      try {
        handleSendBroadcast(clientId, message);
      } catch (e) {
        handleCatchedError(message, e.toString());
      }
    };
  });

  return {
    broadcast: (target, action) => {
      handleSendBroadcast(null, {target: target, action: action});
    }
  };
}

module.exports = {
  attachToServer: attachToServer,
  parseMessage: parseMessage,
};
