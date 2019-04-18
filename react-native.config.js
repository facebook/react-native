/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const {
  commands: iOSCommands,
  ...ios
} = require('@react-native-community/cli-platform-ios');
const {
  commands: androidCommands,
  ...android
} = require('@react-native-community/cli-platform-android');

module.exports = {
  reactNativePath: '.',
  commands: [...iOSCommands, ...androidCommands],
  platforms: {ios, android},
  project: {
    ios: {
      project: './RNTester/RNTester.xcodeproj',
    },
    android: {
      sourceDir: './RNTester',
    },
  },
};
