/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

type DevToolsPluginConnection = {
  isAppActive: () => boolean,
  host: string,
  port: number,
};

type DevToolsPlugin = {
  connectToDevTools: (connection: DevToolsPluginConnection) => void,
};

let register = function() {
  // noop
};

if (__DEV__) {
  const AppState = require('AppState');
  const WebSocket = require('WebSocket');
  /* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an
   * error found when Flow v0.54 was deployed. To see the error delete this
   * comment and run Flow. */
  const reactDevTools = require('react-devtools-core');
  const getDevServer = require('getDevServer');

  // Initialize dev tools only if the native module for WebSocket is available
  if (WebSocket.isAvailable) {
    // Don't steal the DevTools from currently active app.
    // Note: if you add any AppState subscriptions to this file,
    // you will also need to guard against `AppState.isAvailable`,
    // or the code will throw for bundles that don't have it.
    const isAppActive = () => AppState.currentState !== 'background';

    // Get hostname from development server (packager)
    const devServer = getDevServer();
    const host = devServer.bundleLoadedFromServer
      ? devServer.url.replace(/https?:\/\//, '').split(':')[0]
      : 'localhost';

    reactDevTools.connectToDevTools({
      isAppActive,
      host,
      // Read the optional global variable for backward compatibility.
      // It was added in https://github.com/facebook/react-native/commit/bf2b435322e89d0aeee8792b1c6e04656c2719a0.
      port: window.__REACT_DEVTOOLS_PORT__,
      resolveRNStyle: require('flattenStyle'),
    });
  }
}

module.exports = {
  register,
};
