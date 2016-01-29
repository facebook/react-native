/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const docblock = require('./DependencyGraph/docblock');
const isAbsolutePath = require('absolute-path');
const path = require('path');
const extractRequires = require('./lib/extractRequires');

class Module {

  constructor({
    file,
    fastfs,
    moduleCache,
    cache,
    extractor = extractRequires,
    transformCode,
    depGraphHelpers,
  }) {
    if (!isAbsolutePath(file)) {
      throw new Error('Expected file to be absolute path but got ' + file);
    }

    this.path = path.resolve(file);
    this.type = 'Module';

    this._fastfs = fastfs;
    this._moduleCache = moduleCache;
    this._cache = cache;
    this._extractor = extractor;
    this._transformCode = transformCode;
    this._depGraphHelpers = depGraphHelpers;
  }

  isHaste() {
    return this._cache.get(
      this.path,
      'isHaste',
      () => this.read().then(data => !!data.id)
    );
  }

  getCode() {
    return this.read().then(({code}) => code);
  }

  getName() {
    return this._cache.get(
      this.path,
      'name',
      () => this.read().then(data => {
        if (data.id) {
          return data.id;
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

  getDependencies() {
    return this._cache.get(
      this.path,
      'dependencies',
      () => this.read().then(data => data.dependencies)
    );
  }

  getAsyncDependencies() {
    return this._cache.get(
      this.path,
      'asyncDependencies',
      () => this.read().then(data => data.asyncDependencies)
    );
  }

  invalidate() {
    this._cache.invalidate(this.path);
  }

  read() {
    if (!this._reading) {
      this._reading = this._fastfs.readFile(this.path).then(content => {
        const data = {};

        // Set an id on the module if it's using @providesModule syntax
        // and if it's NOT in node_modules (and not a whitelisted node_module).
        // This handles the case where a project may have a dep that has @providesModule
        // docblock comments, but doesn't want it to conflict with whitelisted @providesModule
        // modules, such as react-haste, fbjs-haste, or react-native or with non-dependency,
        // project-specific code that is using @providesModule.
        const moduleDocBlock = docblock.parseAsObject(content);
        if (!this._depGraphHelpers.isNodeModulesDir(this.path) &&
            (moduleDocBlock.providesModule || moduleDocBlock.provides)) {
          data.id = /^(\S*)/.exec(
            moduleDocBlock.providesModule || moduleDocBlock.provides
          )[1];
        }

        // Ignore requires in JSON files or generated code. An example of this
        // is prebuilt files like the SourceMap library.
        if (this.isJSON() || 'extern' in moduleDocBlock) {
          data.dependencies = [];
          data.asyncDependencies = [];
          data.code = content;
          return data;
        } else {
          const transformCode = this._transformCode;
          const codePromise = transformCode
              ? transformCode(this, content)
              : Promise.resolve({code: content});

          return codePromise.then(({code, dependencies, asyncDependencies}) => {
            const {deps} = this._extractor(code);
            data.dependencies = dependencies || deps.sync;
            data.asyncDependencies = asyncDependencies || deps.async;
            data.code = code;
            return data;
          });
        }
      });
    }

    return this._reading;
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

module.exports = Module;
