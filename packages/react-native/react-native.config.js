/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const ios = require('@react-native-community/cli-platform-ios');
const android = require('@react-native-community/cli-platform-android');

module.exports = {
  commands: [...ios.commands, ...android.commands],
  platforms: {
    ios: {
      projectConfig: ios.projectConfig,
      dependencyConfig: ios.dependencyConfig,
    },
    android: {
      projectConfig: android.projectConfig,
      dependencyConfig: android.dependencyConfig,
    },
  },
  /**
   * Used when running RNTester (with React Native from source)
   */
  reactNativePath: '.',
  project: {
    ios: {
      sourceDir: '../packages/rn-tester',
    },
    android: {
      sourceDir: '../packages/rn-tester',
    },
  },
};
