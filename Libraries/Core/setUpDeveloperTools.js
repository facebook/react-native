/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */
'use strict';

import Platform from '../Utilities/Platform';

/**
 * Sets up developer tools for React Native.
 * You can use this module directly, or just require InitializeCore.
 */
if (__DEV__) {
  // TODO (T45803484) Enable devtools for bridgeless RN
  if (!global.RN$Bridgeless) {
    if (!global.__RCTProfileIsProfiling) {
      // not when debugging in chrome
      // TODO(t12832058) This check is broken
      if (!window.document) {
        const AppState = require('../AppState/AppState');
        // $FlowFixMe Module is untyped
        const reactDevTools = require('react-devtools-core');
        const getDevServer = require('./Devtools/getDevServer');

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
          resolveRNStyle: require('../StyleSheet/flattenStyle'),
        });
      }

      // Set up inspector
      const JSInspector = require('../JSInspector/JSInspector');
      JSInspector.registerAgent(require('../JSInspector/NetworkAgent'));
    }

    if (!Platform.isTesting) {
      const HMRClient = require('../Utilities/HMRClient');
      [
        'trace',
        'info',
        'warn',
        'log',
        'group',
        'groupCollapsed',
        'groupEnd',
        'debug',
      ].forEach(level => {
        const originalFunction = console[level];
        // $FlowFixMe Overwrite console methods
        console[level] = function(...args) {
          HMRClient.log(level, args);
          originalFunction.apply(console, args);
        };
      });
    }

    require('./setUpReactRefresh');
  }
}
