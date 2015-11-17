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

  constructor(file, fastfs, moduleCache, cache, extractor) {
    if (!isAbsolutePath(file)) {
      throw new Error('Expected file to be absolute path but got ' + file);
    }

    this.path = path.resolve(file);
    this.type = 'Module';

    this._fastfs = fastfs;
    this._moduleCache = moduleCache;
    this._cache = cache;
    this._extractor = extractor;
  }

  isHaste() {
    return this._read().then(data => !!data.id);
  }

  getName() {
    return this._cache.get(
      this.path,
      'name',
      () => this._read().then(data => {
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
    return this._read().then(data => data.dependencies);
  }

  getAsyncDependencies() {
    return this._read().then(data => data.asyncDependencies);
  }

  invalidate() {
    this._cache.invalidate(this.path);
  }

  _read() {
    if (!this._reading) {
      this._reading = this._fastfs.readFile(this.path).then(content => {
        const data = {};
        const moduleDocBlock = docblock.parseAsObject(content);
        if (moduleDocBlock.providesModule || moduleDocBlock.provides) {
          data.id = /^(\S*)/.exec(
            moduleDocBlock.providesModule || moduleDocBlock.provides
          )[1];
        }

        // Ignore requires in generated code. An example of this is prebuilt
        // files like the SourceMap library.
        if ('extern' in moduleDocBlock) {
          data.dependencies = [];
        } else {
          var dependencies = (this._extractor || extractRequires)(content).deps;
          data.dependencies = dependencies.sync;
          data.asyncDependencies = dependencies.async;
        }

        return data;
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
