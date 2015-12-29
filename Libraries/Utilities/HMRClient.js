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

/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
const HMRClient = {
  enable() {
    // need to require WebSocket inside of `enable` function because the
    // this module is defined as a `polyfillGlobal`.
    // See `InitializeJavascriptAppEngine.js`
    const WebSocket = require('WebSocket');

    // TODO(martinb): parametrize the url and receive entryFile to minimize
    // the number of updates we want to receive from the server.
    const activeWS = new WebSocket('ws://localhost:8081/hot');
    activeWS.onerror = (e) => {
      console.error('[Hot Module Replacement] Unexpected error', e);
    };
    activeWS.onmessage = (m) => {
      eval(m.data); // eslint-disable-line no-eval
    };
  },
};

module.exports = HMRClient;
