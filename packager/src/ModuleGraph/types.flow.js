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

import type {MappingsMap, SourceMap} from '../lib/SourceMap';
import type {Ast} from 'babel-core';
import type {Console} from 'console';
export type {Transformer} from '../JSTransformer/worker/worker.js';

export type Callback<A = void, B = void>
  = (Error => void)
  & ((null | void, A, B) => void);

type Dependency = {|
  id: string,
  path: string,
|};

export type File = {|
  code: string,
  map?: ?Object,
  path: string,
  type: CodeFileTypes,
|};

type CodeFileTypes = 'module' | 'script';

export type GraphFn = (
  entryPoints: Iterable<string>,
  platform: string,
  options?: ?GraphOptions,
  callback?: Callback<GraphResult>,
) => void;

type GraphOptions = {|
  log?: Console,
  optimize?: boolean,
  skip?: Set<string>,
|};

export type GraphResult = {|
  entryModules: Iterable<Module>,
  modules: Iterable<Module>,
|};

export type IdForPathFn = {path: string} => number;

export type LoadFn = (
  file: string,
  options: LoadOptions,
  callback: Callback<File, Array<string>>,
) => void;

type LoadOptions = {|
  log?: Console,
  optimize?: boolean,
  platform?: string,
|};

export type Module = {|
  dependencies: Array<Dependency>,
  file: File,
|};

export type OutputFn = (
  modules: Iterable<Module>,
  filename?: string,
  idForPath: IdForPathFn,
) => OutputResult;

type OutputResult = {|
  code: string,
  map: SourceMap,
|};

export type PackageData = {|
  browser?: Object | string,
  main?: string,
  name?: string,
  'react-native'?: Object | string,
|};

export type ResolveFn = (
  id: string,
  source: ?string,
  platform: string,
  options?: ResolveOptions,
  callback: Callback<string>,
) => void;

type ResolveOptions = {
  log?: Console,
};

export type TransformerResult = {|
  ast: ?Ast,
  code: string,
  map: ?MappingsMap,
|};

export type TransformResult = {|
  code: string,
  dependencies: Array<string>,
  dependencyMapName?: string,
  map: ?Object,
|};

export type TransformResults = {[string]: TransformResult};

export type TransformVariants = {+[name: string]: {}, +default: {}};

export type TransformedCodeFile = {
  +code: string,
  +file: string,
  +hasteID: ?string,
  package?: PackageData,
  +transformed: TransformResults,
  +type: CodeFileTypes,
};

export type AssetFile = {|
  +assetContentBase64: string,
  +filePath: string,
|};

export type TransformedSourceFile =
  | {|
    +type: 'code',
    +details: TransformedCodeFile,
  |}
  | {|
    +type: 'asset',
    +details: AssetFile,
  |}
  ;

export type LibraryOptions = {|
  dependencies?: Array<string>,
  optimize: boolean,
  platform?: string,
  rebasePath: string => string,
|};

export type Base64Content = string;
export type AssetContentsByPath = {[destFilePath: string]: Base64Content};

export type Library = {|
  +files: Array<TransformedCodeFile>,
  /* cannot be a Map because it's JSONified later on */
  +assets: AssetContentsByPath,
|};
