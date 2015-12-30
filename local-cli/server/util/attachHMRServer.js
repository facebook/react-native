/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const querystring = require('querystring');
const url = require('url');

/**
 * Attaches a WebSocket based connection to the Packager to expose
 * Hot Module Replacement updates to the simulator.
 */
function attachHMRServer({httpServer, path, packagerServer}) {
  let client = null;

  function disconnect() {
    client = null;
  }

  packagerServer.addFileChangeListener(filename => {
    if (!client) {
      return;
    }

    packagerServer.buildBundleForHMR({
      entryFile: filename,
      platform: client.platform,
    })
    .then(bundle => client.ws.send(bundle));
  });

  const WebSocketServer = require('ws').Server;
  const wss = new WebSocketServer({
    server: httpServer,
    path: path,
  });

  console.log('[Hot Module Replacement] Server listening on', path);
  wss.on('connection', ws => {
    console.log('[Hot Module Replacement] Client connected');
    const params = querystring.parse(url.parse(ws.upgradeReq.url).query);
    client = {
      ws,
      platform: params.platform,
      bundleEntry: params.bundleEntry,
    };

    client.ws.on('error', e => {
      console.error('[Hot Module Replacement] Unexpected error', e);
      disconnect();
    });

    client.ws.on('close', () => disconnect());
  });
}

module.exports = attachHMRServer;
