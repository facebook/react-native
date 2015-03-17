/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule nativeModulePrefixDuplicator
 */
'use strict';

// Dirty hack to support old (RK) and new (RCT) native module name conventions
function nativeModulePrefixDuplicator(modules) {
  Object.keys(modules).forEach((moduleName) => {
    var rkModuleName = moduleName.replace(/^RCT/, 'RK');
    var rctModuleName = moduleName.replace(/^RK/, 'RCT');
    if (rkModuleName !== rctModuleName) {
      if (modules[rkModuleName] && modules[rctModuleName]) {
        throw new Error(
          'Module cannot be registered as both RCT and RK: ' + moduleName
        );
      }
      modules[rkModuleName] = modules[moduleName];
      modules[rctModuleName] = modules[moduleName];
    }
  });
}

module.exports = nativeModulePrefixDuplicator;
