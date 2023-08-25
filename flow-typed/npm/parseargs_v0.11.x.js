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

declare module '@pkgjs/parseargs' {
  declare type ParseArgsOptionConfig = {
    type: 'string' | 'boolean',
    short?: string,
    multiple?: boolean,
  };

  declare type ParseArgsOptionsConfig = {
    [longOption: string]: ParseArgsOptionConfig,
  };

  declare export type ParseArgsConfig = {
    strict?: boolean,
    allowPositionals?: boolean,
    tokens?: boolean,
    options?: ParseArgsOptionsConfig,
    args?: string[],
  };

  declare type ParsedResults = {
    values: {
      [longOption: string]: void | string | boolean | Array<string | boolean>,
    },
    positionals: string[],
    ...
  };

  declare export function parseArgs(config: ParseArgsConfig): ParsedResults;
}
