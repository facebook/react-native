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
      projectConfig: ios.projectConfig,
      dependencyConfig: ios.dependencyConfig,
    },
    android: {
      projectConfig: android.projectConfig,
      dependencyConfig: android.dependencyConfig,
    },
    macos: {
      linkConfig: () => {
        return {
          isInstalled: (
            _projectConfig /*ProjectConfig*/,
            _package /*string*/,
            _dependencyConfig /*DependencyConfig*/,
          ) => false /*boolean*/,
          register: (
            _package /*string*/,
            _dependencyConfig /*DependencyConfig*/,
            _obj /*Object*/,
            _projectConfig /*ProjectConfig*/,
          ) => {},
          unregister: (
            _package /*string*/,
            _dependencyConfig /*DependencyConfig*/,
            _projectConfig /*ProjectConfig*/,
            _dependencyConfigs /*Array<DependencyConfig>*/,
          ) => {},
          copyAssets: (
            _assets /*string[]*/,
            _projectConfig /*ProjectConfig*/,
          ) => {},
          unlinkAssets: (
            _assets /*string[]*/,
            _projectConfig /*ProjectConfig*/,
          ) => {},
        };
      },
      projectConfig: () => null,
      dependencyConfig: () => null,
      npmPackageName: isReactNativeMacOS
        ? 'react-native-macos'
        : 'react-native',
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
