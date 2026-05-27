/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const reactNativeModules = require('./react-native-modules');

module.exports = {
  meta: {
    name: '@react-native/eslint-plugin-specs',
    version: require('./package.json').version,
  },
  rules: {
    'react-native-modules': reactNativeModules,
  },
};
