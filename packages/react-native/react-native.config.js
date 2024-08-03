/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const android = require('@react-native-community/cli-platform-android');
const ios = require('@react-native-community/cli-platform-ios');
const {
  bundleCommand,
  ramBundleCommand,
  startCommand,
} = require('@react-native/community-cli-plugin');

const macosCommands = [require('./local-cli/runMacOS/runMacOS')]; // [macOS]

const codegenCommand = {
  name: 'codegen',
  options: [
    {
      name: '--path <path>',
      description: 'Path to the React Native project root.',
      default: process.cwd(),
    },
    {
      name: '--platform <string>',
      description:
        'Target platform. Supported values: "android", "ios", "all".',
      default: 'all',
    },
    {
      name: '--outputPath <path>',
      description: 'Path where generated artifacts will be output to.',
    },
  ],
  func: (argv, config, args) =>
    require('./scripts/codegen/generate-artifacts-executor').execute(
      args.path,
      args.platform,
      args.outputPath,
    ),
};

module.exports = {
  commands: [
    ...ios.commands,
    ...android.commands,
    ...macosCommands, // [macOS]
    bundleCommand,
    ramBundleCommand,
    startCommand,
    codegenCommand,
  ],
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
      npmPackageName: 'react-native-macos', // [macOS]
    },
  },
};
