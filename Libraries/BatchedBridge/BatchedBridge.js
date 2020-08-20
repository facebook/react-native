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

let MessageQueue = require('MessageQueue');

let BatchedBridge = new MessageQueue(
    __fbBatchedBridgeConfig.remoteModuleConfig, // MessageQueue 中的 RemoteModules 属性，map 类型
    __fbBatchedBridgeConfig.localModulesConfig,
);

module.exports = BatchedBridge;