/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NativeModules
 */
'use strict';

var NativeModules = require('BatchedBridge').RemoteModules;

var nativeModulePrefixDuplicator = require('nativeModulePrefixDuplicator');

nativeModulePrefixDuplicator(NativeModules);

module.exports = NativeModules;
