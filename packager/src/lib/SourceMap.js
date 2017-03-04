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

import type {SourceMap as BabelSourceMap} from 'babel-core';

export type SourceMap = BabelSourceMap;

export type CombinedSourceMap = {
  version: number,
  file?: string,
  sections: Array<{
    offset: {line: number, column: number},
    map: MixedSourceMap,
  }>,
};

type FBExtensions = {x_facebook_offsets?: Array<number>};

export type MixedSourceMap
  = SourceMap
  | CombinedSourceMap
  | (SourceMap & FBExtensions)
  | (CombinedSourceMap & FBExtensions);
