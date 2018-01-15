/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

type _SourceMap = {
  file?: string,
  mappings: string,
  names: Array<string>,
  sourceRoot?: string,
  sources: Array<string>,
  sourcesContent?: Array<?string>,
  version: number,
};

type _Result<MapT> = {
  code: string,
  map: MapT,
};

type _Options = {
  compress?: false | {||},
  fromString?: boolean,
  inSourceMap?: string | ?_SourceMap,
  mangle?: boolean | {|
    except?: Array<string>,
    toplevel?: boolean,
    eval?: boolean,
    keep_fnames?: boolean,
  |},
  mangleProperties?: boolean | {|
    regex?: RegExp,
    ignore_quoted?: boolean,
    debug?: false | string,
  |},
  outFileName?: string,
  output?: {|
    ascii_only?: boolean,
    screw_ie8?: boolean,
  |},
  parse?: {|
    strict?: boolean,
    bare_returns?: boolean,
    filename?: string,
  |},
  sourceMapUrl?: string,
  sourceRoot?: string,
  warnings?: boolean,
};

type _Input =
  | string // code or file name
  | Array<string> // array of file names
  | {[filename: string]: string}; // file names and corresponding code

declare module 'uglify-js' {
  declare function minify(
    fileOrFilesOrCode: _Input,
    options?: _Options & {outSourceMap?: ?false | ''},
  ): _Result<void>;
  declare function minify(
    fileOrFilesOrCode: _Input,
    options?: _Options & {outSourceMap: true | string},
  ): _Result<string>;
}
