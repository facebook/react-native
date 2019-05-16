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
import type {Spec} from './NativeUIManager';

const viewManagerConfigs = {};

interface UIManagerJS extends Spec {
  getViewManagerConfig: (viewManagerName: string) => Object; // probably should move this out, it's overwritten
  createView: (
    reactTag: number,
    viewName: string,
    rootTag: number,
    props: Object,
  ) => void;
  updateView: (reactTag: number, viewName: string, props: Object) => void;
  manageChildren: (
    containerTag: number,
    moveFromIndices: Array<number>,
    moveToIndices: Array<number>,
    addChildReactTags: Array<number>,
    addAtIndices: Array<number>,
    removeAtIndices: Array<number>,
  ) => void;
}

const triedLoadingConfig = new Set();
const UIManager: UIManagerJS = {
  ...NativeUIManager,
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
    if (__DEV__) {
      if (!global.nativeCallSyncHook) {
        return config;
      }
    }

    if (
      NativeUIManager.lazilyLoadView &&
      !triedLoadingConfig.has(viewManagerName)
    ) {
      const result = NativeUIManager.lazilyLoadView(viewManagerName);
      triedLoadingConfig.add(viewManagerName);
      if (result.viewConfig) {
        NativeUIManager.getConstants()[viewManagerName] = result.viewConfig;
        lazifyViewManagerConfig(viewManagerName);
      }
    }

    return viewManagerConfigs[viewManagerName];
  },
};

function lazifyViewManagerConfig(viewName) {
  const viewConfig = NativeUIManager.getConstants()[viewName];
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
  Object.keys(NativeUIManager).forEach(viewName => {
    lazifyViewManagerConfig(viewName);
  });
} else if (NativeUIManager.getConstants().ViewManagerNames) {
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

if (__DEV__) {
  Object.keys(NativeUIManager.getConstants()).forEach(viewManagerName => {
    if (!UIManagerProperties.includes(viewManagerName)) {
      if (!viewManagerConfigs[viewManagerName]) {
        viewManagerConfigs[viewManagerName] = NativeUIManager.getConstants()[
          viewManagerName
        ];
      }
      defineLazyObjectProperty(NativeUIManager, viewManagerName, {
        get: () => {
          console.warn(
            `Accessing view manager configs directly off UIManager via UIManager['${viewManagerName}'] ` +
              `is no longer supported. Use UIManager.getViewManagerConfig('${viewManagerName}') instead.`,
          );
          if (UIManager.getViewManagerConfig) {
            return UIManager.getViewManagerConfig(viewManagerName);
          }
        },
      });
    }
  });
}

module.exports = UIManager;
