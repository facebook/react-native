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

const TransformCache = require('../lib/TransformCache');

const crypto = require('crypto');
const docblock = require('./DependencyGraph/docblock');
const fs = require('fs');
const invariant = require('fbjs/lib/invariant');
const isAbsolutePath = require('absolute-path');
const jsonStableStringify = require('json-stable-stringify');

const {join: joinPath, relative: relativePath, extname} = require('path');

import type {TransformedCode, Options as TransformOptions} from '../JSTransformer/worker/worker';
import type GlobalTransformCache from '../lib/GlobalTransformCache';
import type {SourceMap} from '../lib/SourceMap';
import type {GetTransformCacheKey} from '../lib/TransformCache';
import type {ReadTransformProps} from '../lib/TransformCache';
import type {Reporter} from '../lib/reporting';
import type Cache from './Cache';
import type DependencyGraphHelpers from './DependencyGraph/DependencyGraphHelpers';
import type ModuleCache from './ModuleCache';

export type ReadResult = {
  code: string,
  dependencies?: ?Array<string>,
  dependencyOffsets?: ?Array<number>,
  map?: ?SourceMap,
  source: string,
};

export type TransformCode = (
  module: Module,
  sourceCode: string,
  transformOptions: TransformOptions,
) => Promise<TransformedCode>;

export type HasteImpl = {
  getHasteName(filePath: string): (string | void),
  // This exists temporarily to enforce consistency while we deprecate
  // @providesModule.
  enforceHasteNameMatches?: (
    filePath: string,
    expectedName: (string | void),
  ) => void,
};

export type Options = {
  cacheTransformResults?: boolean,
  hasteImpl?: HasteImpl,
  resetCache?: boolean,
};

export type ConstructorArgs = {
  cache: Cache,
  depGraphHelpers: DependencyGraphHelpers,
  globalTransformCache: ?GlobalTransformCache,
  file: string,
  moduleCache: ModuleCache,
  options: Options,
  reporter: Reporter,
  getTransformCacheKey: GetTransformCacheKey,
  transformCode: ?TransformCode,
};

class Module {

  path: string;
  type: string;

  _moduleCache: ModuleCache;
  _cache: Cache;
  _transformCode: ?TransformCode;
  _getTransformCacheKey: GetTransformCacheKey;
  _depGraphHelpers: DependencyGraphHelpers;
  _options: Options;
  _reporter: Reporter;
  _globalCache: ?GlobalTransformCache;

  _docBlock: Promise<{[key: string]: string}>;
  _hasteName: Promise<string | void>;
  _readSourceCodePromise: Promise<string>;
  _readPromises: Map<string, Promise<ReadResult>>;

  constructor({
    cache,
    depGraphHelpers,
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

    this.path = file;
    this.type = 'Module';

    this._moduleCache = moduleCache;
    this._cache = cache;
    this._transformCode = transformCode;
    this._getTransformCacheKey = getTransformCacheKey;
    this._depGraphHelpers = depGraphHelpers;
    this._options = options || {};
    this._reporter = reporter;
    this._globalCache = globalTransformCache;

    this._readPromises = new Map();
  }

  isHaste(): Promise<boolean> {
    return this._cache.get(
      this.path,
      'isHaste',
      () => this._getHasteName().then(name => !!name),
    );
  }

  getCode(transformOptions: TransformOptions) {
    return this.read(transformOptions).then(({code}) => code);
  }

  getMap(transformOptions: TransformOptions) {
    return this.read(transformOptions).then(({map}) => map);
  }

  getName(): Promise<string> {
    return this._cache.get(
      this.path,
      'name',
      () => this._getHasteName().then(name => {
        if (name !== undefined) {
          return name;
        }

        const p = this.getPackage();

        if (!p) {
          // Name is full path
          return this.path;
        }

        return p.getName()
          .then(packageName => {
            if (!packageName) {
              return this.path;
            }

            return joinPath(packageName, relativePath(p.root, this.path)).replace(/\\/g, '/');
          });
      })
    );
  }

  getPackage() {
    return this._moduleCache.getPackageForModule(this);
  }

  getDependencies(transformOptions: TransformOptions) {
    return this.read(transformOptions).then(({dependencies}) => dependencies);
  }

  /**
   * We don't need to invalidate the TranformCache itself because it guarantees
   * itself that if a source code changed we won't return the cached transformed
   * code.
   */
  invalidate() {
    this._cache.invalidate(this.path);
    this._readPromises.clear();
  }

  _readSourceCode() {
    if (!this._readSourceCodePromise) {
      this._readSourceCodePromise = new Promise(
        resolve => resolve(fs.readFileSync(this.path, 'utf8'))
      );
    }
    return this._readSourceCodePromise;
  }

  _readDocBlock() {
    if (!this._docBlock) {
      this._docBlock = this._readSourceCode()
        .then(source => docblock.parseAsObject(source));
    }
    return this._docBlock;
  }

  _getHasteName(): Promise<string | void> {
    if (!this._hasteName) {
      const hasteImpl = this._options.hasteImpl;
      if (hasteImpl === undefined || hasteImpl.enforceHasteNameMatches) {
        this._hasteName = this._readDocBlock().then(moduleDocBlock => {
          const {providesModule} = moduleDocBlock;
          return providesModule
            && !this._depGraphHelpers.isNodeModulesDir(this.path)
              ? /^\S+/.exec(providesModule)[0]
              : undefined;
        });
      }
      if (hasteImpl !== undefined) {
        const {enforceHasteNameMatches} = hasteImpl;
        if (enforceHasteNameMatches) {
          this._hasteName = this._hasteName.then(providesModule => {
            enforceHasteNameMatches(
              this.path,
              providesModule,
            );
            return hasteImpl.getHasteName(this.path);
          });
        } else {
          this._hasteName = Promise.resolve(hasteImpl.getHasteName(this.path));
        }
      } else {
        // Extract an id for the module if it's using @providesModule syntax
        // and if it's NOT in node_modules (and not a whitelisted node_module).
        // This handles the case where a project may have a dep that has @providesModule
        // docblock comments, but doesn't want it to conflict with whitelisted @providesModule
        // modules, such as react-haste, fbjs-haste, or react-native or with non-dependency,
        // project-specific code that is using @providesModule.
        this._hasteName = this._readDocBlock().then(moduleDocBlock => {
          const {providesModule} = moduleDocBlock;
          return providesModule
            && !this._depGraphHelpers.isNodeModulesDir(this.path)
              ? /^\S+/.exec(providesModule)[0]
              : undefined;
        });
      }
    }
    return this._hasteName;
  }

  /**
   * To what we read from the cache or worker, we need to add id and source.
   */
  _finalizeReadResult(
    source: string,
    id?: string,
    extern: boolean,
    result: TransformedCode,
  ): ReadResult {
    if (this._options.cacheTransformResults === false) {
      const {dependencies} = result;
      /* $FlowFixMe: this code path is dead, remove. */
      return {dependencies};
    }
    return {...result, id, source};
  }

  _transformCodeForCallback(
    cacheProps: ReadTransformProps,
    callback: (error: ?Error, result: ?TransformedCode) => void,
  ) {
    const {_transformCode} = this;
    invariant(_transformCode != null, 'missing code transform funtion');
    const {sourceCode, transformOptions} = cacheProps;
    return _transformCode(this, sourceCode, transformOptions).then(
      freshResult => process.nextTick(callback, undefined, freshResult),
      error => process.nextTick(callback, error),
    );
  }

  _transformAndStoreCodeGlobally(
    cacheProps: ReadTransformProps,
    globalCache: GlobalTransformCache,
    callback: (error: ?Error, result: ?TransformedCode) => void,
  ) {
    this._transformCodeForCallback(
      cacheProps,
      (transformError, transformResult) => {
        if (transformError != null) {
          callback(transformError);
          return;
        }
        invariant(
          transformResult != null,
          'Inconsistent state: there is no error, but no results either.',
        );
        globalCache.store(cacheProps, transformResult);
        callback(undefined, transformResult);
      },
    );
  }

  _getTransformedCode(
    cacheProps: ReadTransformProps,
    callback: (error: ?Error, result: ?TransformedCode) => void,
  ) {
    const {_globalCache} = this;
    if (_globalCache == null) {
      this._transformCodeForCallback(cacheProps, callback);
      return;
    }
    _globalCache.fetch(cacheProps, (globalCacheError, globalCachedResult) => {
      if (globalCacheError) {
        callback(globalCacheError);
        return;
      }
      if (globalCachedResult == null) {
        this._transformAndStoreCodeGlobally(cacheProps, _globalCache, callback);
        return;
      }
      callback(undefined, globalCachedResult);
    });
  }

  _getAndCacheTransformedCode(
    cacheProps: ReadTransformProps,
    callback: (error: ?Error, result: ?TransformedCode) => void,
  ) {
    this._getTransformedCode(cacheProps, (error, result) => {
      if (error) {
        callback(error);
        return;
      }
      invariant(result != null, 'missing result');
      TransformCache.writeSync({...cacheProps, result});
      callback(undefined, result);
    });
  }

  /**
   * Read everything about a module: source code, transformed code,
   * dependencies, etc. The overall process is to read the cache first, and if
   * it's a miss, we let the worker write to the cache and read it again.
   */
  read(transformOptions: TransformOptions): Promise<ReadResult> {
    const key = stableObjectHash(transformOptions || {});
    const promise = this._readPromises.get(key);
    if (promise != null) {
      return promise;
    }
    const freshPromise = Promise.all([
      this._readSourceCode(),
      this._readDocBlock(),
      this._getHasteName(),
    ]).then(([sourceCode, moduleDocBlock, id]) => {
      // Ignore requires in JSON files or generated code. An example of this
      // is prebuilt files like the SourceMap library.
      const extern = this.isJSON() || 'extern' in moduleDocBlock;
      if (extern) {
        transformOptions = {...transformOptions, extern};
      }
      const getTransformCacheKey = this._getTransformCacheKey;
      const cacheProps = {
        filePath: this.path,
        sourceCode,
        getTransformCacheKey,
        transformOptions,
        cacheOptions: {
          resetCache: this._options.resetCache,
          reporter: this._reporter,
        },
      };
      const cachedResult = TransformCache.readSync(cacheProps);
      if (cachedResult) {
        return Promise.resolve(this._finalizeReadResult(sourceCode, id, extern, cachedResult));
      }
      return new Promise((resolve, reject) => {
        this._getAndCacheTransformedCode(
          cacheProps,
          (transformError, freshResult) => {
            if (transformError) {
              reject(transformError);
              return;
            }
            invariant(freshResult != null, 'inconsistent state');
            resolve(this._finalizeReadResult(sourceCode, id, extern, freshResult));
          },
        );
      });
    });
    this._readPromises.set(key, freshPromise);
    return freshPromise;
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
    digest = crypto.createHash('md5')
      .update(jsonStableStringify(object))
      .digest('base64');
    knownHashes.set(object, digest);
  }

  return digest;
}

module.exports = Module;
