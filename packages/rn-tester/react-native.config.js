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
    // [macOS
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
      npmPackageName: 'react-native-macos',
    },
    // macOS]
  },
  reactNativePath: '../react-native',
  project: {
    ios: {
      sourceDir: '.',
    },
    android: {
      sourceDir: '../../',
    },
  },
};
