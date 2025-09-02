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

const path = require('path');

const config = {
  appPath: path.resolve(__dirname, '.'),
  reactNativePath: path.resolve(__dirname, '..', '..', 'packages', 'react-native'),
  appXcodeProject: 'RNTesterPods.xcodeproj',
  targetName: 'RNTester',
  additionalPackages: [
    {
      relativePath: '../rn-tester',
      targets: ['NativeComponentExample', 'NativeCxxModuleExample'],
    },
    {
      relativePath: '../react-native/Libraries',
      targets: ['PushNotification'],
    },
  ],
}

module.exports = config;
