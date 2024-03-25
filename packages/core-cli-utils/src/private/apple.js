/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {Task} from './types';

import {assertDependencies, isOnPath, task} from './utils';
import execa from 'execa';

type AppleBuildMode = 'Debug' | 'Release';

type AppleBuildOptions = {
  isWorkspace: boolean,
  name: string,
  mode: AppleBuildMode,
  scheme: string,
  destination?: string, // Device or Simulator or UUID
} & AppleOptions;

type AppleBootstrapOption = {
  bundleInstall: boolean,
  // Enabled by default
  newArchitecture: boolean,
} & AppleOptions;

type AppleInstallApp = {
  device: string,
  appPath: string,
} & AppleOptions;

type AppleOptions = {cwd: string, env?: {[key: string]: string | void, ...}};

type AppleBuildTasks = {
  bootstrap: (options: AppleBootstrapOption) => Task[],
  build: (
    options: AppleBuildOptions,
    ...args: $ReadOnlyArray<string>
  ) => Task[],
  ios: {
    install: (options: AppleInstallApp) => Task[],
  },
};

export const tasks: AppleBuildTasks = {
  bootstrap: (options: AppleBootstrapOption) => [
    task('Install CocoaPods dependencies', async () => {
      assertDependencies(
        isOnPath('pod', 'CocoaPods'),
        isOnPath('bundle', "Bundler to manage Ruby's gems"),
      );

      if (options.bundleInstall) {
        await execa('bundle', ['exec', 'install'], {
          cwd: options.cwd,
        });
      }

      return await execa('bundle', ['exec', 'pod', 'install'], {
        cwd: options.cwd,
        env: {RCT_NEW_ARCH_ENABLED: options.newArchitecture ? '1' : '0'},
      });
    }),
  ],

  build: (options: AppleBuildOptions, ...args: $ReadOnlyArray<string>) => [
    task('build an app artifact', () => {
      assertDependencies(isOnPath('xcodebuild', 'Xcode Commandline Tools'));
      const _args = [
        options.isWorkspace ? '-workspace' : '-project',
        options.name,
        '-scheme',
        options.scheme,
      ];
      if (options.destination != null) {
        _args.push('-destination', options.destination);
      }
      _args.push(...args);
      return execa('xcodebuild', _args, {cwd: options.cwd, env: options.env});
    }),
  ],

  ios: {
    install: (options: AppleInstallApp) => [
      task('Install the app on a simulator', () => {
        assertDependencies(
          isOnPath('xcrun', 'An Xcode Commandline tool: xcrun'),
        );
        return execa(
          'xcrun',
          ['simctl', 'install', options.device, options.appPath],
          {cwd: options.cwd, env: options.env},
        );
      }),
    ],
  },
};
