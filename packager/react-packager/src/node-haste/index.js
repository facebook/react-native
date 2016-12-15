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
const HasteMap = require('./DependencyGraph/HasteMap');
const JestHasteMap = require('jest-haste-map');
const Module = require('./Module');
const ModuleCache = require('./ModuleCache');
const Polyfill = require('./Polyfill');
const ResolutionRequest = require('./DependencyGraph/ResolutionRequest');
const ResolutionResponse = require('./DependencyGraph/ResolutionResponse');

const fs = require('fs');
const getAssetDataFromName = require('./lib/getAssetDataFromName');
const getInverseDependencies = require('./lib/getInverseDependencies');
const getPlatformExtension = require('./lib/getPlatformExtension');
const isAbsolutePath = require('absolute-path');
const os = require('os');
const path = require('path');
const replacePatterns = require('./lib/replacePatterns');
const util = require('util');

const {
  createActionEndEntry,
  createActionStartEntry,
  log,
  print,
} = require('../Logger');

import type {Options as TransformOptions} from '../JSTransformer/worker/worker';
import type {
  Options as ModuleOptions,
  TransformCode,
} from './Module';
import type {HasteFS} from './types';

const ERROR_BUILDING_DEP_GRAPH = 'DependencyGraphError';

class DependencyGraph {
  _opts: {|
    assetExts: Array<string>,
    extensions: Array<string>,
    extraNodeModules: Object,
    forceNodeFilesystemAPI: boolean,
    ignoreFilePath: (filePath: string) => boolean,
    maxWorkers: ?number,
    mocksPattern: mixed,
    moduleOptions: ModuleOptions,
    platforms: Set<string>,
    preferNativePlatform: boolean,
    providesModuleNodeModules: Array<string>,
    resetCache: boolean,
    roots: Array<string>,
    shouldThrowOnUnresolvedErrors: () => boolean,
    transformCacheKey: string,
    transformCode: TransformCode,
    useWatchman: boolean,
    watch: boolean,
  |};
  _assetDependencies: mixed;
  _cache: Cache;
  _haste: JestHasteMap;
  _hasteFS: HasteFS;
  _hasteMap: HasteMap;
  _hasteMapError: ?Error;
  _helpers: DependencyGraphHelpers;
  _moduleCache: ModuleCache;

  _loading: Promise<mixed>;

  constructor({
    assetDependencies,
    assetExts,
    cache,
    extensions,
    extraNodeModules,
    forceNodeFilesystemAPI,
    ignoreFilePath,
    maxWorkers,
    mocksPattern,
    moduleOptions,
    platforms,
    preferNativePlatform,
    providesModuleNodeModules,
    resetCache,
    roots,
    shouldThrowOnUnresolvedErrors = () => true,
    transformCacheKey,
    transformCode,
    useWatchman,
    watch,
  }: {
    assetDependencies: mixed,
    assetExts: Array<string>,
    cache: Cache,
    extensions?: ?Array<string>,
    extraNodeModules: Object,
    forceNodeFilesystemAPI?: boolean,
    ignoreFilePath: (filePath: string) => boolean,
    maxWorkers?: ?number,
    mocksPattern?: mixed,
    moduleOptions: ?ModuleOptions,
    platforms: mixed,
    preferNativePlatform: boolean,
    providesModuleNodeModules: Array<string>,
    resetCache: boolean,
    roots: Array<string>,
    shouldThrowOnUnresolvedErrors?: () => boolean,
    transformCacheKey: string,
    transformCode: TransformCode,
    useWatchman?: ?boolean,
    watch: boolean,
  }) {
    this._opts = {
      assetExts: assetExts || [],
      extensions: extensions || ['js', 'json'],
      extraNodeModules,
      forceNodeFilesystemAPI: !!forceNodeFilesystemAPI,
      ignoreFilePath: ignoreFilePath || (() => {}),
      maxWorkers,
      mocksPattern,
      moduleOptions: moduleOptions || {
        cacheTransformResults: true,
      },
      platforms: new Set(platforms || []),
      preferNativePlatform: preferNativePlatform || false,
      providesModuleNodeModules,
      resetCache,
      roots,
      shouldThrowOnUnresolvedErrors,
      transformCacheKey,
      transformCode,
      useWatchman: useWatchman !== false,
      watch: !!watch,
    };

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
      roots: this._opts.roots,
      useWatchman: this._opts.useWatchman,
      watch: this._opts.watch,
    });

    const initializingPackagerLogEntry =
      print(log(createActionStartEntry('Initializing Packager')));
    this._loading = this._haste.build().then(({hasteFS}) => {
      this._hasteFS = hasteFS;
      const hasteFSFiles = hasteFS.getAllFiles();

      this._moduleCache = new ModuleCache({
        cache: this._cache,
        transformCode: this._opts.transformCode,
        transformCacheKey: this._opts.transformCacheKey,
        depGraphHelpers: this._helpers,
        assetDependencies: this._assetDependencies,
        moduleOptions: this._opts.moduleOptions,
        getClosestPackage: filePath => {
          let {dir, root} = path.parse(filePath);
          do {
            const candidate = path.join(dir, 'package.json');
            if (this._hasteFS.exists(candidate)) {
              return candidate;
            }
            dir = path.dirname(dir);
          } while (dir !== '.' && dir !== root);
          return null;
        }
      }, this._opts.platforms);

      this._hasteMap = new HasteMap({
        files: hasteFSFiles,
        extensions: this._opts.extensions,
        moduleCache: this._moduleCache,
        preferNativePlatform: this._opts.preferNativePlatform,
        helpers: this._helpers,
        platforms: this._opts.platforms,
      });

      this._haste.on('change', ({eventsQueue, hasteFS: newHasteFS}) => {
        this._hasteFS = newHasteFS;
        eventsQueue.forEach(({type, filePath, stat}) =>
          this.processFileChange(type, filePath, stat)
        );
      });

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
    transformOptions: TransformOptions,
    onProgress?: ?(finishedModules: number, totalModules: number) => mixed,
    recursive: boolean,
  }) {
    return this.load().then(() => {
      platform = this._getRequestPlatform(entryPath, platform);
      const absPath = this._getAbsolutePath(entryPath);
      const dirExists = filePath => {
        try {
          return fs.lstatSync(filePath).isDirectory();
        } catch (e) {}
        return false;
      };
      const req = new ResolutionRequest({
        dirExists,
        entryPath: absPath,
        extraNodeModules: this._opts.extraNodeModules,
        hasteFS: this._hasteFS,
        hasteMap: this._hasteMap,
        helpers: this._helpers,
        moduleCache: this._moduleCache,
        platform,
        platforms: this._opts.platforms,
        preferNativePlatform: this._opts.preferNativePlatform,
      });

      const response = new ResolutionResponse({transformOptions});

      return req.getOrderedDependencies({
        response,
        transformOptions,
        onProgress,
        recursive,
      }).then(() => response);
    });
  }

  matchFilesByPattern(pattern: RegExp) {
    return this.load().then(() => this._hasteFS.matchFiles(pattern));
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
      if (this._hasteFS.exists(potentialAbsPath)) {
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
    this._moduleCache.processFileChange(type, filePath, stat);

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
  static Module;
  static Polyfill;
  static getAssetDataFromName;
  static getPlatformExtension;
  static replacePatterns;
  static getInverseDependencies;

}

Object.assign(DependencyGraph, {
  Cache,
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
