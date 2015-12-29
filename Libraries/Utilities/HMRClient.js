/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule HMRClient
 */
'use strict';

let _activeWS;

/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
const HMRClient = {
  setEnabled(enabled) {
    if (_activeWS && _activeWS) {
      _activeWS.close();
      _activeWS = null;
    }

    if (enabled) {
      // TODO(martinb): parametrize the url and receive entryFile to minimize 
      // the number of updates we want to receive from the server.
      _activeWS = new WebSocket('ws://localhost:8081/hot');
      _activeWS.onerror = (e) => {
        console.error('[Hot Module Replacement] Unexpected error', e);
      };
      _activeWS.onmessage = (m) => {
        // TODO(martinb): inject HMR update
      };
    }
  },
};

module.exports = HMRClient;
