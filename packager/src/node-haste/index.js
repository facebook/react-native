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
} = require('../Logger');
const {EventEmitter} = require('events');

import type {Options as TransformOptions} from '../JSTransformer/worker/worker';
import type GlobalTransformCache from '../lib/GlobalTransformCache';
import type {GetTransformCacheKey} from '../lib/TransformCache';
import type {Reporter} from '../lib/reporting';
import type {ModuleMap} from './DependencyGraph/ResolutionRequest';
import type {
  Options as ModuleOptions,
  TransformCode,
} from './Module';
import type {HasteFS} from './types';

type Options = {
  assetDependencies: Array<string>,
  assetExts: Array<string>,
  cache: Cache,
  extensions: Array<string>,
  extraNodeModules: ?Object,
  forceNodeFilesystemAPI: boolean,
  getTransformCacheKey: GetTransformCacheKey,
  globalTransformCache: ?GlobalTransformCache,
  ignoreFilePath: (filePath: string) => boolean,
  maxWorkers: ?number,
  moduleOptions: ModuleOptions,
  platforms: Set<string>,
  preferNativePlatform: boolean,
  providesModuleNodeModules: Array<string>,
  reporter: Reporter,
  resetCache: boolean,
  roots: Array<string>,
  transformCode: TransformCode,
  useWatchman: boolean,
  watch: boolean,
};

class DependencyGraph extends EventEmitter {

  _opts: Options;
  _haste: JestHasteMap;
  _helpers: DependencyGraphHelpers;
  _moduleCache: ModuleCache;
  _hasteFS: HasteFS;
  _moduleMap: ModuleMap;

  constructor(config: {
    opts: Options,
    haste: JestHasteMap,
    initialHasteFS: HasteFS,
    initialModuleMap: ModuleMap,
  }) {
    super();
    this._opts = {...config.opts};
    this._haste = config.haste;
    this._hasteFS = config.initialHasteFS;
    this._moduleMap = config.initialModuleMap;
    this._helpers = new DependencyGraphHelpers(this._opts);
    this._haste.on('change', this._onHasteChange.bind(this));
    this._moduleCache = this._createModuleCache();
  }

  static _createHaste(opts: Options): JestHasteMap {
    const mw = opts.maxWorkers;
    return new JestHasteMap({
      extensions: opts.extensions.concat(opts.assetExts),
      forceNodeFilesystemAPI: opts.forceNodeFilesystemAPI,
      ignorePattern: {test: opts.ignoreFilePath},
      maxWorkers: typeof mw === 'number' && mw >= 1 ? mw : getMaxWorkers(),
      mocksPattern: '',
      name: 'react-native-packager',
      platforms: Array.from(opts.platforms),
      providesModuleNodeModules: opts.providesModuleNodeModules,
      resetCache: opts.resetCache,
      retainAllFiles: true,
      roots: opts.roots,
      useWatchman: opts.useWatchman,
      watch: opts.watch,
    });
  }

  static load(opts: Options): Promise<DependencyGraph> {
    const initializingPackagerLogEntry =
      log(createActionStartEntry('Initializing Packager'));
    opts.reporter.update({type: 'dep_graph_loading'});
    const haste = DependencyGraph._createHaste(opts);
    return haste.build().then(({hasteFS, moduleMap}) => {
      log(createActionEndEntry(initializingPackagerLogEntry));
      opts.reporter.update({type: 'dep_graph_loaded'});
      return new DependencyGraph({
        opts,
        haste,
        initialHasteFS: hasteFS,
        initialModuleMap: moduleMap,
      });
    });
  }

  _getClosestPackage(filePath: string): ?string {
    const parsedPath = path.parse(filePath);
    const root = parsedPath.root;
    let dir = parsedPath.dir;
    do {
      const candidate = path.join(dir, 'package.json');
      if (this._hasteFS.exists(candidate)) {
        return candidate;
      }
      dir = path.dirname(dir);
    } while (dir !== '.' && dir !== root);
    return null;
  }

  _onHasteChange({eventsQueue, hasteFS, moduleMap}) {
    this._hasteFS = hasteFS;
    this._moduleMap = moduleMap;
    eventsQueue.forEach(({type, filePath, stat}) =>
      this._moduleCache.processFileChange(type, filePath, stat)
    );
    this.emit('change');
  }

  _createModuleCache() {
    const {_opts} = this;
    return new ModuleCache({
      cache: _opts.cache,
      getTransformCacheKey: _opts.getTransformCacheKey,
      globalTransformCache: _opts.globalTransformCache,
      transformCode: _opts.transformCode,
      depGraphHelpers: this._helpers,
      assetDependencies: _opts.assetDependencies,
      moduleOptions: _opts.moduleOptions,
      reporter: _opts.reporter,
      getClosestPackage: this._getClosestPackage.bind(this),
    }, _opts.platforms);
  }

  /**
   * Returns a promise with the direct dependencies the module associated to
   * the given entryPath has.
   */
  getShallowDependencies(entryPath: string, transformOptions: TransformOptions) {
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
    return Promise.resolve(this._moduleCache.getAllModules());
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
  }): Promise<ResolutionResponse> {
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
      helpers: this._helpers,
      moduleCache: this._moduleCache,
      moduleMap: this._moduleMap,
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
  }

  matchFilesByPattern(pattern: RegExp) {
    return Promise.resolve(this._hasteFS.matchFiles(pattern));
  }

  _getRequestPlatform(entryPath: string, platform: string) {
    if (platform == null) {
      platform = getPlatformExtension(entryPath, this._opts.platforms);
    } else if (!this._opts.platforms.has(platform)) {
      throw new Error('Unrecognized platform: ' + platform);
    }
    return platform;
  }

  _getAbsolutePath(filePath: string) {
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

  createPolyfill(options: {file: string}) {
    return this._moduleCache.createPolyfill(options);
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
