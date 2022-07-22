/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RootTag} from 'react-native/Libraries/Types/RootTagTypes';

import NativeUIManager from './NativeUIManager';

const NativeModules = require('../BatchedBridge/NativeModules');
const defineLazyObjectProperty = require('../Utilities/defineLazyObjectProperty');
const Platform = require('../Utilities/Platform');
const UIManagerProperties = require('./UIManagerProperties');

const viewManagerConfigs: {[string]: any | null} = {};

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

function getViewManagerConfig(viewManagerName: string): any {
  if (
    viewManagerConfigs[viewManagerName] === undefined &&
    global.nativeCallSyncHook && // If we're in the Chrome Debugger, let's not even try calling the sync method
    NativeUIManager.getConstantsForViewManager
  ) {
    try {
      viewManagerConfigs[viewManagerName] =
        NativeUIManager.getConstantsForViewManager(viewManagerName);
    } catch (e) {
      console.error(
        "NativeUIManager.getConstantsForViewManager('" +
          viewManagerName +
          "') threw an exception.",
        e,
      );
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
    if (result != null && result.viewConfig != null) {
      getConstants()[viewManagerName] = result.viewConfig;
      lazifyViewManagerConfig(viewManagerName);
    }
  }

  return viewManagerConfigs[viewManagerName];
}

/* $FlowFixMe[cannot-spread-interface] (>=0.123.0 site=react_native_fb) This
 * comment suppresses an error found when Flow v0.123.0 was deployed. To see
 * the error, delete this comment and run Flow. */
const UIManagerJS = {
  ...NativeUIManager,
  createView(
    reactTag: ?number,
    viewName: string,
    rootTag: RootTag,
    props: Object,
  ): void {
    if (Platform.OS === 'ios' && viewManagerConfigs[viewName] === undefined) {
      // This is necessary to force the initialization of native viewManager
      // classes in iOS when using static ViewConfigs
      getViewManagerConfig(viewName);
    }

    NativeUIManager.createView(reactTag, viewName, rootTag, props);
  },
  getConstants(): Object {
    return getConstants();
  },
  getViewManagerConfig(viewManagerName: string): any {
    return getViewManagerConfig(viewManagerName);
  },
  hasViewManagerConfig(viewManagerName: string): boolean {
    return getViewManagerConfig(viewManagerName) != null;
  },
};

// TODO (T45220498): Remove this.
// 3rd party libs may be calling `NativeModules.UIManager.getViewManagerConfig()`
// instead of `UIManager.getViewManagerConfig()` off UIManager.js.
// This is a workaround for now.
// $FlowFixMe[prop-missing]
NativeUIManager.getViewManagerConfig = UIManagerJS.getViewManagerConfig;

function lazifyViewManagerConfig(viewName: string) {
  const viewConfig = getConstants()[viewName];
  viewManagerConfigs[viewName] = viewConfig;
  if (viewConfig.Manager) {
    defineLazyObjectProperty(viewConfig, 'Constants', {
      get: () => {
        const viewManager = NativeModules[viewConfig.Manager];
        const constants: {[string]: mixed} = {};
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
        const commands: {[string]: number} = {};
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
  NativeUIManager.getConstants().ViewManagerNames.forEach(viewManagerName => {
    defineLazyObjectProperty(NativeUIManager, viewManagerName, {
      get: () => NativeUIManager.getConstantsForViewManager(viewManagerName),
    });
  });
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
