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

type ModuleID = string;
export type Path = string;
type Platform = string;
type Platforms = Set<Platform>;

export type Extensions = Array<string>;

export type Module = {
  path: Path,
  type: 'Module',
  getName(): Promise<ModuleID>,
  isHaste(): Promise<boolean>,
};

export type Package = {
  type: 'Package',
  root: Path,
  getMain(): Promise<Path>,
  getName(): Promise<ModuleID>,
  redirectRequire(id: ModuleID): Promise<Path | false>,
};

// when changing this to `type`, the code does not typecheck any more
export interface ModuleCache {
  getAssetModule(path: Path): Module,
  getModule(path: Path): Module,
  getPackage(path: Path): Package,
}

export type FastFS = {
  dirExists(path: Path): boolean,
  fileExists(path: Path): boolean,
  getAllFiles(): Array<Path>,
  matches(directory: Path, pattern: RegExp): Array<Path>,
};

type HelpersOptions = {|
  assetExts: Extensions,
  providesModuleNodeModules: Array<string>,
|};

declare class Helpers {
  // node-haste/DependencyGraph/DependencyGraphHelpers.js
  constructor(options: HelpersOptions): void,
}
export type HelpersT = Helpers;

type DeprecatedAssetMapOptions = {|
  assetExts: Extensions,
  files: Array<Path>,
  helpers: Helpers,
  platforms: Platforms,
|};

declare class DeprecatedAssetMap {
  // node-haste/DependencyGraph/DeprecatedAssetMap.js
  constructor(options: DeprecatedAssetMapOptions): void,
}
export type DeprecatedAssetMapT = DeprecatedAssetMap;

type HasteMapOptions = {|
  extensions: Extensions,
  fastfs: FastFS,
  moduleCache: ModuleCache,
  preferNativePlatform: true,
  helpers: Helpers,
  platforms: Platforms,
|};

declare class HasteMap {
  // node-haste/DependencyGraph/HasteMap.js
  constructor(options: HasteMapOptions): void,
}
export type HasteMapT = HasteMap;

type ResolutionRequestOptions = {|
  platform: Platform,
  platforms: Platforms,
  preferNativePlatform: true,
  hasteMap: HasteMap,
  deprecatedAssetMap: DeprecatedAssetMap,
  helpers: Helpers,
  moduleCache: ModuleCache,
  fastfs: FastFS,
  shouldThrowOnUnresolvedErrors: () => true,
  extraNodeModules: {[id: ModuleID]: Path},
|};

declare class ResolutionRequest {
  // node-haste/DependencyGraph/ResolutionRequest.js
  constructor(options: ResolutionRequestOptions): void,
  resolveDependency(from: Module, to: ModuleID): Promise<Module>,
}
export type ResolutionRequestT = ResolutionRequest;
