/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * These don't actually exist anywhere in the code.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {ModuleConfig} from '../NativeModules';

const remoteModulesConfig: $ReadOnlyArray<ModuleConfig> = [
  [
    'RemoteModule1',
    null,
    ['remoteMethod', 'promiseMethod', 'promiseReturningMethod', 'syncMethod'],
    [2 /* promiseReturningMethod */],
    [3 /* syncMethod */],
  ],
  [
    'RemoteModule2',
    null,
    ['remoteMethod', 'promiseMethod', 'promiseReturningMethod', 'syncMethod'],
    [2 /* promiseReturningMethod */],
    [3 /* syncMethod */],
  ],
];

const MessageQueueTestConfig = {
  remoteModuleConfig: remoteModulesConfig,
};

module.exports = MessageQueueTestConfig;
