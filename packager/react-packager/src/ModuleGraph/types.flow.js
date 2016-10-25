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

type callback<T> = (error: ?Error, result?: T) => any;
type callback2<T, T1> = (error: ?Error, a?: T, b?: T1) => any;

type ResolveOptions = {
  log?: Console,
};

type LoadOptions = {
  log?: Console,
  optimize?: boolean,
  platform?: string,
};

type GraphOptions = {
  cwd?: string,
  log?: Console,
  optimize?: boolean,
  skip?: Set<string>,
};

type Dependency = {
  id: string,
  path: string,
};

export type File = {
  path: string,
  code?: string,
  ast: Object,
};

export type Module = {
  file: File,
  dependencies: Array<Dependency>,
};

export type GraphFn = (
  entryPoints: Iterable<string>,
  platform: string,
  options?: GraphOptions,
  callback?: callback<Array<Module>>,
) => void;

export type ResolveFn = (
  id: string,
  source: string,
  platform: string,
  options?: ResolveOptions,
  callback: callback<string>,
) => void;

export type LoadFn = (
  file: string,
  options: LoadOptions,
  callback: callback2<File, Array<string>>,
) => void;

type TransformResult = {
  code: string,
  map: ?Object,
  dependencies: Array<String>,
};

export type TransformedFile = {
  file: string,
  code: string,
  transformed: {[variant: string]: TransformResult},
  hasteID: ?string,
  package?: PackageData,
};

export type PackageData = {
  name?: string,
  main?: string,
  browser?: Object | string,
  'react-native'?: Object | string,
};
