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
        require('./Devtools/setupDevtools');
      }

      // Set up inspector
      const JSInspector = require('../JSInspector/JSInspector');
      JSInspector.registerAgent(require('../JSInspector/NetworkAgent'));
    }

    if (!Platform.isTesting) {
      const logToConsole = require('./Devtools/logToConsole');
      ['log', 'warn', 'info', 'trace'].forEach(level => {
        const originalFunction = console[level];
        // $FlowFixMe Overwrite console methods
        console[level] = function(...args) {
          logToConsole(level, args);
          originalFunction.apply(console, args);
        };
      });
    }

    require('./setUpReactRefresh');
  }
}
