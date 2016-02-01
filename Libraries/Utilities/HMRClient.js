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

const invariant = require('invariant');

/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
const HMRClient = {
  enable(platform, bundleEntry) {
    invariant(platform, 'Missing required parameter `platform`');
    invariant(bundleEntry, 'Missing required paramenter `bundleEntry`');

    // TODO(martinb) receive host and port as parameters
    const host = 'localhost';
    const port = '8081';

    // need to require WebSocket inside of `enable` function because
    // this module is defined as a `polyfillGlobal`.
    // See `InitializeJavascriptAppEngine.js`
    const WebSocket = require('WebSocket');

    const activeWS = new WebSocket(
      `ws://${host}:${port}/hot?platform=${platform}&` +
      `bundleEntry=${bundleEntry.replace('.bundle', '.js')}`
    );
    activeWS.onerror = (e) => {
      throw new Error(
`Hot loading isn't working because it cannot connect to the development server.

Ensure the following:
- Node server is running and available on the same network
- run 'npm start' from react-native root
- Node server URL is correctly set in AppDelegate

URL: ${host}:${port}

Error: ${e.message}`
      );
    };
    activeWS.onmessage = ({data}) => {
      data = JSON.parse(data);
      if (data.type === 'update') {
        const modules = data.body.modules;
        const sourceMappingURLs = data.body.sourceMappingURLs;
        const sourceURLs = data.body.sourceURLs;

        const RCTRedBox = require('NativeModules').RedBox;
        RCTRedBox && RCTRedBox.dismiss && RCTRedBox.dismiss();

        modules.forEach((code, i) => {
          code = code + '\n\n' + sourceMappingURLs[i];

          require('SourceMapsCache').fetch({
            text: code,
            url: sourceURLs[i],
            sourceMappingURL: sourceMappingURLs[i],
          });

          // on JSC we need to inject from native for sourcemaps to work
          // (Safari doesn't support `sourceMappingURL` nor any variant when
          // evaluating code) but on Chrome we can simply use eval
          const injectFunction = typeof __injectHMRUpdate === 'function'
            ? __injectHMRUpdate
            : eval;

          injectFunction(code, sourceURLs[i]);
        })
        return;
      }

      // TODO: add support for opening filename by clicking on the stacktrace
      const error = data.body;
      throw new Error(error.type + ' ' + error.description);
    };
  },
};

module.exports = HMRClient;
