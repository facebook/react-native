/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule BatchedBridge
 */
'use strict';

var BatchedBridgeFactory = require('BatchedBridgeFactory');
var MessageQueue = require('MessageQueue');

/**
 * Signature that matches the native IOS modules/methods that are exposed. We
 * indicate which ones accept a callback. The order of modules and methods
 * within them implicitly define their numerical *ID* that will be used to
 * describe method calls across the wire.  This is so that memory is used
 * efficiently and we do not need to copy strings in native land - or across any
 * wire.
 */

var remoteModulesConfig = __fbBatchedBridgeConfig.remoteModuleConfig;
var localModulesConfig = __fbBatchedBridgeConfig.localModulesConfig;


var BatchedBridge = BatchedBridgeFactory.create(
  MessageQueue,
  remoteModulesConfig,
  localModulesConfig
);

BatchedBridge._config = remoteModulesConfig;

module.exports = BatchedBridge;
