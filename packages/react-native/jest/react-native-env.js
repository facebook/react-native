/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

const NodeEnv = require('jest-environment-node').TestEnvironment;

module.exports = class ReactNativeEnv extends NodeEnv {
  customExportConditions = ['require', 'react-native'];
};
