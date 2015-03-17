/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NativeModulesDeprecated
 */
'use strict';

var NativeModulesDeprecated = require('BatchedBridge').RemoteModulesDeprecated;

var nativeModulePrefixDuplicator = require('nativeModulePrefixDuplicator');

nativeModulePrefixDuplicator(NativeModulesDeprecated);

module.exports = NativeModulesDeprecated;
