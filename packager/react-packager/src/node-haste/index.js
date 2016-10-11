/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Cache = require('./Cache');
const Fastfs = require('./fastfs');
const FileWatcher = require('./FileWatcher');
const JestHasteMap = require('jest-haste-map');
const Module = require('./Module');
const ModuleCache = require('./ModuleCache');
const Polyfill = require('./Polyfill');
const extractRequires = require('./lib/extractRequires');
const getAssetDataFromName = require('./lib/getAssetDataFromName');
const getInverseDependencies = require('./lib/getInverseDependencies');
const getPlatformExtension = require('./lib/getPlatformExtension');
const isAbsolutePath = require('absolute-path');
const replacePatterns = require('./lib/replacePatterns');
const path = require('./fastpath');
const util = require('util');
const os = require('os');
const DependencyGraphHelpers = require('./DependencyGraph/DependencyGraphHelpers');
const ResolutionRequest = require('./DependencyGraph/ResolutionRequest');
const ResolutionResponse = require('./DependencyGraph/ResolutionResponse');
const HasteMap = require('./DependencyGraph/HasteMap');
const DeprecatedAssetMap = require('./DependencyGraph/DeprecatedAssetMap');

const ERROR_BUILDING_DEP_GRAPH = 'DependencyGraphError';

const defaultActivity = {
  startEvent: () => {},
  endEvent: () => {},
};

class DependencyGraph {
  constructor({
    activity,
    roots,
    ignoreFilePath,
    fileWatcher,
    assetRoots_DEPRECATED,
    assetExts,
    providesModuleNodeModules,
    platforms,
    preferNativePlatform,
    cache,
    extensions,
    mocksPattern,
    extractRequires,
    transformCode,
    shouldThrowOnUnresolvedErrors = () => true,
    enableAssetMap,
    assetDependencies,
    moduleOptions,
    extraNodeModules,
    // additional arguments for jest-haste-map
    useWatchman,
    maxWorkers,
    resetCache,
  }) {
    this._opts = {
      activity: activity || defaultActivity,
      roots,
      ignoreFilePath: ignoreFilePath || (() => {}),
      fileWatcher,
      assetRoots_DEPRECATED: assetRoots_DEPRECATED || [],
      assetExts: assetExts || [],
      providesModuleNodeModules,
      platforms: new Set(platforms || []),
      preferNativePlatform: preferNativePlatform || false,
      extensions: extensions || ['js', 'json'],
      mocksPattern,
      extractRequires,
      transformCode,
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
    const haste = new JestHasteMap({
      extensions: this._opts.extensions.concat(this._opts.assetExts),
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
    });

    this._loading = haste.build().then(hasteMap => {
      const {activity} = this._opts;
      const depGraphActivity = activity.startEvent(
        'Initializing Packager',
        null,
        {
          telemetric: true,
        },
      );

      const hasteFSFiles = hasteMap.hasteFS.getAllFiles();

      this._fastfs = new Fastfs(
        'JavaScript',
        this._opts.roots,
        this._opts.fileWatcher,
        hasteFSFiles,
        {
          ignore: this._opts.ignoreFilePath,
          activity: activity,
        }
      );

      this._fastfs.on('change', this._processFileChange.bind(this));

      this._moduleCache = new ModuleCache({
        fastfs: this._fastfs,
        cache: this._cache,
        extractRequires: this._opts.extractRequires,
        transformCode: this._opts.transformCode,
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

      const escapePath = (p: string) => {
        return (path.sep === '\\')  ? p.replace(/(\/|\\(?!\.))/g, '\\\\') : p;
      };

      const assetPattern =
        new RegExp('^' + this._opts.assetRoots_DEPRECATED.map(escapePath).join('|'));

      const assetFiles = hasteMap.hasteFS.matchFiles(assetPattern);

      this._deprecatedAssetMap = new DeprecatedAssetMap({
        helpers: this._helpers,
        assetExts: this._opts.assetExts,
        platforms: this._opts.platforms,
        files: assetFiles,
      });

      this._fastfs.on('change', (type, filePath, root, fstat) => {
        if (assetPattern.test(path.join(root, filePath))) {
          this._deprecatedAssetMap.processFileChange(type, filePath, root, fstat);
        }
      });

      const hasteActivity = activity.startEvent(
        'Building Haste Map',
        null,
        {
          telemetric: true,
        },
      );
      return this._hasteMap.build().then(
        map => {
          activity.endEvent(hasteActivity);
          activity.endEvent(depGraphActivity);
          return map;
        },
        err => {
          const error = new Error(
            `Failed to build DependencyGraph: ${err.message}`
          );
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
  getShallowDependencies(entryPath, transformOptions) {
    return this._moduleCache
      .getModule(entryPath)
      .getDependencies(transformOptions);
  }

  getFS() {
    return this._fastfs;
  }

  /**
   * Returns the module object for the given path.
   */
  getModuleForPath(entryFile) {
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

  matchFilesByPattern(pattern) {
    return this.load().then(() => this._fastfs.matchFilesByPattern(pattern));
  }

  _getRequestPlatform(entryPath, platform) {
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

  _processFileChange(type, filePath, root, fstat) {
    const absPath = path.join(root, filePath);
    if (fstat && fstat.isDirectory() ||
        this._opts.ignoreFilePath(absPath) ||
        this._helpers.isNodeModulesDir(absPath)) {
      return;
    }

    // Ok, this is some tricky promise code. Our requirements are:
    // * we need to report back failures
    // * failures shouldn't block recovery
    // * Errors can leave `hasteMap` in an incorrect state, and we need to rebuild
    // After we process a file change we record any errors which will also be
    // reported via the next request. On the next file change, we'll see that
    // we are in an error state and we should decide to do a full rebuild.
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
        this._loading = this._hasteMap.processFileChange(type, absPath);
        this._loading.catch((e) => {this._hasteMapError = e;});
      }
      return this._loading;
    };
    this._loading = this._loading.then(resolve, resolve);
  }

  createPolyfill(options) {
    return this._moduleCache.createPolyfill(options);
  }

  getHasteMap() {
    return this._hasteMap;
  }
}

Object.assign(DependencyGraph, {
  Cache,
  Fastfs,
  FileWatcher,
  Module,
  Polyfill,
  extractRequires,
  getAssetDataFromName,
  getPlatformExtension,
  replacePatterns,
  getInverseDependencies,
});

function NotFoundError() {
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
