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

const crypto = require('crypto');
const docblock = require('./DependencyGraph/docblock');
const fs = require('fs');
const invariant = require('fbjs/lib/invariant');
const isAbsolutePath = require('absolute-path');
const jsonStableStringify = require('json-stable-stringify');

const {join: joinPath, relative: relativePath, extname} = require('path');

import type {
  TransformedCode,
  Options as WorkerOptions,
} from '../JSTransformer/worker';
import type {GlobalTransformCache} from '../lib/GlobalTransformCache';
import type {MappingsMap} from '../lib/SourceMap';
import type {
  TransformCache,
  GetTransformCacheKey,
  ReadTransformProps,
} from '../lib/TransformCaching';
import type {Reporter} from '../lib/reporting';
import type DependencyGraphHelpers
  from './DependencyGraph/DependencyGraphHelpers';
import type ModuleCache from './ModuleCache';
import type {LocalPath} from './lib/toLocalPath';

export type ReadResult = {
  +code: string,
  +dependencies: Array<string>,
  +dependencyOffsets?: ?Array<number>,
  +map?: ?MappingsMap,
  +source: string,
};

export type CachedReadResult = {|
  +result: ?ReadResult,
  +outdatedDependencies: $ReadOnlyArray<string>,
|};

export type TransformCode = (
  module: Module,
  sourceCode: string,
  transformOptions: WorkerOptions,
) => Promise<TransformedCode>;

export type HasteImpl = {
  getHasteName(filePath: string): string | void,
  // This exists temporarily to enforce consistency while we deprecate
  // @providesModule.
  enforceHasteNameMatches?: (
    filePath: string,
    expectedName: string | void,
  ) => void,
};

export type Options = {
  hasteImpl?: HasteImpl,
  resetCache?: boolean,
  transformCache: TransformCache,
};

export type ConstructorArgs = {
  depGraphHelpers: DependencyGraphHelpers,
  file: string,
  getTransformCacheKey: GetTransformCacheKey,
  globalTransformCache: ?GlobalTransformCache,
  localPath: LocalPath,
  moduleCache: ModuleCache,
  options: Options,
  reporter: Reporter,
  transformCode: ?TransformCode,
};

type DocBlock = {+[key: string]: string};

class Module {
  localPath: LocalPath;
  path: string;
  type: string;

  _moduleCache: ModuleCache;
  _transformCode: ?TransformCode;
  _getTransformCacheKey: GetTransformCacheKey;
  _depGraphHelpers: DependencyGraphHelpers;
  _options: Options;
  _reporter: Reporter;
  _globalCache: ?GlobalTransformCache;

  _docBlock: ?DocBlock;
  _hasteNameCache: ?{+hasteName: ?string};
  _sourceCode: ?string;
  _readPromises: Map<string, Promise<ReadResult>>;

  _readResultsByOptionsKey: Map<string, CachedReadResult>;

  static _transformCache: TransformCache;

  constructor({
    depGraphHelpers,
    localPath,
    file,
    getTransformCacheKey,
    globalTransformCache,
    moduleCache,
    options,
    reporter,
    transformCode,
  }: ConstructorArgs) {
    if (!isAbsolutePath(file)) {
      throw new Error('Expected file to be absolute path but got ' + file);
    }

    this.localPath = localPath;
    this.path = file;
    this.type = 'Module';

    this._moduleCache = moduleCache;
    this._transformCode = transformCode;
    this._getTransformCacheKey = getTransformCacheKey;
    this._depGraphHelpers = depGraphHelpers;
    this._options = options || {};
    this._reporter = reporter;
    this._globalCache = globalTransformCache;

    this._readPromises = new Map();
    this._readResultsByOptionsKey = new Map();
  }

  isHaste(): boolean {
    return this._getHasteName() != null;
  }

  getCode(transformOptions: WorkerOptions) {
    return this.read(transformOptions).then(({code}) => code);
  }

  getMap(transformOptions: WorkerOptions) {
    return this.read(transformOptions).then(({map}) => map);
  }

  getName(): Promise<string> {
    return Promise.resolve().then(() => {
      const name = this._getHasteName();
      if (name != null) {
        return name;
      }

      const p = this.getPackage();

      if (!p) {
        // Name is full path
        return this.path;
      }

      return p.getName().then(packageName => {
        if (!packageName) {
          return this.path;
        }

        return joinPath(packageName, relativePath(p.root, this.path)).replace(
          /\\/g,
          '/',
        );
      });
    });
  }

  getPackage() {
    return this._moduleCache.getPackageForModule(this);
  }

  getDependencies(transformOptions: WorkerOptions) {
    return this.read(transformOptions).then(({dependencies}) => dependencies);
  }

  /**
   * We don't need to invalidate the TranformCache itself because it guarantees
   * itself that if a source code changed we won't return the cached transformed
   * code.
   */
  invalidate() {
    this._readPromises.clear();
    this._readResultsByOptionsKey.clear();
    this._sourceCode = null;
    this._docBlock = null;
    this._hasteNameCache = null;
  }

  _readSourceCode(): string {
    if (this._sourceCode == null) {
      this._sourceCode = fs.readFileSync(this.path, 'utf8');
    }
    return this._sourceCode;
  }

  _readDocBlock(): DocBlock {
    if (this._docBlock == null) {
      this._docBlock = docblock.parseAsObject(this._readSourceCode());
    }
    return this._docBlock;
  }

  _getHasteName(): ?string {
    if (this._hasteNameCache == null) {
      this._hasteNameCache = {hasteName: this._readHasteName()};
    }
    return this._hasteNameCache.hasteName;
  }

  /**
   * If a custom Haste implementation is provided, then we use it to determine
   * the actual Haste name instead of "@providesModule".
   * `enforceHasteNameMatches` has been added to that it is easier to
   * transition from a system using "@providesModule" to a system using another
   * custom system, by throwing if inconsistencies are detected. For example,
   * we could verify that the file's basename (ex. "bar/foo.js") is the same as
   * the "@providesModule" name (ex. "foo").
   */
  _readHasteName(): ?string {
    const hasteImpl = this._options.hasteImpl;
    if (hasteImpl == null) {
      return this._readHasteNameFromDocBlock();
    }
    const {enforceHasteNameMatches} = hasteImpl;
    if (enforceHasteNameMatches != null) {
      const name = this._readHasteNameFromDocBlock();
      enforceHasteNameMatches(this.path, name || undefined);
    }
    return hasteImpl.getHasteName(this.path);
  }

  /**
   * We extract the Haste name from the `@providesModule` docbloc field. This is
   * not allowed for modules living in `node_modules`, except if they are
   * whitelisted.
   */
  _readHasteNameFromDocBlock(): ?string {
    const moduleDocBlock = this._readDocBlock();
    const {providesModule} = moduleDocBlock;
    if (providesModule && !this._depGraphHelpers.isNodeModulesDir(this.path)) {
      return /^\S+/.exec(providesModule)[0];
    }
    return null;
  }

  /**
   * To what we read from the cache or worker, we need to add id and source.
   */
  _finalizeReadResult(source: string, result: TransformedCode): ReadResult {
    return {...result, id: this._getHasteName(), source};
  }

  async _transformCodeFor(
    cacheProps: ReadTransformProps,
  ): Promise<TransformedCode> {
    const {_transformCode} = this;
    invariant(_transformCode != null, 'missing code transform funtion');
    const {sourceCode, transformOptions} = cacheProps;
    return await _transformCode(this, sourceCode, transformOptions);
  }

  async _transformAndStoreCodeGlobally(
    cacheProps: ReadTransformProps,
    globalCache: GlobalTransformCache,
  ): Promise<TransformedCode> {
    const result = await this._transformCodeFor(cacheProps);
    globalCache.store(cacheProps, result);
    return result;
  }

  async _getTransformedCode(
    cacheProps: ReadTransformProps,
  ): Promise<TransformedCode> {
    const {_globalCache} = this;
    if (_globalCache == null || !_globalCache.shouldFetch(cacheProps)) {
      return await this._transformCodeFor(cacheProps);
    }
    const globalCachedResult = await _globalCache.fetch(cacheProps);
    if (globalCachedResult != null) {
      return globalCachedResult;
    }
    return await this._transformAndStoreCodeGlobally(cacheProps, _globalCache);
  }

  async _getAndCacheTransformedCode(
    cacheProps: ReadTransformProps,
  ): Promise<TransformedCode> {
    const result = await this._getTransformedCode(cacheProps);
    this._options.transformCache.writeSync({...cacheProps, result});
    return result;
  }

  /**
   * Shorthand for reading both from cache or from fresh for all call sites that
   * are asynchronous by default.
   */
  read(transformOptions: WorkerOptions): Promise<ReadResult> {
    return Promise.resolve().then(() => {
      const cached = this.readCached(transformOptions);
      if (cached.result != null) {
        return cached.result;
      }
      return this.readFresh(transformOptions);
    });
  }

  /**
   * Same as `readFresh`, but reads from the cache instead of transforming
   * the file from source. This has the benefit of being synchronous. As a
   * result it is possible to read many cached Module in a row, synchronously.
   */
  readCached(transformOptions: WorkerOptions): CachedReadResult {
    const key = stableObjectHash(transformOptions || {});
    let result = this._readResultsByOptionsKey.get(key);
    if (result != null) {
      return result;
    }
    result = this._readFromTransformCache(transformOptions, key);
    this._readResultsByOptionsKey.set(key, result);
    return result;
  }

  /**
   * Read again from the TransformCache, on disk. `readCached` should be favored
   * so it's faster in case the results are already in memory.
   */
  _readFromTransformCache(
    transformOptions: WorkerOptions,
    transformOptionsKey: string,
  ): CachedReadResult {
    const cacheProps = this._getCacheProps(
      transformOptions,
      transformOptionsKey,
    );
    const cachedResult = this._options.transformCache.readSync(cacheProps);
    if (cachedResult.result == null) {
      return {
        result: null,
        outdatedDependencies: cachedResult.outdatedDependencies,
      };
    }
    return {
      result: this._finalizeReadResult(
        cacheProps.sourceCode,
        cachedResult.result,
      ),
      outdatedDependencies: [],
    };
  }

  /**
   * Gathers relevant data about a module: source code, transformed code,
   * dependencies, etc. This function reads and transforms the source from
   * scratch. We don't repeat the same work as `readCached` because we assume
   * call sites have called it already.
   */
  readFresh(transformOptions: WorkerOptions): Promise<ReadResult> {
    const key = stableObjectHash(transformOptions || {});
    const promise = this._readPromises.get(key);
    if (promise != null) {
      return promise;
    }
    const freshPromise = (async () => {
      const cacheProps = this._getCacheProps(transformOptions, key);
      const freshResult = await this._getAndCacheTransformedCode(cacheProps);
      const finalResult = this._finalizeReadResult(
        cacheProps.sourceCode,
        freshResult,
      );
      this._readResultsByOptionsKey.set(key, {
        result: finalResult,
        outdatedDependencies: [],
      });
      return finalResult;
    })();
    this._readPromises.set(key, freshPromise);
    return freshPromise;
  }

  _getCacheProps(transformOptions: WorkerOptions, transformOptionsKey: string) {
    const sourceCode = this._readSourceCode();
    const getTransformCacheKey = this._getTransformCacheKey;
    return {
      filePath: this.path,
      localPath: this.localPath,
      sourceCode,
      getTransformCacheKey,
      transformOptions,
      transformOptionsKey,
      cacheOptions: {
        resetCache: this._options.resetCache,
        reporter: this._reporter,
      },
    };
  }

  hash() {
    return `Module : ${this.path}`;
  }

  isJSON() {
    return extname(this.path) === '.json';
  }

  isAsset() {
    return false;
  }

  isPolyfill() {
    return false;
  }
}

// use weak map to speed up hash creation of known objects
const knownHashes = new WeakMap();
function stableObjectHash(object) {
  let digest = knownHashes.get(object);
  if (!digest) {
    digest = crypto
      .createHash('md5')
      .update(jsonStableStringify(object))
      .digest('base64');
    knownHashes.set(object, digest);
  }

  return digest;
}

module.exports = Module;
