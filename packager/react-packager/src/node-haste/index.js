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

const Cache = require('./Cache');
const DependencyGraphHelpers = require('./DependencyGraph/DependencyGraphHelpers');
const DeprecatedAssetMap = require('./DependencyGraph/DeprecatedAssetMap');
const Fastfs = require('./fastfs');
const HasteMap = require('./DependencyGraph/HasteMap');
const JestHasteMap = require('jest-haste-map');
const Module = require('./Module');
const ModuleCache = require('./ModuleCache');
const Polyfill = require('./Polyfill');
const ResolutionRequest = require('./DependencyGraph/ResolutionRequest');
const ResolutionResponse = require('./DependencyGraph/ResolutionResponse');

const getAssetDataFromName = require('./lib/getAssetDataFromName');
const getInverseDependencies = require('./lib/getInverseDependencies');
const getPlatformExtension = require('./lib/getPlatformExtension');
const isAbsolutePath = require('absolute-path');
const os = require('os');
const path = require('path');
const replacePatterns = require('./lib/replacePatterns');
const util = require('util');

import type {
  TransformCode,
  Options as ModuleOptions,
} from './Module';

const ERROR_BUILDING_DEP_GRAPH = 'DependencyGraphError';

const {
  createActionStartEntry,
  createActionEndEntry,
  log,
  print,
} = require('../Logger');

const escapePath = (p: string) => {
  return (path.sep === '\\')  ? p.replace(/(\/|\\(?!\.))/g, '\\\\') : p;
};

class DependencyGraph {

  _opts: {
    roots: Array<string>,
    ignoreFilePath: (filePath: string) => boolean,
    watch: boolean,
    forceNodeFilesystemAPI: boolean,
    assetRoots_DEPRECATED: Array<string>,
    assetExts: Array<string>,
    providesModuleNodeModules: Array<string>,
    platforms: Set<mixed>,
    preferNativePlatform: boolean,
    extensions: Array<string>,
    mocksPattern: mixed,
    transformCode: TransformCode,
    transformCacheKey: string,
    shouldThrowOnUnresolvedErrors: () => boolean,
    enableAssetMap: boolean,
    moduleOptions: ModuleOptions,
    extraNodeModules: mixed,
    useWatchman: boolean,
    maxWorkers: number,
    resetCache: boolean,
  };
  _assetDependencies: mixed;
  _assetPattern: RegExp;
  _cache: Cache;
  _deprecatedAssetMap: DeprecatedAssetMap;
  _fastfs: Fastfs;
  _haste: JestHasteMap;
  _hasteMap: HasteMap;
  _hasteMapError: ?Error;
  _helpers: DependencyGraphHelpers;
  _moduleCache: ModuleCache;

  _loading: Promise<mixed>;

  constructor({
    roots,
    ignoreFilePath,
    watch,
    forceNodeFilesystemAPI,
    assetRoots_DEPRECATED,
    assetExts,
    providesModuleNodeModules,
    platforms,
    preferNativePlatform,
    cache,
    extensions,
    mocksPattern,
    transformCode,
    transformCacheKey,
    shouldThrowOnUnresolvedErrors = () => true,
    enableAssetMap,
    assetDependencies,
    moduleOptions,
    extraNodeModules,
    // additional arguments for jest-haste-map
    useWatchman,
    maxWorkers,
    resetCache,
  }: {
    roots: Array<string>,
    ignoreFilePath: (filePath: string) => boolean,
    watch: boolean,
    forceNodeFilesystemAPI?: boolean,
    assetRoots_DEPRECATED: Array<string>,
    assetExts: Array<string>,
    providesModuleNodeModules: Array<string>,
    platforms: mixed,
    preferNativePlatform: boolean,
    cache: Cache,
    extensions: Array<string>,
    mocksPattern: mixed,
    transformCode: TransformCode,
    transformCacheKey: string,
    shouldThrowOnUnresolvedErrors: () => boolean,
    enableAssetMap: boolean,
    assetDependencies: mixed,
    moduleOptions: ?ModuleOptions,
    extraNodeModules: mixed,
    useWatchman: boolean,
    maxWorkers: number,
    resetCache: boolean,
  }) {
    this._opts = {
      roots,
      ignoreFilePath: ignoreFilePath || (() => {}),
      watch: !!watch,
      forceNodeFilesystemAPI: !!forceNodeFilesystemAPI,
      assetRoots_DEPRECATED: assetRoots_DEPRECATED || [],
      assetExts: assetExts || [],
      providesModuleNodeModules,
      platforms: new Set(platforms || []),
      preferNativePlatform: preferNativePlatform || false,
      extensions: extensions || ['js', 'json'],
      mocksPattern,
      transformCode,
      transformCacheKey,
      shouldThrowOnUnresolvedErrors,
      enableAssetMap: enableAssetMap || true,
      moduleOptions: moduleOptions || {
        cacheTransformResults: true,
      },
      extraNodeModules,
      // additional arguments for jest-haste-map & defaults
      useWatchman: useWatchman !== false,
      maxWorkers,
      resetCache,
    };
    this._assetPattern =
      new RegExp('^' + this._opts.assetRoots_DEPRECATED.map(escapePath).join('|'));

    this._cache = cache;
    this._assetDependencies = assetDependencies;
    this._helpers = new DependencyGraphHelpers(this._opts);
    this.load();
  }

  load() {
    if (this._loading) {
      return this._loading;
    }

    const mw = this._opts.maxWorkers;
    this._haste = new JestHasteMap({
      extensions: this._opts.extensions.concat(this._opts.assetExts),
      forceNodeFilesystemAPI: this._opts.forceNodeFilesystemAPI,
      ignorePattern: {test: this._opts.ignoreFilePath},
      maxWorkers: typeof mw === 'number' && mw >= 1 ? mw : getMaxWorkers(),
      mocksPattern: '',
      name: 'react-native-packager',
      platforms: Array.from(this._opts.platforms),
      providesModuleNodeModules: this._opts.providesModuleNodeModules,
      resetCache: this._opts.resetCache,
      retainAllFiles: true,
      roots: this._opts.roots.concat(this._opts.assetRoots_DEPRECATED),
      useWatchman: this._opts.useWatchman,
      watch: this._opts.watch,
    });

    this._loading = this._haste.build().then(hasteMap => {
      const initializingPackagerLogEntry =
        print(log(createActionStartEntry('Initializing Packager')));

      const hasteFSFiles = hasteMap.hasteFS.getAllFiles();

      this._fastfs = new Fastfs(
        'JavaScript',
        this._opts.roots,
        hasteFSFiles,
        {
          ignore: this._opts.ignoreFilePath,
        }
      );

      this._moduleCache = new ModuleCache({
        fastfs: this._fastfs,
        cache: this._cache,
        transformCode: this._opts.transformCode,
        transformCacheKey: this._opts.transformCacheKey,
        depGraphHelpers: this._helpers,
        assetDependencies: this._assetDependencies,
        moduleOptions: this._opts.moduleOptions,
      }, this._opts.platforms);

      this._hasteMap = new HasteMap({
        fastfs: this._fastfs,
        extensions: this._opts.extensions,
        moduleCache: this._moduleCache,
        preferNativePlatform: this._opts.preferNativePlatform,
        helpers: this._helpers,
        platforms: this._opts.platforms,
      });

      const assetFiles = hasteMap.hasteFS.matchFiles(this._assetPattern);

      this._deprecatedAssetMap = new DeprecatedAssetMap({
        helpers: this._helpers,
        assetExts: this._opts.assetExts,
        platforms: this._opts.platforms,
        files: assetFiles,
      });

      this._haste.on('change', ({eventsQueue}) =>
        eventsQueue.forEach(({type, filePath, stat}) =>
          this.processFileChange(type, filePath, stat)
        )
      );

      const buildingHasteMapLogEntry =
        print(log(createActionStartEntry('Building Haste Map')));

      return this._hasteMap.build().then(
        map => {
          print(log(createActionEndEntry(buildingHasteMapLogEntry)));
          print(log(createActionEndEntry(initializingPackagerLogEntry)));
          return map;
        },
        err => {
          const error = new Error(
            `Failed to build DependencyGraph: ${err.message}`
          );
          /* $FlowFixMe: monkey-patching */
          error.type = ERROR_BUILDING_DEP_GRAPH;
          error.stack = err.stack;
          throw error;
        }
      );
    });

    return this._loading;
  }

  /**
   * Returns a promise with the direct dependencies the module associated to
   * the given entryPath has.
   */
  getShallowDependencies(entryPath: string, transformOptions: mixed) {
    return this._moduleCache
      .getModule(entryPath)
      .getDependencies(transformOptions);
  }

  getFS() {
    return this._fastfs;
  }

  getWatcher() {
    return this._haste;
  }

  /**
   * Returns the module object for the given path.
   */
  getModuleForPath(entryFile: string) {
    return this._moduleCache.getModule(entryFile);
  }

  getAllModules() {
    return this.load().then(() => this._moduleCache.getAllModules());
  }

  getDependencies({
    entryPath,
    platform,
    transformOptions,
    onProgress,
    recursive = true,
  }: {
    entryPath: string,
    platform: string,
    transformOptions: {},
    onProgress: () => void,
    recursive: boolean,
  }) {
    return this.load().then(() => {
      platform = this._getRequestPlatform(entryPath, platform);
      const absPath = this._getAbsolutePath(entryPath);
      const req = new ResolutionRequest({
        platform,
        platforms: this._opts.platforms,
        preferNativePlatform: this._opts.preferNativePlatform,
        entryPath: absPath,
        deprecatedAssetMap: this._deprecatedAssetMap,
        hasteMap: this._hasteMap,
        helpers: this._helpers,
        moduleCache: this._moduleCache,
        fastfs: this._fastfs,
        shouldThrowOnUnresolvedErrors: this._opts.shouldThrowOnUnresolvedErrors,
        extraNodeModules: this._opts.extraNodeModules,
      });

      const response = new ResolutionResponse({transformOptions});

      return req.getOrderedDependencies({
        response,
        mocksPattern: this._opts.mocksPattern,
        transformOptions,
        onProgress,
        recursive,
      }).then(() => response);
    });
  }

  matchFilesByPattern(pattern: RegExp) {
    return this.load().then(() => this._fastfs.matchFilesByPattern(pattern));
  }

  _getRequestPlatform(entryPath: string, platform: string) {
    if (platform == null) {
      platform = getPlatformExtension(entryPath, this._opts.platforms);
    } else if (!this._opts.platforms.has(platform)) {
      throw new Error('Unrecognized platform: ' + platform);
    }
    return platform;
  }

  _getAbsolutePath(filePath) {
    if (isAbsolutePath(filePath)) {
      return path.resolve(filePath);
    }

    for (let i = 0; i < this._opts.roots.length; i++) {
      const root = this._opts.roots[i];
      const potentialAbsPath = path.join(root, filePath);
      if (this._fastfs.fileExists(potentialAbsPath)) {
        return path.resolve(potentialAbsPath);
      }
    }

    throw new NotFoundError(
      'Cannot find entry file %s in any of the roots: %j',
      filePath,
      this._opts.roots
    );
  }

  processFileChange(type: string, filePath: string, stat: Object) {
    this._fastfs.processFileChange(type, filePath, stat);
    this._moduleCache.processFileChange(type, filePath, stat);
    if (this._assetPattern.test(filePath)) {
      this._deprecatedAssetMap.processFileChange(type, filePath, stat);
    }

    // This code reports failures but doesn't block recovery in the dev server
    // mode. When the hasteMap is left in an incorrect state, we'll rebuild when
    // the next file changes.
    const resolve = () => {
      if (this._hasteMapError) {
        console.warn(
          'Rebuilding haste map to recover from error:\n' +
          this._hasteMapError.stack
        );
        this._hasteMapError = null;

        // Rebuild the entire map if last change resulted in an error.
        this._loading = this._hasteMap.build();
      } else {
        this._loading = this._hasteMap.processFileChange(type, filePath);
        this._loading.catch(error => {
          this._hasteMapError = error;
        });
      }
      return this._loading;
    };

    this._loading = this._loading.then(resolve, resolve);
  }

  createPolyfill(options: {file: string}) {
    return this._moduleCache.createPolyfill(options);
  }

  getHasteMap() {
    return this._hasteMap;
  }

  static Cache;
  static Fastfs;
  static Module;
  static Polyfill;
  static getAssetDataFromName;
  static getPlatformExtension;
  static replacePatterns;
  static getInverseDependencies;

}

Object.assign(DependencyGraph, {
  Cache,
  Fastfs,
  Module,
  Polyfill,
  getAssetDataFromName,
  getPlatformExtension,
  replacePatterns,
  getInverseDependencies,
});

function NotFoundError() {
  /* $FlowFixMe: monkey-patching */
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  var msg = util.format.apply(util, arguments);
  this.message = msg;
  this.type = this.name = 'NotFoundError';
  this.status = 404;
}
util.inherits(NotFoundError, Error);

function getMaxWorkers() {
  const cores = os.cpus().length;

  if (cores <= 1) {
    // oh well...
    return 1;
  }
  if (cores <= 4) {
    // don't starve the CPU while still reading reasonably rapidly
    return cores - 1;
  }
  if (cores <= 8) {
    // empirical testing showed massive diminishing returns when going over
    // 4 or 5 workers on 8-core machines
    return Math.floor(cores * 0.75) - 1;
  }

  // pretty much guesswork
  if (cores < 24) {
    return Math.floor(3 / 8 * cores + 3);
  }
  return cores / 2;
}

module.exports = DependencyGraph;
