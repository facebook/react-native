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

// 导出 MessageQueue 中的 RemoteModules 属性变量并赋值给 NativeModules 变量
var NativeModules = require('BatchedBridge').RemoteModules;

var nativeModulePrefixNormalizer = require('nativeModulePrefixNormalizer');

nativeModulePrefixNormalizer(NativeModules);

module.exports = NativeModules;