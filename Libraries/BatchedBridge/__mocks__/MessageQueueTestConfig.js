/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * These don't actually exist anywhere in the code.
 *
 * @format
 */

'use strict';
const remoteModulesConfig = [
  ['RemoteModule1', null, ['remoteMethod', 'promiseMethod'], []],
  ['RemoteModule2', null, ['remoteMethod', 'promiseMethod'], []],
];

const MessageQueueTestConfig = {
  remoteModuleConfig: remoteModulesConfig,
};

module.exports = MessageQueueTestConfig;
