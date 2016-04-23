/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NativeModules
 * @flow
 */
'use strict';

const BatchedBridge = require('BatchedBridge');
const RemoteModules = BatchedBridge.RemoteModules;

function normalizePrefix(moduleName: string): string {
  return moduleName.replace(/^(RCT|RK)/, '');
}

/**
 * Dirty hack to support old (RK) and new (RCT) native module name conventions.
 */
Object.keys(RemoteModules).forEach((moduleName) => {
  const strippedName = normalizePrefix(moduleName);
  if (RemoteModules['RCT' + strippedName] && RemoteModules['RK' + strippedName]) {
    throw new Error(
      'Module cannot be registered as both RCT and RK: ' + moduleName
    );
  }
  if (strippedName !== moduleName) {
    RemoteModules[strippedName] = RemoteModules[moduleName];
    delete RemoteModules[moduleName];
  }
});

/**
 * Define lazy getters for each module.
 * These will return the module if already loaded, or load it if not.
 */
const NativeModules = {};
Object.keys(RemoteModules).forEach((moduleName) => {
  Object.defineProperty(NativeModules, moduleName, {
    configurable: true,
    enumerable: true,
    get: () => {
      let module = RemoteModules[moduleName];
      if (module && typeof module.moduleID === 'number' && global.nativeRequireModuleConfig) {
        const json = global.nativeRequireModuleConfig(moduleName);
        const config = json && JSON.parse(json);
        module = config && BatchedBridge.processModuleConfig(config, module.moduleID);
        RemoteModules[moduleName] = module;
      }
      return module;
    },
  });
});

/**
 * Copies the ViewManager constants and commands into UIManager. This is
 * only needed for iOS, which puts the constants in the ViewManager
 * namespace instead of UIManager, unlike Android.
 *
 * We'll eventually move this logic to UIManager.js, once all
 * the call sites accessing NativeModules.UIManager directly have
 * been removed #9344445
 */
const UIManager = NativeModules.UIManager;
UIManager && Object.keys(UIManager).forEach(viewName => {
  const viewConfig = UIManager[viewName];
  if (viewConfig.Manager) {
    let constants;
    /* $FlowFixMe - nice try. Flow doesn't like getters */
    Object.defineProperty(viewConfig, 'Constants', {
      configurable: true,
      enumerable: true,
      get: () => {
        if (constants) {
          return constants;
        }
        constants = {};
        const viewManager = NativeModules[normalizePrefix(viewConfig.Manager)];
        viewManager && Object.keys(viewManager).forEach(key => {
          const value = viewManager[key];
          if (typeof value !== 'function') {
            constants[key] = value;
          }
        });
        return constants;
      },
    });
    let commands;
    /* $FlowFixMe - nice try. Flow doesn't like getters */
    Object.defineProperty(viewConfig, 'Commands', {
      configurable: true,
      enumerable: true,
      get: () => {
        if (commands) {
          return commands;
        }
        commands = {};
        const viewManager = NativeModules[normalizePrefix(viewConfig.Manager)];
        viewManager && Object.keys(viewManager).forEach((key, index) => {
          const value = viewManager[key];
          if (typeof value === 'function') {
            commands[key] = index;
          }
        });
        return commands;
      },
    });
  }
});

module.exports = NativeModules;
