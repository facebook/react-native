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

type iOSBuildMode = 'Debug' | 'Release';

type iOSBuildOptions = {
  isWorkspace: boolean,
  name: string,
  mode: iOSBuildMode,
  scheme: string,
  destination?: string, // Device or Simulator or UUID
} & iOSOptions;

type iOSBootstrapOption = {
  // Enabled by default
  newArchitecture: boolean,
} & iOSOptions;

type iOSInstallApp = {
  device: string,
  appPath: string,
} & iOSOptions;

type SemVer = string;

type AutolinkPackage = {
  name: string,
  version: SemVer,
};

type iOSAutoLinkOptions = {
  packages: Array<AutolinkPackage>,
} & iOSOptions;

type iOSOptions = {cwd: string, env?: {[key: string]: string | void, ...}};

type iOSBuildTasks = {
  bootstrap: (options: iOSBootstrapOption) => Task[],
  build: (options: iOSBuildOptions, ...args: $ReadOnlyArray<string>) => Task[],
  install: (options: iOSInstallApp) => Task[],
  autolink: (options: iOSAutoLinkOptions) => Task[],
};

export const tasks: iOSBuildTasks = {
  bootstrap: (options: iOSBootstrapOption) => [
    task('Install CocoaPods dependencies', () => {
      assertDependencies(
        isOnPath('pod', 'CocoaPods'),
        isOnPath('bundle', "Bundler to manage Ruby's gems"),
      );
      return execa('bundle', ['exec', 'pod', 'install'], {
        cwd: options.cwd,
        env: {RCT_NEW_ARCH_ENABLED: options.newArchitecture ? '1' : '0'},
      });
    }),
  ],

  build: (options: iOSBuildOptions, ...args: $ReadOnlyArray<string>) => [
    task('build an iOS artifact', () => {
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

  install: (options: iOSInstallApp) => [
    task('Install the app on a simulator', () => {
      assertDependencies(isOnPath('xcrun', 'An Xcode Commandline tool: xcrun'));
      return execa(
        'xcrun',
        ['simctl', 'install', options.device, options.appPath],
        {cwd: options.cwd, env: options.env},
      );
    }),
  ],

  autolink: (options: iOSAutoLinkOptions) => [
    task('Link packages', () => {
      assertDependencies(
        isOnPath('pod', 'CocoaPods'),
        isOnPath('bundle', "Bundler to manage Ruby's gems"),
      );
      return execa('bundle', ['exec', 'pod', 'install'], {
        cwd: options.cwd,
        env: options.env,
      });
    }),
  ],
};
