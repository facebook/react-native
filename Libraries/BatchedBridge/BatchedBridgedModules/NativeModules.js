/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NativeModules
 */
'use strict';

var NativeModules = require('BatchedBridge').RemoteModules;

// Dirty hack to support old (RK) and new (RCT) native module name conventions
Object.keys(NativeModules).forEach((moduleName) => {
  var rkModuleName = moduleName.replace(/^RCT/, 'RK');
  NativeModules[rkModuleName] = NativeModules[moduleName];
});

module.exports = NativeModules;
