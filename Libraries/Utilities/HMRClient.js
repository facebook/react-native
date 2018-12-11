/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */
'use strict';

const Platform = require('Platform');
const invariant = require('invariant');

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

    /* $FlowFixMe(>=0.84.0 site=react_native_fb) This comment suppresses an
     * error found when Flow v0.84 was deployed. To see the error, delete this
     * comment and run Flow. */
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

      if (data.type === 'GraphNotFoundError') {
        hmrClient.disable();
        throw new Error(
          'The packager server has restarted since the last Hot update. Hot Reloading will be disabled until you reload the application.',
        );
      } else if (data.type === 'RevisionNotFoundError') {
        hmrClient.disable();
        throw new Error(
          'The packager server and the client are out of sync. Hot Reloading will be disabled until you reload the application.',
        );
      } else {
        throw new Error(`${data.type} ${data.message}`);
      }
    });

    hmrClient.on('close', data => {
      HMRLoadingView.hide();
      throw new Error(
        'Disconnected from the packager server. Hot Reloading will be disabled until you reload the application.',
      );
    });

    hmrClient.enable();
  },
};

module.exports = HMRClient;
