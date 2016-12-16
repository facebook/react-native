/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

type CreateIndexMapOptions = {|
  file?: string,
  sections?: Array<IndexMapSection>
|};

type IndexMap = MapBase & {
  sections: Array<IndexMapSection>,
};

type IndexMapSection = {
  map: IndexMap | MappingsMap,
  offset: {line: number, column: number},
};

type MapBase = {
  // always the first entry in the source map entry object per
  // https://fburl.com/source-map-spec#heading=h.qz3o9nc69um5
  version: 3,
  file?: string,
};

type MappingsMap = MapBase & {
  mappings: string,
  names: Array<string>,
  sourceRoot?: string,
  sources: Array<string>,
  sourcesContent?: Array<?string>,
};

export type SourceMap = IndexMap | MappingsMap;

exports.createIndexMap = (opts?: CreateIndexMapOptions): IndexMap => ({
  version: 3,
  file: opts && opts.file,
  sections: opts && opts.sections || [],
});
