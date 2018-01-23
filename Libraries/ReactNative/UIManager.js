/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule UIManager
 * @flow
 * @format
 */
'use strict';

const NativeModules = require('NativeModules');
const Platform = require('Platform');

const defineLazyObjectProperty = require('defineLazyObjectProperty');
const invariant = require('fbjs/lib/invariant');

const {UIManager} = NativeModules;

invariant(
  UIManager,
  'UIManager is undefined. The native module config is probably incorrect.',
);

// In past versions of ReactNative users called UIManager.takeSnapshot()
// However takeSnapshot was moved to ReactNative in order to support flat
// bundles and to avoid a cyclic dependency between UIManager and ReactNative.
// UIManager.takeSnapshot still exists though. In order to avoid confusion or
// accidental usage, mask the method with a deprecation warning.
UIManager.__takeSnapshot = UIManager.takeSnapshot;
UIManager.takeSnapshot = function() {
  invariant(
    false,
    'UIManager.takeSnapshot should not be called directly. ' +
      'Use ReactNative.takeSnapshot instead.',
  );
};

/**
 * Copies the ViewManager constants and commands into UIManager. This is
 * only needed for iOS, which puts the constants in the ViewManager
 * namespace instead of UIManager, unlike Android.
 */
if (Platform.OS === 'ios') {
  Object.keys(UIManager).forEach(viewName => {
    const viewConfig = UIManager[viewName];
    if (viewConfig.Manager) {
      defineLazyObjectProperty(viewConfig, 'Constants', {
        get: () => {
          const viewManager = NativeModules[viewConfig.Manager];
          const constants = {};
          viewManager &&
            Object.keys(viewManager).forEach(key => {
              const value = viewManager[key];
              if (typeof value !== 'function') {
                constants[key] = value;
              }
            });
          return constants;
        },
      });
      defineLazyObjectProperty(viewConfig, 'Commands', {
        get: () => {
          const viewManager = NativeModules[viewConfig.Manager];
          const commands = {};
          let index = 0;
          viewManager &&
            Object.keys(viewManager).forEach(key => {
              const value = viewManager[key];
              if (typeof value === 'function') {
                commands[key] = index++;
              }
            });
          return commands;
        },
      });
    }
  });
} else if (Platform.OS === 'android' && UIManager.ViewManagerNames) {
  UIManager.ViewManagerNames.forEach(viewManagerName => {
    defineLazyObjectProperty(UIManager, viewManagerName, {
      get: () => UIManager.getConstantsForViewManager(viewManagerName),
    });
  });
}

module.exports = UIManager;
