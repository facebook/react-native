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
  declare export function parseArgs<
    TOptions: {[string]: util$ParseArgsOption} = {},
  >(config: {
    args?: Array<string>,
    options?: TOptions,
    strict?: boolean,
    allowPositionals?: boolean,
    tokens?: false,
  }): {
    values: util$ParseArgsOptionsToValues<TOptions>,
    positionals: Array<string>,
  };

  declare export function parseArgs<
    TOptions: {[string]: util$ParseArgsOption} = {},
  >(config: {
    args?: Array<string>,
    options?: TOptions,
    strict?: boolean,
    allowPositionals?: boolean,
    tokens: true,
  }): {
    values: util$ParseArgsOptionsToValues<TOptions>,
    positionals: Array<string>,
    tokens: Array<util$ParseArgsToken>,
  };
}
