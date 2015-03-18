/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule nativeModulePrefixNormalizer
 */
'use strict';

// Dirty hack to support old (RK) and new (RCT) native module name conventions
function nativeModulePrefixNormalizer(modules) {
  Object.keys(modules).forEach((moduleName) => {
    var strippedName = moduleName.replace(/^(RCT|RK)/, '');
    if (modules['RCT' + strippedName] && modules['RK' + strippedName]) {
      throw new Error(
        'Module cannot be registered as both RCT and RK: ' + moduleName
      );
    }
    if (strippedName !== moduleName) {
      modules[strippedName] = modules[moduleName];
      delete modules[moduleName];
    }
  });
}

module.exports = nativeModulePrefixNormalizer;
