/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NativeModules
 */
'use strict';

var NativeModules = require('BatchedBridge').RemoteModules;

var nativeModulePrefixNormalizer = require('nativeModulePrefixNormalizer');

nativeModulePrefixNormalizer(NativeModules);

module.exports = NativeModules;
