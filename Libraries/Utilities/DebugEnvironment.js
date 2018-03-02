/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule DebugEnvironment
 * @flow
 */

'use strict';

module.exports = {
  // When crippled, synchronous JS function calls to native will fail.
  isCrippledMode: __DEV__ && !global.nativeCallSyncHook,
};
