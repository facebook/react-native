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

let register = function() {
  // noop
};

if (__DEV__) {
  const AppState = require('../../AppState/AppState');
  const reactDevTools = require('react-devtools-core');
  const getDevServer = require('./getDevServer');

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
    resolveRNStyle: require('../../StyleSheet/flattenStyle'),
  });
}

module.exports = {
  register,
};
