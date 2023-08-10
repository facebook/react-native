/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

declare module '@react-native-community/cli-types' {
  declare type PlatformConfig = {
    npmPackageName: string,
    ...
  };

  declare export type Config = {
    root: string,
    reactNativePath: string,
    reactNativeVersion: string,
    project: Object,
    platforms: {
      android: PlatformConfig,
      ios: PlatformConfig,
      [name: string]: PlatformConfig,
    },
    ...
  };
}
