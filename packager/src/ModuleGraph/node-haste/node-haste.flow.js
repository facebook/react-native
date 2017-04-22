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

'use strict';

import DependencyGraphHelpers from '../../node-haste/DependencyGraph/DependencyGraphHelpers';

type ModuleID = string;
export type Path = string;
type Platform = string;
type Platforms = Set<Platform>;

export type Extensions = Array<string>;

export type Module = {
  path: Path,
  type: 'Module',
  getName(): Promise<ModuleID>,
  getPackage(): ?Package,
  isHaste(): Promise<boolean>,
};

export type Package = {
  path: Path,
  root: Path,
  type: 'Package',
  getMain(): Path,
  getName(): Promise<ModuleID>,
  isHaste(): Promise<boolean>,
  redirectRequire(id: ModuleID): Path | false,
};

export type ModuleCache = {
  getAssetModule(path: Path): Module,
  getModule(path: Path): Module,
  getPackage(path: Path): Package,
  getPackageOf(path: Path): ?Package,
}

export type FastFS = {
  dirExists(path: Path): boolean,
  closest(path: string, fileName: string): ?string,
  fileExists(path: Path): boolean,
  getAllFiles(): Array<Path>,
  matches(directory: Path, pattern: RegExp): Array<Path>,
};

type HasteMapOptions = {|
  extensions: Extensions,
  files: Array<string>,
  helpers: DependencyGraphHelpers,
  moduleCache: ModuleCache,
  platforms: Platforms,
  preferNativePlatform: true,
|};

declare class HasteMap {
  // node-haste/DependencyGraph/HasteMap.js
  build(): Promise<Object>,
  constructor(options: HasteMapOptions): void,
}
