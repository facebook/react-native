/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule HMRClient
 * @format
 * @flow
 */
'use strict';

const Platform = require('Platform');
const invariant = require('fbjs/lib/invariant');

const MetroHMRClient = require('metro/src/lib/bundle-modules/HMRClient');

/**
 * HMR Client that receives from the server HMR updates and propagates them
 * runtime to reflects those changes.
 */
const HMRClient = {
  enable(platform: string, bundleEntry: string, host: string, port: number) {
    invariant(platform, 'Missing required parameter `platform`');
    invariant(bundleEntry, 'Missing required paramenter `bundleEntry`');
    invariant(host, 'Missing required paramenter `host`');

    // Moving to top gives errors due to NativeModules not being initialized
    const HMRLoadingView = require('HMRLoadingView');

    const wsHostPort = port !== null && port !== '' ? `${host}:${port}` : host;

    bundleEntry = bundleEntry.replace(/\.(bundle|delta)/, '.js');

    // Build the websocket url
    const wsUrl =
      `ws://${wsHostPort}/hot?` +
      `platform=${platform}&` +
      `bundleEntry=${bundleEntry}`;

    const hmrClient = new MetroHMRClient(wsUrl);

    hmrClient.on('connection-error', e => {
      let error = `Hot loading isn't working because it cannot connect to the development server.

Try the following to fix the issue:
- Ensure that the packager server is running and available on the same network`;

      if (Platform.OS === 'ios') {
        error += `
- Ensure that the Packager server URL is correctly set in AppDelegate`;
      } else {
        error += `
- Ensure that your device/emulator is connected to your machine and has USB debugging enabled - run 'adb devices' to see a list of connected devices
- If you're on a physical device connected to the same machine, run 'adb reverse tcp:8081 tcp:8081' to forward requests from your device
- If your device is on the same Wi-Fi network, set 'Debug server host & port for device' in 'Dev settings' to your machine's IP address and the port of the local dev server - e.g. 10.0.1.1:8081`;
      }

      error += `

URL: ${host}:${port}

Error: ${e.message}`;

      throw new Error(error);
    });

    hmrClient.on('update-start', () => {
      HMRLoadingView.showMessage('Hot Loading...');
    });

    hmrClient.on('update', () => {
      if (Platform.OS === 'ios') {
        const RCTRedBox = require('NativeModules').RedBox;
        RCTRedBox && RCTRedBox.dismiss && RCTRedBox.dismiss();
      } else {
        const RCTExceptionsManager = require('NativeModules').ExceptionsManager;
        RCTExceptionsManager &&
          RCTExceptionsManager.dismissRedbox &&
          RCTExceptionsManager.dismissRedbox();
      }
    });

    hmrClient.on('update-done', () => {
      HMRLoadingView.hide();
    });

    hmrClient.on('error', data => {
      HMRLoadingView.hide();
      throw new Error(`${data.type} ${data.message}`);
    });

    hmrClient.enable();
  },
};

module.exports = HMRClient;
