 /**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const Fastfs = require('../fastfs');
const ModuleCache = require('../ModuleCache');
const Promise = require('promise');
const crawl = require('../crawlers');
const getPlatformExtension = require('../lib/getPlatformExtension');
const isAbsolutePath = require('absolute-path');
const path = require('path');
const util = require('util');
const DependencyGraphHelpers = require('./DependencyGraphHelpers');
const ResolutionRequest = require('./ResolutionRequest');
const ResolutionResponse = require('./ResolutionResponse');
const HasteMap = require('./HasteMap');
const DeprecatedAssetMap = require('./DeprecatedAssetMap');

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
  }) {
    this._opts = {
      activity: activity || defaultActivity,
      roots,
      ignoreFilePath: ignoreFilePath || (() => {}),
      fileWatcher,
      assetRoots_DEPRECATED: assetRoots_DEPRECATED || [],
      assetExts: assetExts || [],
      providesModuleNodeModules,
      platforms: platforms || [],
      preferNativePlatform: preferNativePlatform || false,
      extensions: extensions || ['js', 'json'],
      mocksPattern,
      extractRequires,
      shouldThrowOnUnresolvedErrors,
      transformCode,
    };
    this._cache = cache;
    this._helpers = new DependencyGraphHelpers(this._opts);
    this.load();
  }

  load() {
    if (this._loading) {
      return this._loading;
    }

    const {activity} = this._opts;
    const depGraphActivity = activity.startEvent('Building Dependency Graph');
    const crawlActivity = activity.startEvent('Crawling File System');
    const allRoots = this._opts.roots.concat(this._opts.assetRoots_DEPRECATED);
    this._crawling = crawl(allRoots, {
      ignore: this._opts.ignoreFilePath,
      exts: this._opts.extensions.concat(this._opts.assetExts),
      fileWatcher: this._opts.fileWatcher,
    });
    this._crawling.then((files) => activity.endEvent(crawlActivity));

    this._fastfs = new Fastfs(
      'JavaScript',
      this._opts.roots,
      this._opts.fileWatcher,
      {
        ignore: this._opts.ignoreFilePath,
        crawling: this._crawling,
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
    });

    this._hasteMap = new HasteMap({
      fastfs: this._fastfs,
      extensions: this._opts.extensions,
      moduleCache: this._moduleCache,
      preferNativePlatform: this._opts.preferNativePlatform,
      helpers: this._helpers,
    });

    this._deprecatedAssetMap = new DeprecatedAssetMap({
      fsCrawl: this._crawling,
      roots: this._opts.assetRoots_DEPRECATED,
      helpers: this._helpers,
      fileWatcher: this._opts.fileWatcher,
      ignoreFilePath: this._opts.ignoreFilePath,
      assetExts: this._opts.assetExts,
      activity: this._opts.activity,
    });

    this._loading = Promise.all([
      this._fastfs.build()
        .then(() => {
          const hasteActivity = activity.startEvent('Building Haste Map');
          return this._hasteMap.build().then(() => activity.endEvent(hasteActivity));
        }),
      this._deprecatedAssetMap.build(),
    ]).then(() =>
      activity.endEvent(depGraphActivity)
    ).catch(err => {
      const error = new Error(
        `Failed to build DependencyGraph: ${err.message}`
      );
      error.type = ERROR_BUILDING_DEP_GRAPH;
      error.stack = err.stack;
      throw error;
    });

    return this._loading;
  }

  /**
   * Returns a promise with the direct dependencies the module associated to
   * the given entryPath has.
   */
  getShallowDependencies(entryPath) {
    return this._moduleCache.getModule(entryPath).getDependencies();
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

  getDependencies(entryPath, platform, recursive = true) {
    return this.load().then(() => {
      platform = this._getRequestPlatform(entryPath, platform);
      const absPath = this._getAbsolutePath(entryPath);
      const req = new ResolutionRequest({
        platform,
        preferNativePlatform: this._opts.preferNativePlatform,
        entryPath: absPath,
        deprecatedAssetMap: this._deprecatedAssetMap,
        hasteMap: this._hasteMap,
        helpers: this._helpers,
        moduleCache: this._moduleCache,
        fastfs: this._fastfs,
        shouldThrowOnUnresolvedErrors: this._opts.shouldThrowOnUnresolvedErrors,
      });

      const response = new ResolutionResponse();

      return Promise.all([
        req.getOrderedDependencies(
          response,
          this._opts.mocksPattern,
          recursive,
        ),
        req.getAsyncDependencies(response),
      ]).then(() => response);
    });
  }

  matchFilesByPattern(pattern) {
    return this.load().then(() => this._fastfs.matchFilesByPattern(pattern));
  }

  _getRequestPlatform(entryPath, platform) {
    if (platform == null) {
      platform = getPlatformExtension(entryPath);
      if (platform == null || this._opts.platforms.indexOf(platform) === -1) {
        platform = null;
      }
    } else if (this._opts.platforms.indexOf(platform) === -1) {
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
    this._loading = this._loading.finally(() => {
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
        this._loading.catch((e) => this._hasteMapError = e);
      }
      return this._loading;
    });
  }

}

function NotFoundError() {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  var msg = util.format.apply(util, arguments);
  this.message = msg;
  this.type = this.name = 'NotFoundError';
  this.status = 404;
}
util.inherits(NotFoundError, Error);

module.exports = DependencyGraph;
