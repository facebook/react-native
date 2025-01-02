/**
 * (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.
 *
 * @flow strict
 * @format
 */

// Built to match the API @ 5.0.0
declare module 'ini' {
  export type Options = {
    whitespace?: boolean,
    align?: boolean,
    section?: string,
    sort?: boolean,
    newline?: boolean,
    platform?: 'win32' | 'linux' | 'darwin',
    bracketedArrays?: boolean,
  };

  declare type Ini = {
    parse: <T>(string: string, options?: Options) => T,
    decode: <T>(string: string) => T,
    stringify: (
      object: {[key: string]: string, ...},
      section: string,
    ) => string,
    safe: (string: string) => string,
    unsafe: (string: string) => string,
  };

  declare module.exports: Ini;
}
