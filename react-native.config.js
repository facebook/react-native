/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
'use strict';

const ios = require('@react-native-community/cli-platform-ios');
const android = require('@react-native-community/cli-platform-android');

// Remove commands so that react-native-macos can coexist with react-native in repos that depend on both.
const path = require('path');
const isReactNativeMacOS = path.basename(__dirname) === 'react-native-macos';
const iosCommands = isReactNativeMacOS ? [] : ios.commands;
const androidCommands = isReactNativeMacOS ? [] : android.commands;
const macosCommands = [require('./local-cli/runMacOS/runMacOS')];

module.exports = {
  commands: [...iosCommands, ...androidCommands, ...macosCommands],
  platforms: {
    ios: {
      linkConfig: ios.linkConfig,
      projectConfig: ios.projectConfig,
      dependencyConfig: ios.dependencyConfig,
    },
    android: {
      linkConfig: android.linkConfig,
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
      project: './RNTester/RNTesterPods.xcworkspace',
    },
    android: {
      sourceDir: './RNTester',
    },
  },
};
