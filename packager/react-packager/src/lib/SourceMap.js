/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

type SourceMapBase = {
  version: number,
  file: string,
};

export type SourceMap = SourceMapBase & {
  sources: Array<string>,
  names: Array<string>,
  mappings: string,
  sourcesContent: Array<string>,
};

export type CombinedSourceMap = SourceMapBase & {
  sections: Array<{
    offset: {line: number, column: number},
    map: SourceMap,
  }>,
};

export type MixedSourceMap = SourceMap | CombinedSourceMap;
