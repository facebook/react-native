/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const NativeModules = require('../BatchedBridge/NativeModules');
const Platform = require('../Utilities/Platform');
const UIManagerProperties = require('./UIManagerProperties');

const defineLazyObjectProperty = require('../Utilities/defineLazyObjectProperty');

import NativeUIManager from './NativeUIManager';

const viewManagerConfigs = {};

const triedLoadingConfig = new Set();

let NativeUIManagerConstants = {};
let isNativeUIManagerConstantsSet = false;
function getConstants(): Object {
  if (!isNativeUIManagerConstantsSet) {
    NativeUIManagerConstants = NativeUIManager.getConstants();
    isNativeUIManagerConstantsSet = true;
  }
  return NativeUIManagerConstants;
}

const UIManagerJS = {
  ...NativeUIManager,
  getConstants(): Object {
    return getConstants();
  },
  getViewManagerConfig: function(viewManagerName: string) {
    if (
      viewManagerConfigs[viewManagerName] === undefined &&
      NativeUIManager.getConstantsForViewManager
    ) {
      try {
        viewManagerConfigs[
          viewManagerName
        ] = NativeUIManager.getConstantsForViewManager(viewManagerName);
      } catch (e) {
        viewManagerConfigs[viewManagerName] = null;
      }
    }

    const config = viewManagerConfigs[viewManagerName];
    if (config) {
      return config;
    }

    // If we're in the Chrome Debugger, let's not even try calling the sync
    // method.
    if (!global.nativeCallSyncHook) {
      return config;
    }

    if (
      NativeUIManager.lazilyLoadView &&
      !triedLoadingConfig.has(viewManagerName)
    ) {
      const result = NativeUIManager.lazilyLoadView(viewManagerName);
      triedLoadingConfig.add(viewManagerName);
      if (result.viewConfig) {
        getConstants()[viewManagerName] = result.viewConfig;
        lazifyViewManagerConfig(viewManagerName);
      }
    }

    return viewManagerConfigs[viewManagerName];
  },
};

// TODO (T45220498): Remove this.
// 3rd party libs may be calling `NativeModules.UIManager.getViewManagerConfig()`
// instead of `UIManager.getViewManagerConfig()` off UIManager.js.
// This is a workaround for now.
// $FlowFixMe
NativeUIManager.getViewManagerConfig = UIManagerJS.getViewManagerConfig;

function lazifyViewManagerConfig(viewName) {
  const viewConfig = getConstants()[viewName];
  if (viewConfig.Manager) {
    viewManagerConfigs[viewName] = viewConfig;
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
}

/**
 * Copies the ViewManager constants and commands into UIManager. This is
 * only needed for iOS, which puts the constants in the ViewManager
 * namespace instead of UIManager, unlike Android.
 */
if (Platform.OS === 'ios') {
  Object.keys(getConstants()).forEach(viewName => {
    lazifyViewManagerConfig(viewName);
  });
} else if (getConstants().ViewManagerNames) {
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
      UIManager.getConstants().ViewManagerNames.forEach(viewManagerName => {
        defineLazyObjectProperty(UIManager, viewManagerName, {
          get: () => UIManager.getConstantsForViewManager(viewManagerName),
        });
      });
    },
    NativeUIManager,
    defineLazyObjectProperty,
  );

  // As Prepack now no longer knows which properties exactly the UIManager has,
  // we also tell Prepack that it has only partial knowledge of the UIManager,
  // so that any accesses to unknown properties along the global code will fail
  // when Prepack encounters them.
  if (global.__makePartial) {
    global.__makePartial(NativeUIManager);
  }
}

if (!global.nativeCallSyncHook) {
  Object.keys(getConstants()).forEach(viewManagerName => {
    if (!UIManagerProperties.includes(viewManagerName)) {
      if (!viewManagerConfigs[viewManagerName]) {
        viewManagerConfigs[viewManagerName] = getConstants()[viewManagerName];
      }
      defineLazyObjectProperty(NativeUIManager, viewManagerName, {
        get: () => {
          console.warn(
            `Accessing view manager configs directly off UIManager via UIManager['${viewManagerName}'] ` +
              `is no longer supported. Use UIManager.getViewManagerConfig('${viewManagerName}') instead.`,
          );

          return UIManagerJS.getViewManagerConfig(viewManagerName);
        },
      });
    }
  });
}

module.exports = UIManagerJS;
