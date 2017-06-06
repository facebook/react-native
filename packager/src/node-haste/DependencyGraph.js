/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

'use strict';

const AssetResolutionCache = require('./AssetResolutionCache');
const DependencyGraphHelpers = require('./DependencyGraph/DependencyGraphHelpers');
const FilesByDirNameIndex = require('./FilesByDirNameIndex');
const JestHasteMap = require('jest-haste-map');
const Module = require('./Module');
const ModuleCache = require('./ModuleCache');
const ResolutionRequest = require('./DependencyGraph/ResolutionRequest');
const ResolutionResponse = require('./DependencyGraph/ResolutionResponse');

const fs = require('fs');
const invariant = require('fbjs/lib/invariant');
const isAbsolutePath = require('absolute-path');
const parsePlatformFilePath = require('./lib/parsePlatformFilePath');
const path = require('path');
const util = require('util');

const {
  createActionEndEntry,
  createActionStartEntry,
  log,
} = require('../Logger');
const {EventEmitter} = require('events');

import type {Options as JSTransformerOptions} from '../JSTransformer/worker';
import type {GlobalTransformCache} from '../lib/GlobalTransformCache';
import type {GetTransformCacheKey} from '../lib/TransformCaching';
import type {Reporter} from '../lib/reporting';
import type {ModuleMap} from './DependencyGraph/ResolutionRequest';
import type {Options as ModuleOptions, TransformCode} from './Module';
import type {HasteFS} from './types';

type Options = {|
  +assetDependencies: Array<string>,
  +assetExts: Array<string>,
  +extraNodeModules: ?{},
  +forceNodeFilesystemAPI: boolean,
  +getTransformCacheKey: GetTransformCacheKey,
  +globalTransformCache: ?GlobalTransformCache,
  +ignoreFilePath: (filePath: string) => boolean,
  +maxWorkerCount: number,
  +moduleOptions: ModuleOptions,
  +platforms: Set<string>,
  +preferNativePlatform: boolean,
  +providesModuleNodeModules: Array<string>,
  +reporter: Reporter,
  +resetCache: boolean,
  +roots: $ReadOnlyArray<string>,
  +sourceExts: Array<string>,
  +transformCode: TransformCode,
  +useWatchman: boolean,
  +watch: boolean,
|};

const JEST_HASTE_MAP_CACHE_BREAKER = 1;

class DependencyGraph extends EventEmitter {
  _assetResolutionCache: AssetResolutionCache;
  _filesByDirNameIndex: FilesByDirNameIndex;
  _haste: JestHasteMap;
  _hasteFS: HasteFS;
  _helpers: DependencyGraphHelpers;
  _moduleCache: ModuleCache;
  _moduleMap: ModuleMap;
  _opts: Options;

  constructor(config: {|
    +opts: Options,
    +haste: JestHasteMap,
    +initialHasteFS: HasteFS,
    +initialModuleMap: ModuleMap,
  |}) {
    super();
    invariant(
      config.opts.maxWorkerCount >= 1,
      'worker count must be greater or equal to 1',
    );
    this._opts = config.opts;
    this._filesByDirNameIndex = new FilesByDirNameIndex(
      config.initialHasteFS.getAllFiles(),
    );
    this._assetResolutionCache = new AssetResolutionCache({
      assetExtensions: new Set(config.opts.assetExts),
      getDirFiles: dirPath => this._filesByDirNameIndex.getAllFiles(dirPath),
      platforms: config.opts.platforms,
    });
    this._haste = config.haste;
    this._hasteFS = config.initialHasteFS;
    this._moduleMap = config.initialModuleMap;
    this._helpers = new DependencyGraphHelpers(this._opts);
    this._haste.on('change', this._onHasteChange.bind(this));
    this._moduleCache = this._createModuleCache();
  }

  static _createHaste(opts: Options): JestHasteMap {
    return new JestHasteMap({
      extensions: opts.sourceExts.concat(opts.assetExts),
      forceNodeFilesystemAPI: opts.forceNodeFilesystemAPI,
      ignorePattern: opts.ignoreFilePath,
      maxWorkers: opts.maxWorkerCount,
      mocksPattern: '',
      name: 'react-native-packager-' + JEST_HASTE_MAP_CACHE_BREAKER,
      platforms: Array.from(opts.platforms),
      providesModuleNodeModules: opts.providesModuleNodeModules,
      resetCache: opts.resetCache,
      retainAllFiles: true,
      roots: opts.roots,
      useWatchman: opts.useWatchman,
      watch: opts.watch,
    });
  }

  static async load(opts: Options): Promise<DependencyGraph> {
    const initializingPackagerLogEntry = log(
      createActionStartEntry('Initializing Packager'),
    );
    opts.reporter.update({type: 'dep_graph_loading'});
    const haste = DependencyGraph._createHaste(opts);
    const {hasteFS, moduleMap} = await haste.build();
    log(createActionEndEntry(initializingPackagerLogEntry));
    opts.reporter.update({type: 'dep_graph_loaded'});
    return new DependencyGraph({
      haste,
      initialHasteFS: hasteFS,
      initialModuleMap: moduleMap,
      opts,
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
    this._filesByDirNameIndex = new FilesByDirNameIndex(hasteFS.getAllFiles());
    this._assetResolutionCache.clear();
    this._moduleMap = moduleMap;
    eventsQueue.forEach(({type, filePath}) =>
      this._moduleCache.processFileChange(type, filePath),
    );
    this.emit('change');
  }

  _createModuleCache() {
    const {_opts} = this;
    return new ModuleCache(
      {
        assetDependencies: _opts.assetDependencies,
        depGraphHelpers: this._helpers,
        getClosestPackage: this._getClosestPackage.bind(this),
        getTransformCacheKey: _opts.getTransformCacheKey,
        globalTransformCache: _opts.globalTransformCache,
        moduleOptions: _opts.moduleOptions,
        reporter: _opts.reporter,
        roots: _opts.roots,
        transformCode: _opts.transformCode,
      },
      _opts.platforms,
    );
  }

  /**
   * Returns a promise with the direct dependencies the module associated to
   * the given entryPath has.
   */
  getShallowDependencies(
    entryPath: string,
    transformOptions: JSTransformerOptions,
  ): Promise<Array<Module>> {
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

  getDependencies<T: {+transformer: JSTransformerOptions}>({
    entryPath,
    options,
    platform,
    onProgress,
    recursive = true,
  }: {
    entryPath: string,
    options: T,
    platform: ?string,
    onProgress?: ?(finishedModules: number, totalModules: number) => mixed,
    recursive: boolean,
  }): Promise<ResolutionResponse<Module, T>> {
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
      preferNativePlatform: this._opts.preferNativePlatform,
      resolveAsset: (dirPath, assetName) =>
        this._assetResolutionCache.resolve(dirPath, assetName, platform),
      sourceExts: this._opts.sourceExts,
    });

    const response = new ResolutionResponse(options);

    return req
      .getOrderedDependencies({
        response,
        transformOptions: options.transformer,
        onProgress,
        recursive,
      })
      .then(() => response);
  }

  matchFilesByPattern(pattern: RegExp) {
    return Promise.resolve(this._hasteFS.matchFiles(pattern));
  }

  _getRequestPlatform(entryPath: string, platform: ?string): ?string {
    if (platform == null) {
      platform = parsePlatformFilePath(entryPath, this._opts.platforms)
        .platform;
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
      this._opts.roots,
    );
  }

  createPolyfill(options: {file: string}) {
    return this._moduleCache.createPolyfill(options);
  }
}

function NotFoundError(...args) {
  /* $FlowFixMe: monkey-patching */
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  var msg = util.format.apply(util, args);
  this.message = msg;
  this.type = this.name = 'NotFoundError';
  this.status = 404;
}
util.inherits(NotFoundError, Error);

module.exports = DependencyGraph;
