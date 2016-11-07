/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const AssetModule = require('./AssetModule');
const Module = require('./Module');
const Package = require('./Package');
const Polyfill = require('./Polyfill');

const path = require('path');

import type Cache from './Cache';
import type {
  DepGraphHelpers,
  Extractor,
  TransformCode,
  Options as ModuleOptions,
} from './Module';
import type FastFs from './fastfs';

class ModuleCache {

  _moduleCache: {[filePath: string]: Module};
  _packageCache: {[filePath: string]: Package};
  _fastfs: FastFs;
  _cache: Cache;
  _extractRequires: Extractor;
  _transformCode: TransformCode;
  _depGraphHelpers: DepGraphHelpers;
  _platforms: mixed;
  _assetDependencies: mixed;
  _moduleOptions: ModuleOptions;
  _packageModuleMap: WeakMap<Module, string>;

  constructor({
    fastfs,
    cache,
    extractRequires,
    transformCode,
    depGraphHelpers,
    assetDependencies,
    moduleOptions,
  }: {
    fastfs: FastFs,
    cache: Cache,
    extractRequires: Extractor,
    transformCode: TransformCode,
    depGraphHelpers: DepGraphHelpers,
    assetDependencies: mixed,
    moduleOptions: ModuleOptions,
  }, platforms: mixed) {
    this._moduleCache = Object.create(null);
    this._packageCache = Object.create(null);
    this._fastfs = fastfs;
    this._cache = cache;
    this._extractRequires = extractRequires;
    this._transformCode = transformCode;
    this._depGraphHelpers = depGraphHelpers;
    this._platforms = platforms;
    this._assetDependencies = assetDependencies;
    this._moduleOptions = moduleOptions;
    this._packageModuleMap = new WeakMap();

    fastfs.on('change', this._processFileChange.bind(this));
  }

  getModule(filePath: string) {
    if (!this._moduleCache[filePath]) {
      this._moduleCache[filePath] = new Module({
        file: filePath,
        fastfs: this._fastfs,
        moduleCache: this,
        cache: this._cache,
        extractor: this._extractRequires,
        transformCode: this._transformCode,
        depGraphHelpers: this._depGraphHelpers,
        options: this._moduleOptions,
      });
    }
    return this._moduleCache[filePath];
  }

  getAllModules() {
    return this._moduleCache;
  }

  getAssetModule(filePath: string) {
    if (!this._moduleCache[filePath]) {
      this._moduleCache[filePath] = new AssetModule({
        file: filePath,
        fastfs: this._fastfs,
        moduleCache: this,
        cache: this._cache,
        dependencies: this._assetDependencies,
      }, this._platforms);
    }
    return this._moduleCache[filePath];
  }

  getPackage(filePath: string) {
    if (!this._packageCache[filePath]) {
      this._packageCache[filePath] = new Package({
        file: filePath,
        fastfs: this._fastfs,
        cache: this._cache,
      });
    }
    return this._packageCache[filePath];
  }

  getPackageForModule(module: Module): ?Package {
    if (this._packageModuleMap.has(module)) {
      const packagePath = this._packageModuleMap.get(module);
      if (this._packageCache[packagePath]) {
        return this._packageCache[packagePath];
      } else {
        this._packageModuleMap.delete(module);
      }
    }

    const packagePath = this._fastfs.closest(module.path, 'package.json');
    if (!packagePath) {
      return null;
    }

    this._packageModuleMap.set(module, packagePath);
    return this.getPackage(packagePath);
  }

  createPolyfill({file}: {file: string}) {
    /* $FlowFixMe: there are missing arguments. */
    return new Polyfill({
      file,
      cache: this._cache,
      depGraphHelpers: this._depGraphHelpers,
      fastfs: this._fastfs,
      moduleCache: this,
      transformCode: this._transformCode,
    });
  }

  _processFileChange(type, filePath, root) {
    const absPath = path.join(root, filePath);

    if (this._moduleCache[absPath]) {
      this._moduleCache[absPath].invalidate();
      delete this._moduleCache[absPath];
    }
    if (this._packageCache[absPath]) {
      this._packageCache[absPath].invalidate();
      delete this._packageCache[absPath];
    }
  }
}

module.exports = ModuleCache;
