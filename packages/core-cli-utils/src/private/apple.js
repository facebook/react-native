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
import type {ExecaPromise} from 'execa';

import {assertDependencies, isOnPath, task} from './utils';
import execa from 'execa';
import fs from 'fs';
import path from 'path';

type AppleBuildMode = 'Debug' | 'Release';

type AppleBuildOptions = {
  isWorkspace: boolean,
  name: string,
  mode: AppleBuildMode,
  scheme?: string,
  destination?: string, // Device or Simulator or UUID
  ...AppleOptions,
};

type AppleBootstrapOption = {
  // Enabled by default
  hermes: boolean,
  newArchitecture: boolean,
  ...AppleOptions,
};

type AppleInstallApp = {
  // Install the app on a simulator or device, typically this is the description from
  // `xcrun simctl list devices`
  device: string,
  appPath: string,
  bundleId: string,
  ...AppleOptions,
};

type AppleOptions = {
  // The directory where the Xcode project is located
  cwd: string,
  // The environment variables to pass to the build command
  env?: {[key: string]: string | void, ...},
};

const FIRST = 1,
  SECOND = 2,
  THIRD = 3;

/* eslint sort-keys: "off" */
export const tasks = {
  // 1. Setup your environment for building the iOS apps
  bootstrap: (
    options: AppleBootstrapOption,
  ): {
    validate: Task<void>,
    installRubyGems: Task<ExecaPromise>,
    installDependencies: Task<ExecaPromise>,
  } => ({
    validate: task(FIRST, 'Check Cocoapods and bundle are available', () => {
      assertDependencies(
        isOnPath('pod', 'CocoaPods'),
        isOnPath('bundle', "Bundler to manage Ruby's gems"),
      );
    }),
    installRubyGems: task(SECOND, 'Install Ruby Gems', () =>
      execa('bundle', ['install'], {
        cwd: options.cwd,
      }),
    ),
    installDependencies: task(THIRD, 'Install CocoaPods dependencies', () => {
      const env = {
        RCT_NEW_ARCH_ENABLED: options.newArchitecture ? '1' : '0',
        HERMES: options.hermes ? '1' : '0',
      };
      return execa('bundle', ['exec', 'pod', 'install'], {
        cwd: options.cwd,
        env,
      });
    }),
  }),

  // 2. Build the iOS app using a setup environment
  build: (
    options: AppleBuildOptions,
    ...args: $ReadOnlyArray<string>
  ): {
    validate: Task<void>,
    hasPodsInstalled: Task<void>,
    build: Task<ExecaPromise>,
  } => ({
    validate: task(
      FIRST,
      "Check you've run xcode-select --install for xcodebuild",
      () => {
        assertDependencies(isOnPath('xcodebuild', 'Xcode Commandline Tools'));
      },
    ),
    hasPodsInstalled: task(FIRST, 'Check Pods are installed', () => {
      for (const file of ['Podfile.lock', 'Pods']) {
        try {
          fs.accessSync(
            path.join(options.cwd, file),
            /* eslint-disable-next-line no-bitwise */
            fs.constants.F_OK | fs.constants.R_OK,
          );
        } catch {
          throw new Error('Please run: yarn run boostrap ios');
        }
      }
    }),
    build: task(SECOND, 'build an app artifact', () => {
      const _args = [
        options.isWorkspace ? '-workspace' : '-project',
        options.name,
      ];
      if (options.scheme != null) {
        _args.push('-scheme', options.scheme);
      }
      if (options.destination != null) {
        _args.push('-destination', options.destination);
      }
      _args.push(...args);
      return execa('xcodebuild', _args, {cwd: options.cwd, env: options.env});
    }),
  }),

  // 3. Install the built app on a simulator or device
  ios: {
    install: (
      options: AppleInstallApp,
    ): {validate: Task<void>, install: Task<ExecaPromise>} => ({
      validate: task(
        FIRST,
        "Check you've run xcode-select --install for xcrun",
        () => {
          assertDependencies(
            isOnPath('xcrun', 'An Xcode Commandline tool: xcrun'),
          );
        },
      ),
      install: task(SECOND, 'Install the app on a simulator', () =>
        execa('xcrun', ['simctl', 'install', options.device, options.appPath], {
          cwd: options.cwd,
          env: options.env,
        }),
      ),
    }),
  },
};
