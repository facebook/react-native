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
  declare export type CommandFunction<Args = Object> = (
    argv: Array<string>,
    ctx: Config,
    args: Args,
  ) => Promise<void> | void;

  declare export type OptionValue = string | boolean | number;

  declare export type CommandOption<T = (ctx: Config) => OptionValue> = {
    name: string,
    description?: string,
    parse?: (val: string) => any,
    default?: OptionValue | T,
  };

  declare export type Command = {
    name: string,
    description?: string,
    examples?: Array<{
      desc: string,
      cmd: string,
    }>,
    pkg?: {
      name: string,
      version: string,
    },
    func: CommandFunction<Object>,
    options?: Array<CommandOption<(ctx: Config) => OptionValue>>,
  };

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
