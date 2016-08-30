/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * These don't actually exist anywhere in the code.
 */
'use strict';
var remoteModulesConfig = [
  ['RemoteModule1',['remoteMethod1','remoteMethod2'],[],[]],
  ['RemoteModule2',['remoteMethod1','remoteMethod2'],[],[]],
];

var MessageQueueTestConfig = {
  remoteModuleConfig: remoteModulesConfig,
};

module.exports = MessageQueueTestConfig;
