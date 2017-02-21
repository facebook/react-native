/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const url = require('url');
const WebSocketServer = require('ws').Server;
const PROTOCOL_VERSION = 2;

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

function isBroadcast(message) {
  return (
    typeof message.method === 'string' &&
    message.id === undefined &&
    message.target === undefined
  );
}

function isRequest(message) {
  return (
    typeof message.method === 'string' &&
    typeof message.target === 'string');
}

function isResponse(message) {
  return (
    typeof message.id === 'object' &&
    typeof message.id.requestId !== undefined &&
    typeof message.id.clientId === 'string' && (
      message.result !== undefined ||
      message.error !== undefined
  ));
}

function attachToServer(server, path) {
  const wss = new WebSocketServer({
    server: server,
    path: path
  });
  const clients = new Map();
  let nextClientId = 0;

  function getClientWs(clientId) {
    const clientWs = clients.get(clientId);
    if (clientWs === undefined) {
      throw `could not find id "${clientId}" while forwarding request`;
    }
    return clientWs;
  }

  function handleSendBroadcast(broadcasterId, message) {
    const forwarded = {
      version: PROTOCOL_VERSION,
      method: message.method,
      params: message.params,
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

    function handleCaughtError(message, error) {
      const errorMessage = {
        id: message.id,
        method: message.method,
        target: message.target,
        error: message.error === undefined ? 'undefined' : 'defined',
        params: message.params === undefined ? 'undefined' : 'defined',
        result: message.result === undefined ? 'undefined' : 'defined',
      };

      if (message.id === undefined) {
        console.error(
          `Handling message from ${clientId} failed with:\n${error}\n` +
          `message:\n${JSON.stringify(errorMessage)}`);
      } else {
        try {
          clientWs.send(JSON.stringify({
            version: PROTOCOL_VERSION,
            error: error,
            id: message.id,
          }));
        } catch (e) {
          console.error(`Failed to reply to ${clientId} with error:\n${error}` +
                        `\nmessage:\n${JSON.stringify(errorMessage)}` +
                        `\ndue to error: ${e.toString()}`);
        }
      }
    }

    function handleServerRequest(message) {
      let result = null;
      switch (message.method) {
        case 'getid':
          result = clientId;
          break;
        case 'getpeers':
          result = {};
          clients.forEach((otherWs, otherId) => {
            if (clientId !== otherId) {
              result[otherId] = url.parse(otherWs.upgradeReq.url).query;
            }
          });
          break;
        default:
          throw `unkown method: ${message.method}`;
      }

      clientWs.send(JSON.stringify({
        version: PROTOCOL_VERSION,
        result: result,
        id: message.id
      }));
    }

    function forwardRequest(message) {
      getClientWs(message.target).send(JSON.stringify({
        version: PROTOCOL_VERSION,
        method: message.method,
        params: message.params,
        id: (message.id === undefined
          ? undefined
          : {requestId: message.id, clientId: clientId}),
      }));
    }

    function forwardResponse(message) {
      getClientWs(message.id.clientId).send(JSON.stringify({
        version: PROTOCOL_VERSION,
        result: message.result,
        error: message.error,
        id: message.id.requestId,
      }));
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
        if (isBroadcast(message)) {
          handleSendBroadcast(clientId, message);
        } else if (isRequest(message)) {
          if (message.target === 'server') {
            handleServerRequest(message);
          } else {
            forwardRequest(message);
          }
        } else if (isResponse(message)) {
          forwardResponse(message);
        } else {
          throw 'Invalid message, did not match the protocol';
        }
      } catch (e) {
        handleCaughtError(message, e.toString());
      }
    };
  });

  return {
    broadcast: (method, params) => {
      handleSendBroadcast(null, {method: method, params: params});
    }
  };
}

module.exports = {
  attachToServer: attachToServer,
  parseMessage: parseMessage,
};
