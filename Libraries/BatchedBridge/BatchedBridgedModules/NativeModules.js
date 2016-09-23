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
