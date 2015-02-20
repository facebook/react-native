/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NativeModulesDeprecated
 */
'use strict';

var RemoteModulesDeprecated = require('BatchedBridge').RemoteModulesDeprecated;

// Dirty hack to support old (RK) and new (RCT) native module name conventions
Object.keys(RemoteModulesDeprecated).forEach((moduleName) => {
  var rkModuleName = moduleName.replace(/^RCT/, 'RK');
  RemoteModulesDeprecated[rkModuleName] = RemoteModulesDeprecated[moduleName];
});

module.exports = RemoteModulesDeprecated;
