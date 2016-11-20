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

import type {Console} from 'console';

export type Callback<A = void, B = void>
  = ((error: Error) => mixed)
  & ((error: null | void, a: A, b: B) => mixed);

type ResolveOptions = {
  log?: Console,
};

type LoadOptions = {|
  log?: Console,
  optimize?: boolean,
  platform?: string,
|};

type GraphOptions = {|
  cwd?: string,
  log?: Console,
  optimize?: boolean,
  skip?: Set<string>,
|};

type Dependency = {|
  id: string,
  path: string,
|};

export type File = {|
  ast: Object,
  code?: string,
  path: string,
|};

export type Module = {|
  dependencies: Array<Dependency>,
  file: File,
|};

export type GraphFn = (
  entryPoints: Iterable<string>,
  platform: string,
  options?: GraphOptions,
  callback?: Callback<Array<Module>>,
) => void;

export type ResolveFn = (
  id: string,
  source: string,
  platform: string,
  options?: ResolveOptions,
  callback: Callback<string>,
) => void;

export type LoadFn = (
  file: string,
  options: LoadOptions,
  callback: Callback<File, Array<string>>,
) => void;

export type TransformResult = {|
  code: string,
  dependencies: Array<string>,
  dependencyMapName?: string,
  map: ?Object,
|};

export type TransformedFile = {
  code: string,
  file: string,
  hasteID: ?string,
  isPolyfill: boolean,
  package?: PackageData,
  transformed: {[variant: string]: TransformResult},
};

export type PackageData = {|
  browser?: Object | string,
  main?: string,
  name?: string,
  'react-native'?: Object | string,
|};

export type TransformFnResult = {
  ast: Object,
};

export type TransformFn = (
  data: {|
    filename: string,
    options?: Object,
    plugins?: Array<string | Object | [string | Object, any]>,
    sourceCode: string,
  |},
  callback: Callback<TransformFnResult>
) => void;
