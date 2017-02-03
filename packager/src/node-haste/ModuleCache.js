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

import type GlobalTransformCache from '../lib/GlobalTransformCache';
import type {Reporter} from '../lib/reporting';
import type Cache from './Cache';
import type DependencyGraphHelpers from './DependencyGraph/DependencyGraphHelpers';
import type {TransformCode, Options as ModuleOptions} from './Module';

type GetClosestPackageFn = (filePath: string) => ?string;

class ModuleCache {

  _assetDependencies: Array<string>;
  _cache: Cache;
  _depGraphHelpers: DependencyGraphHelpers;
  _getClosestPackage: GetClosestPackageFn;
  _globalTransformCache: ?GlobalTransformCache;
  _moduleCache: {[filePath: string]: Module};
  _moduleOptions: ModuleOptions;
  _packageCache: {[filePath: string]: Package};
  _packageModuleMap: WeakMap<Module, string>;
  _platforms: Set<string>;
  _transformCacheKey: string;
  _transformCode: TransformCode;
  _reporter: Reporter;

  constructor({
    assetDependencies,
    cache,
    depGraphHelpers,
    extractRequires,
    getClosestPackage,
    globalTransformCache,
    moduleOptions,
    reporter,
    transformCacheKey,
    transformCode,
  }: {
    assetDependencies: Array<string>,
    cache: Cache,
    depGraphHelpers: DependencyGraphHelpers,
    getClosestPackage: GetClosestPackageFn,
    globalTransformCache: ?GlobalTransformCache,
    moduleOptions: ModuleOptions,
    reporter: Reporter,
    transformCacheKey: string,
    transformCode: TransformCode,
  }, platforms: Set<string>) {
    this._assetDependencies = assetDependencies;
    this._getClosestPackage = getClosestPackage;
    this._globalTransformCache = globalTransformCache;
    this._cache = cache;
    this._depGraphHelpers = depGraphHelpers;
    this._moduleCache = Object.create(null);
    this._moduleOptions = moduleOptions;
    this._packageCache = Object.create(null);
    this._packageModuleMap = new WeakMap();
    this._platforms = platforms;
    this._transformCacheKey = transformCacheKey;
    this._transformCode = transformCode;
    this._reporter = reporter;
  }

  getModule(filePath: string) {
    if (!this._moduleCache[filePath]) {
      this._moduleCache[filePath] = new Module({
        cache: this._cache,
        depGraphHelpers: this._depGraphHelpers,
        file: filePath,
        globalTransformCache: this._globalTransformCache,
        moduleCache: this,
        options: this._moduleOptions,
        reporter: this._reporter,
        transformCacheKey: this._transformCacheKey,
        transformCode: this._transformCode,
      });
    }
    return this._moduleCache[filePath];
  }

  getAllModules() {
    return this._moduleCache;
  }

  getAssetModule(filePath: string) {
    if (!this._moduleCache[filePath]) {
      /* $FlowFixMe: missing options. This is because this is an incorrect OOP
       * design in the first place: AssetModule, being simpler than a normal
       * Module, should not inherit the Module class. */
      this._moduleCache[filePath] = new AssetModule({
        file: filePath,
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
        cache: this._cache,
      });
    }
    return this._packageCache[filePath];
  }

  getPackageForModule(module: Module): ?Package {
    if (this._packageModuleMap.has(module)) {
      const packagePath = this._packageModuleMap.get(module);
      // $FlowFixMe(>=0.37.0)
      if (this._packageCache[packagePath]) {
        return this._packageCache[packagePath];
      } else {
        this._packageModuleMap.delete(module);
      }
    }

    const packagePath = this._getClosestPackage(module.path);
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
      moduleCache: this,
      transformCode: this._transformCode,
      transformCacheKey: this._transformCacheKey,
    });
  }

  processFileChange(type: string, filePath: string) {
    if (this._moduleCache[filePath]) {
      this._moduleCache[filePath].invalidate();
      delete this._moduleCache[filePath];
    }
    if (this._packageCache[filePath]) {
      this._packageCache[filePath].invalidate();
      delete this._packageCache[filePath];
    }
  }
}

module.exports = ModuleCache;
