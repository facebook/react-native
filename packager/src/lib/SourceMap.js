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

import type {SourceMap as MappingsMap} from 'babel-core';

export type IndexMapSection = {
  map: SourceMap,
  offset: {line: number, column: number},
};

type FBExtensions = {x_facebook_offsets: Array<number>};

export type {MappingsMap};
export type IndexMap = {
  file?: string,
  mappings?: void, // avoids SourceMap being a disjoint union
  sections: Array<IndexMapSection>,
  version: number,
};

export type FBIndexMap = IndexMap & FBExtensions;
export type SourceMap = IndexMap | MappingsMap;
export type FBSourceMap = FBIndexMap | (MappingsMap & FBExtensions);

function isMappingsMap(map: SourceMap)/*: %checks*/ {
  return map.mappings !== undefined;
}

exports.isMappingsMap = isMappingsMap;
