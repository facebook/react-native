/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RootTag} from '../Types/RootTagTypes';
import type {UIManagerJSInterface} from '../Types/UIManagerJSInterface';

import NativeUIManager from './NativeUIManager';
import nullthrows from 'nullthrows';

const NativeModules = require('../BatchedBridge/NativeModules');
const defineLazyObjectProperty = require('../Utilities/defineLazyObjectProperty');
const Platform = require('../Utilities/Platform');
const UIManagerProperties = require('./UIManagerProperties');

const viewConfigCache: {[string]: any | null} = {};

const triedLoadingConfig = new Set<string>();

const getUIManagerConstantsCache = (function () {
  let result = {};
  let wasCalledOnce = false;

  return (): Object => {
    if (!wasCalledOnce) {
      result = NativeUIManager.getConstants();
      wasCalledOnce = true;
    }
    return result;
  };
})();

function getViewManagerConfig(viewManagerName: string): any {
  if (
    viewConfigCache[viewManagerName] === undefined &&
    global.nativeCallSyncHook && // If we're in the Chrome Debugger, let's not even try calling the sync method
    NativeUIManager.getConstantsForViewManager
  ) {
    try {
      viewConfigCache[viewManagerName] =
        NativeUIManager.getConstantsForViewManager(viewManagerName);
    } catch (e) {
      console.error(
        "NativeUIManager.getConstantsForViewManager('" +
          viewManagerName +
          "') threw an exception.",
        e,
      );
      viewConfigCache[viewManagerName] = null;
    }
  }

  const config = viewConfigCache[viewManagerName];
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
    const result = nullthrows(NativeUIManager.lazilyLoadView)(viewManagerName);
    triedLoadingConfig.add(viewManagerName);
    if (result != null && result.viewConfig != null) {
      getUIManagerConstantsCache()[viewManagerName] = result.viewConfig;
      viewConfigCache[viewManagerName] = lazifyViewManagerConfig(
        viewManagerName,
        result.viewConfig,
      );
    }
  }

  return viewConfigCache[viewManagerName];
}

// $FlowFixMe[cannot-spread-interface]
const UIManagerJS: UIManagerJSInterface = {
  ...NativeUIManager,
  createView(
    reactTag: number,
    viewName: string,
    rootTag: RootTag,
    props: Object,
  ): void {
    if (Platform.OS === 'ios' && viewConfigCache[viewName] === undefined) {
      // This is necessary to force the initialization of native viewManager
      // classes in iOS when using static ViewConfigs
      getViewManagerConfig(viewName);
    }

    NativeUIManager.createView(reactTag, viewName, rootTag, props);
  },
  getConstants(): Object {
    return getUIManagerConstantsCache();
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

function lazifyViewManagerConfig(viewName: string, viewConfig: Object): Object {
  if (viewConfig.Manager) {
    defineLazyObjectProperty(viewConfig, 'Constants', {
      get: getConstantsFromViewManager,
    });
    defineLazyObjectProperty(viewConfig, 'Commands', {
      get: mapViewManagerMethodsToIndex,
    });
  }

  return viewConfig;

  function getConstantsFromViewManager() {
    const viewManager = NativeModules[viewConfig.Manager];
    const constants: {[string]: mixed} = {};
    if (viewManager) {
      Object.keys(viewManager).forEach(key => {
        const value = viewManager[key];
        if (typeof value !== 'function') {
          constants[key] = value;
        }
      });
    }
    return constants;
  }

  function mapViewManagerMethodsToIndex() {
    const viewManager = NativeModules[viewConfig.Manager];
    const commands: {[string]: number} = {};
    let index = 0;
    if (viewManager) {
      Object.keys(viewManager).forEach(key => {
        const value = viewManager[key];
        if (typeof value === 'function') {
          commands[key] = index++;
        }
      });
    }
    return commands;
  }
}

/**
 * Copies the ViewManager constants and commands into UIManager. This is
 * only needed for iOS, which puts the constants in the ViewManager
 * namespace instead of UIManager, unlike Android.
 */
if (Platform.OS === 'ios') {
  Object.entries(getUIManagerConstantsCache()).forEach(
    ([viewName, viewConfig]) => {
      viewConfigCache[viewName] = lazifyViewManagerConfig(viewName, viewConfig);
    },
  );
} else if (getUIManagerConstantsCache().ViewManagerNames) {
  NativeUIManager.getConstants().ViewManagerNames.forEach(viewManagerName => {
    defineLazyObjectProperty(NativeUIManager, viewManagerName, {
      get: () =>
        nullthrows(NativeUIManager.getConstantsForViewManager)(viewManagerName),
    });
  });
}

if (!global.nativeCallSyncHook) {
  Object.keys(getUIManagerConstantsCache()).forEach(viewManagerName => {
    if (!UIManagerProperties.includes(viewManagerName)) {
      if (!viewConfigCache[viewManagerName]) {
        viewConfigCache[viewManagerName] =
          getUIManagerConstantsCache()[viewManagerName];
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
