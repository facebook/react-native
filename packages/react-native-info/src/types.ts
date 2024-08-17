/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

export interface CliOptions {
  json?: boolean;
}

export type NotFound = 'Not Found';

type AvailableInformation = {
  version: string;
  path: string;
};

type Information = AvailableInformation | NotFound;

export type EnvironmentInfo = {
  System: {
    OS: string;
    CPU: string;
    Memory: string;
    Shell: AvailableInformation;
  };
  Binaries: {
    Node: AvailableInformation;
    Yarn: AvailableInformation;
    npm: AvailableInformation;
    bun: AvailableInformation;
    Watchman: AvailableInformation;
  };
  Managers: {
    CocoaPods: AvailableInformation;
  };
  SDKs: {
    'iOS SDK': {
      Platforms: string[];
    };
    'Android SDK':
      | {
          'API Levels': string[] | NotFound;
          'Build Tools': string[] | NotFound;
          'System Images': string[] | NotFound;
          'Android NDK': string | NotFound;
        }
      | NotFound;
  };
  IDEs: {
    'Android Studio': AvailableInformation | NotFound;
    Emacs: AvailableInformation;
    Nano: AvailableInformation;
    VSCode: AvailableInformation;
    Vim: AvailableInformation;
    Xcode: AvailableInformation;
  };
  Languages: {
    Java: Information;
    Ruby: AvailableInformation;
  };
};
