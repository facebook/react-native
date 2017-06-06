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

import type { // eslint-disable-line sort-requires
  Extensions,
  Path,
} from './node-haste.flow';

import type {
  ResolveFn,
  TransformedCodeFile,
} from '../types.flow';

const AssetResolutionCache = require('../../node-haste/AssetResolutionCache');
const DependencyGraphHelpers = require('../../node-haste/DependencyGraph/DependencyGraphHelpers');
const FilesByDirNameIndex = require('../../node-haste/FilesByDirNameIndex');
const HasteFS = require('./HasteFS');
const HasteMap = require('../../node-haste/DependencyGraph/HasteMap');
const Module = require('./Module');
const ModuleCache = require('./ModuleCache');
const ResolutionRequest = require('../../node-haste/DependencyGraph/ResolutionRequest');

const defaults = require('../../defaults');

import type {Moduleish, Packageish} from '../../node-haste/DependencyGraph/ResolutionRequest';

type ResolveOptions = {|
  assetExts: Extensions,
  extraNodeModules: {[id: string]: string},
  +sourceExts: Extensions,
  transformedFiles: {[path: Path]: TransformedCodeFile},
|};

const platforms = new Set(defaults.platforms);

/**
 * We don't need to crawl the filesystem all over again so we just mock
 * a jest-haste-map's ModuleMap instance. Eventually, though, we'll
 * want to figure out how to reunify and get rid of `HasteMap`.
 */
function getFakeModuleMap(hasteMap: HasteMap<Module, Packageish>) {
  return {
    getModule(name: string, platform: ?string): ?string {
      const module = hasteMap.getModule(name, platform);
      return module && module.type === 'Module' ? module.path : null;
    },
    getPackage(name: string, platform: ?string): ?string {
      const pkg = hasteMap.getPackage(name);
      return pkg && pkg.path;
    },
  };
}

const nullModule: Moduleish = {
  path: '/',
  getPackage() {},
  hash() {
    throw new Error('not implemented');
  },
  readCached() { throw new Error('not implemented'); },
  readFresh() { return Promise.reject(new Error('not implemented')); },
  isHaste() { throw new Error('not implemented'); },
  getName() { throw new Error('not implemented'); },
};

exports.createResolveFn = function(options: ResolveOptions): ResolveFn {
  const {
    assetExts,
    extraNodeModules,
    transformedFiles,
    sourceExts,
  } = options;
  const files = Object.keys(transformedFiles);
  function getTransformedFile(path) {
    const result = transformedFiles[path];
    if (!result) {
      throw new Error(`"${path} does not exist`);
    }
    return result;
  }

  const helpers = new DependencyGraphHelpers({
    assetExts,
    providesModuleNodeModules: defaults.providesModuleNodeModules,
  });

  const hasteFS = new HasteFS(files);
  const moduleCache = new ModuleCache(
    filePath => hasteFS.closest(filePath, 'package.json'),
    getTransformedFile,
  );
  const hasteMap = new HasteMap({
    extensions: sourceExts,
    files,
    helpers,
    moduleCache,
    platforms,
    preferNativePlatform: true,
  });

  const hasteMapBuilt = hasteMap.build();
  const resolutionRequests = {};
  const filesByDirNameIndex = new FilesByDirNameIndex(hasteMap.getAllFiles());
  const assetResolutionCache = new AssetResolutionCache({
    assetExtensions: new Set(assetExts),
    getDirFiles: dirPath => filesByDirNameIndex.getAllFiles(dirPath),
    platforms,
  });
  return (id, source, platform, _, callback) => {
    let resolutionRequest = resolutionRequests[platform];
    if (!resolutionRequest) {
      resolutionRequest = resolutionRequests[platform] = new ResolutionRequest({
        dirExists: filePath => hasteFS.dirExists(filePath),
        entryPath: '',
        extraNodeModules,
        hasteFS,
        helpers,
        moduleCache,
        moduleMap: getFakeModuleMap(hasteMap),
        platform,
        preferNativePlatform: true,
        resolveAsset: (dirPath, assetName) =>
          assetResolutionCache.resolve(dirPath, assetName, platform),
        sourceExts,
      });
    }

    const from = source != null
      ? new Module(source, moduleCache, getTransformedFile(source))
      : nullModule;
    hasteMapBuilt
      .then(() => resolutionRequest.resolveDependency(from, id))
      .then(
        // nextTick to escape promise error handling
        module => process.nextTick(callback, null, module.path),
        error => process.nextTick(callback, error),
      );
  };
};
