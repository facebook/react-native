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

import type Bundle from '../../packager/src/Bundler/Bundle';
import type {Unbundle} from '../../packager/src/Bundler/Bundle';
import type ModuleTransport from '../../packager/src/lib/ModuleTransport';
import type {MixedSourceMap} from '../../packager/src/lib/SourceMap';

export type {Bundle, ModuleTransport, MixedSourceMap as SourceMap, Unbundle};

export type ModuleGroups = {|
  groups: Map<number, Set<number>>,
  modulesById: Map<number, ModuleTransport>,
  modulesInGroups: Set<number>,
|};

export type ModuleTransportLike = {
  code: string,
  id: number,
  map?: $PropertyType<ModuleTransport, 'map'>,
  +name?: string,
};

export type OutputOptions = {
  bundleOutput: string,
  bundleEncoding?: 'utf8' | 'utf16le' | 'ascii',
  dev?: boolean,
  platform: string,
  sourcemapOutput?: string,
  sourcemapSourcesRoot?: string,
};

export type RequestOptions = {|
  entryFile: string,
  sourceMapUrl?: string,
  dev?: boolean,
  minify: boolean,
  platform: string,
|};
