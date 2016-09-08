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
 * TODO 10487027: kill this behaviour
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
        const config = global.nativeRequireModuleConfig(moduleName);
        module = config && BatchedBridge.processModuleConfig(config, module.moduleID);
        RemoteModules[moduleName] = module;
      }
      Object.defineProperty(NativeModules, moduleName, {
        configurable: true,
        enumerable: true,
        value: module,
      });
      return module;
    },
  });
});

module.exports = NativeModules;
