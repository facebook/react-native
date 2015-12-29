/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

/**
 * Attaches a WebSocket based connection to the Packager to expose
 * Hot Module Replacement updates to the simulator.
 */
function attachHMRServer({httpServer, path, packagerServer}) {
  let activeWS;
  packagerServer.addFileChangeListener(filename => {
    if (!activeWS) {
      return;
    }

    packagerServer.buildBundleForHMR({
      entryFile: filename,
      // TODO(martinb): receive platform on query string when client connects
      platform: 'ios',
    })
    .then(bundle => activeWS.send(bundle));
  });

  const WebSocketServer = require('ws').Server;
  const wss = new WebSocketServer({
    server: httpServer,
    path: path,
  });

  console.log('[Hot Module Replacement] Server listening on', path);
  wss.on('connection', ws => {
    console.log('[Hot Module Replacement] Client connected');
    activeWS = ws;

    ws.on('error', e => {
      console.error('[Hot Module Replacement] Unexpected error', e);
    });

    ws.on('close', () => {
      console.log('[Hot Module Replacement] Client disconnected');
      activeWS = null;
    });
  });
}

module.exports = attachHMRServer;
