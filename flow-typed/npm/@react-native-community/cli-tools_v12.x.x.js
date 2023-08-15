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
  declare export function addInteractionListener(
    callback: (options: {pause: boolean, canEscape?: boolean}) => void,
  ): void;

  declare export class CLIError extends Error {
    constructor(msg: string, originalError?: Error | mixed | string): this;
  }

  declare export function getPidFromPort(port: number): number | null;

  declare export function handlePortUnavailable(
    initialPort: number,
    projectRoot: string,
    initialPackager?: boolean,
  ): Promise<{
    port: number,
    packager: boolean,
  }>;

  declare export function hookStdout(callback: Function): () => void;

  declare export function isPackagerRunning(
    packagerPort: string | number | void,
  ): Promise<
    | {
        status: 'running',
        root: string,
      }
    | 'not_running'
    | 'unrecognized',
  >;

  declare export const logger: $ReadOnly<{
    success: (...message: Array<string>) => void,
    info: (...message: Array<string>) => void,
    warn: (...message: Array<string>) => void,
    error: (...message: Array<string>) => void,
    debug: (...message: Array<string>) => void,
    log: (...message: Array<string>) => void,
    setVerbose: (level: boolean) => void,
    isVerbose: () => boolean,
    disable: () => void,
    enable: () => void,
  }>;

  declare export function logAlreadyRunningBundler(port: number): void;

  declare export function resolveNodeModuleDir(
    root: string,
    packageName: string,
  ): string;

  declare export const version: $ReadOnly<{
    logIfUpdateAvailable: (projectRoot: string) => Promise<void>,
  }>;
}
