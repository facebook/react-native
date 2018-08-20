/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
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
} else if (UIManager.ViewManagerNames) {
  // We want to add all the view managers to the UIManager.
  // However, the way things are set up, the list of view managers is not known at compile time.
  // As Prepack runs at compile it, it cannot process this loop.
  // So we wrap it in a special __residual call, which basically tells Prepack to ignore it.
  let residual = global.__residual
    ? global.__residual
    : (_, f, ...args) => f.apply(undefined, args);
  residual(
    'void',
    (UIManager, defineLazyObjectProperty) => {
      UIManager.ViewManagerNames.forEach(viewManagerName => {
        defineLazyObjectProperty(UIManager, viewManagerName, {
          get: () => UIManager.getConstantsForViewManager(viewManagerName),
        });
      });
    },
    UIManager,
    defineLazyObjectProperty,
  );

  // As Prepack now no longer knows which properties exactly the UIManager has,
  // we also tell Prepack that it has only partial knowledge of the UIManager,
  // so that any accesses to unknown properties along the global code will fail
  // when Prepack encounters them.
  if (global.__makePartial) global.__makePartial(UIManager);
}

module.exports = UIManager;
