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

const crypto = require('crypto');
const docblock = require('./DependencyGraph/docblock');
const extractRequires = require('./lib/extractRequires');
const isAbsolutePath = require('absolute-path');
const jsonStableStringify = require('json-stable-stringify');
const path = require('path');

import type Cache from './Cache';
import type ModuleCache from './ModuleCache';
import type FastFs from './fastfs';

export type Extractor = (sourceCode: string) => {deps: {sync: Array<string>}};
type TransformedCode = {
  code?: string,
  dependencies?: Array<string>,
  dependencyOffsets?: Array<number>,
  map?: string,
};
export type TransformCode = (
  module: Module,
  sourceCode: string,
  transformOptions: mixed,
) => Promise<{
  code: string,
  dependencies?: Array<string>,
  dependencyOffsets?: Array<number>,
  map?: string,
}>;
export type Options = {cacheTransformResults?: boolean};
export type DepGraphHelpers = {isNodeModulesDir: (filePath: string) => boolean};

export type ConstructorArgs = {
  file: string,
  fastfs: FastFs,
  moduleCache: ModuleCache,
  cache: Cache,
  extractor: Extractor,
  transformCode: TransformCode,
  depGraphHelpers: DepGraphHelpers,
  options: Options,
};

class Module {

  path: string;
  type: string;

  _fastfs: FastFs;
  _moduleCache: ModuleCache;
  _cache: Cache;
  _extractor: Extractor;
  _transformCode: TransformCode;
  _depGraphHelpers: DepGraphHelpers;
  _options: Options;

  _docBlock: Promise<{id?: string, moduleDocBlock: {[key: string]: mixed}}>;
  _readPromise: Promise<string>;

  constructor({
    file,
    fastfs,
    moduleCache,
    cache,
    extractor = extractRequires,
    transformCode,
    depGraphHelpers,
    options,
  }: ConstructorArgs) {
    if (!isAbsolutePath(file)) {
      throw new Error('Expected file to be absolute path but got ' + file);
    }

    this.path = file;
    this.type = 'Module';

    this._fastfs = fastfs;
    this._moduleCache = moduleCache;
    this._cache = cache;
    this._extractor = extractor;
    this._transformCode = transformCode;
    this._depGraphHelpers = depGraphHelpers;
    this._options = options;
  }

  isHaste(): Promise<boolean> {
    return this._cache.get(
      this.path,
      'isHaste',
      () => this._readDocBlock().then(({id}) => !!id)
    );
  }

  getCode(transformOptions: mixed) {
    return this.read(transformOptions).then(({code}) => code);
  }

  getMap(transformOptions: mixed) {
    return this.read(transformOptions).then(({map}) => map);
  }

  getName(): Promise<string> {
    return this._cache.get(
      this.path,
      'name',
      () => this._readDocBlock().then(({id}) => {
        if (id) {
          return id;
        }

        const p = this.getPackage();

        if (!p) {
          // Name is full path
          return this.path;
        }

        return p.getName()
          .then(name => {
            if (!name) {
              return this.path;
            }

            return path.join(name, path.relative(p.root, this.path)).replace(/\\/g, '/');
          });
      })
    );
  }

  getPackage() {
    return this._moduleCache.getPackageForModule(this);
  }

  getDependencies(transformOptions: mixed) {
    return this.read(transformOptions).then(({dependencies}) => dependencies);
  }

  invalidate() {
    this._cache.invalidate(this.path);
  }

  _parseDocBlock(docBlock) {
    // Extract an id for the module if it's using @providesModule syntax
    // and if it's NOT in node_modules (and not a whitelisted node_module).
    // This handles the case where a project may have a dep that has @providesModule
    // docblock comments, but doesn't want it to conflict with whitelisted @providesModule
    // modules, such as react-haste, fbjs-haste, or react-native or with non-dependency,
    // project-specific code that is using @providesModule.
    const moduleDocBlock = docblock.parseAsObject(docBlock);
    const provides = moduleDocBlock.providesModule || moduleDocBlock.provides;

    const id = provides && !this._depGraphHelpers.isNodeModulesDir(this.path)
        ? /^\S+/.exec(provides)[0]
        : undefined;
    return {id, moduleDocBlock};
  }

  _read() {
    if (!this._readPromise) {
      this._readPromise = this._fastfs.readFile(this.path);
    }
    return this._readPromise;
  }

  _readDocBlock() {
    if (!this._docBlock) {
      this._docBlock = this._read()
        .then(docBlock => this._parseDocBlock(docBlock));
    }
    return this._docBlock;
  }

  read(transformOptions: mixed): Promise<TransformedCode> {
    return this._cache.get(
      this.path,
      cacheKey('moduleData', transformOptions),
      () => {
        return Promise.all([
          this._read(),
          this._readDocBlock(),
        ]).then(([source, {id, moduleDocBlock}]) => {
          // Ignore requires in JSON files or generated code. An example of this
          // is prebuilt files like the SourceMap library.
          const extern = this.isJSON() || 'extern' in moduleDocBlock;
          if (extern) {
            transformOptions = {...transformOptions, extern};
          }
          const transformCode = this._transformCode;
          const codePromise = transformCode
              ? transformCode(this, source, transformOptions)
              : Promise.resolve({code: source});
          return codePromise.then(result => {
            const {
              code,
              /* $FlowFixMe: I don't think it should complain as there's
                 a default value */
              dependencies = extern ? [] : this._extractor(code).deps.sync,
            } = result;
            if (this._options && this._options.cacheTransformResults === false) {
              return {dependencies};
            } else {
              return {...result, dependencies, id, source};
            }
          });
        });
      }
    );
  }

  hash() {
    return `Module : ${this.path}`;
  }

  isJSON() {
    return path.extname(this.path) === '.json';
  }

  isAsset() {
    return false;
  }

  isPolyfill() {
    return false;
  }

  isAsset_DEPRECATED() {
    return false;
  }

  toJSON() {
    return {
      hash: this.hash(),
      isJSON: this.isJSON(),
      isAsset: this.isAsset(),
      isAsset_DEPRECATED: this.isAsset_DEPRECATED(),
      type: this.type,
      path: this.path,
    };
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

function cacheKey(field, transformOptions) {
  return transformOptions !== undefined
      ? stableObjectHash(transformOptions) + '\0' + field
      : field;
}

module.exports = Module;
