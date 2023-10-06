/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

declare module '@react-native-community/cli-tools' {
  declare export class CLIError extends Error {
    constructor(msg: string, originalError?: Error | mixed | string): this;
  }

  declare export const logger: $ReadOnly<{
    debug: (...message: Array<string>) => void,
    error: (...message: Array<string>) => void,
    log: (...message: Array<string>) => void,
    info: (...message: Array<string>) => void,
    warn: (...message: Array<string>) => void,
    ...
  }>;

  declare export const version: $ReadOnly<{
    logIfUpdateAvailable: (projectRoot: string) => Promise<void>,
  }>;
}
