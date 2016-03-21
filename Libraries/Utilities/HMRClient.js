/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule HMRClient
 * @flow
 */
'use strict';

const Platform = require('Platform');
const invariant = require('fbjs/lib/invariant');

/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
const HMRClient = {
  enable(platform: string, bundleEntry: string, host: string, port: number) {
    invariant(platform, 'Missing required parameter `platform`');
    invariant(bundleEntry, 'Missing required paramenter `bundleEntry`');
    invariant(host, 'Missing required paramenter `host`');

    // need to require WebSocket inside of `enable` function because
    // this module is defined as a `polyfillGlobal`.
    // See `InitializeJavascriptAppEngine.js`
    const WebSocket = require('WebSocket');

    const wsHostPort = port !== null && port !== ''
      ? `${host}:${port}`
      : host;

    // Build the websocket url
    const wsUrl = `ws://${wsHostPort}/hot?` +
      `platform=${platform}&` +
      `bundleEntry=${bundleEntry.replace('.bundle', '.js')}`;

    const activeWS = new WebSocket(wsUrl);
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
      // Moving to top gives errors due to NativeModules not being initialized
      const HMRLoadingView = require('HMRLoadingView');

      data = JSON.parse(data);

      switch (data.type) {
        case 'update-start': {
          HMRLoadingView.showMessage('Hot Loading...');
          break;
        }
        case 'update': {
          const {
            modules,
            sourceMappingURLs,
            sourceURLs,
            inverseDependencies,
          } = data.body;

          if (Platform.OS === 'ios') {
            const RCTRedBox = require('NativeModules').RedBox;
            RCTRedBox && RCTRedBox.dismiss && RCTRedBox.dismiss();
          } else {
            const RCTExceptionsManager = require('NativeModules').ExceptionsManager;
            RCTExceptionsManager && RCTExceptionsManager.dismissRedbox && RCTExceptionsManager.dismissRedbox();
          }

          modules.forEach(({name, code}, i) => {
            code = code + '\n\n' + sourceMappingURLs[i];

            require('SourceMapsCache').fetch({
              text: code,
              url: sourceURLs[i],
              sourceMappingURL: sourceMappingURLs[i],
            });

            // on JSC we need to inject from native for sourcemaps to work
            // (Safari doesn't support `sourceMappingURL` nor any variant when
            // evaluating code) but on Chrome we can simply use eval
            const injectFunction = typeof global.nativeInjectHMRUpdate === 'function'
              ? global.nativeInjectHMRUpdate
              : eval;

            code = [
              `__accept(`,
                `${name},`,
                `function(global,require,module,exports){`,
                  `${code}`,
                '\n},',
                `${JSON.stringify(inverseDependencies)}`,
              `);`,
            ].join('');

            injectFunction(code, sourceURLs[i]);
          });

          HMRLoadingView.hide();
          break;
        }
        case 'update-done': {
          HMRLoadingView.hide();
          break;
        }
        case 'error': {
          HMRLoadingView.hide();
          throw new Error(data.body.type + ' ' + data.body.description);
        }
        default: {
          throw new Error(`Unexpected message: ${data}`);
        }
      }
    };
  },
};

module.exports = HMRClient;
