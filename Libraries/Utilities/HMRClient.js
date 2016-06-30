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
      let error = (
`Hot loading isn't working because it cannot connect to the development server.

Try the following to fix the issue:
- Ensure that the packager server is running and available on the same network`
      );

      if (Platform.OS === 'ios') {
        error += (
`
- Ensure that the Packager server URL is correctly set in AppDelegate`
        );
      } else {
        error += (
`
- Ensure that your device/emulator is connected to your machine and has USB debugging enabled - run 'adb devices' to see a list of connected devices
- If you're on a physical device connected to the same machine, run 'adb reverse tcp:8081 tcp:8081' to forward requests from your device
- If your device is on the same Wi-Fi network, set 'Debug server host & port for device' in 'Dev settings' to your machine's IP address and the port of the local dev server - e.g. 10.0.1.1:8081`
        );
      }

      error += (
`

URL: ${host}:${port}

Error: ${e.message}`
      );

      throw new Error(error);
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

          modules.forEach(({id, code}, i) => {
            code = code + '\n\n' + sourceMappingURLs[i];

            // on JSC we need to inject from native for sourcemaps to work
            // (Safari doesn't support `sourceMappingURL` nor any variant when
            // evaluating code) but on Chrome we can simply use eval
            const injectFunction = typeof global.nativeInjectHMRUpdate === 'function'
              ? global.nativeInjectHMRUpdate
              : eval;

            code = [
              `__accept(`,
                `${id},`,
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
