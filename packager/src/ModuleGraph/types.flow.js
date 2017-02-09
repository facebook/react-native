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

import type {SourceMap} from './output/source-map';
import type {Ast} from 'babel-core';
import type {Console} from 'console';

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
  type: FileTypes,
|};

type FileTypes = 'module' | 'script';

export type GraphFn = (
  entryPoints: Iterable<string>,
  platform: string,
  options?: ?GraphOptions,
  callback?: Callback<GraphResult>,
) => void;

type GraphOptions = {|
  cwd?: string,
  log?: Console,
  optimize?: boolean,
  skip?: Set<string>,
|};

export type GraphResult = {
  entryModules: Array<Module>,
  modules: Array<Module>,
};

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

type OutputResult = {
  code: string,
  map: SourceMap,
};

export type PackageData = {|
  browser?: Object | string,
  main?: string,
  name?: string,
  'react-native'?: Object | string,
|};

export type ResolveFn = (
  id: string,
  source: string,
  platform: string,
  options?: ResolveOptions,
  callback: Callback<string>,
) => void;

type ResolveOptions = {
  log?: Console,
};

export type TransformerResult = {
  ast: ?Ast,
  code: string,
  map: ?SourceMap,
};

export type Transformer = {
  transform: (
    sourceCode: string,
    filename: string,
    options: ?{},
    plugins?: Array<string | Object | [string | Object, any]>,
  ) => {ast: ?Ast, code: string, map: ?SourceMap}
};

export type TransformResult = {|
  code: string,
  dependencies: Array<string>,
  dependencyMapName?: string,
  map: ?Object,
|};

export type TransformResults = {[string]: TransformResult};

export type TransformVariants = {[key: string]: Object};

export type TransformedFile = {
  code: string,
  file: string,
  hasteID: ?string,
  package?: PackageData,
  transformed: TransformResults,
  type: FileTypes,
};
