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

declare module 'data-uri-to-buffer' {
  declare interface ParsedDataURI {
    type: string;
    typeFull: string;
    charset: TextDecoder$availableEncodings;
    buffer: ArrayBuffer;
  }

  declare export function dataUriToBuffer(uri: string | URL): ParsedDataURI;
}
