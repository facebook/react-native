/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('fs');

class PrepackBundle {
  constructor(sourceMapUrl) {
    this._finalized = false;
    this._moduleIds = Object.create(null);
    this._modules = Object.create(null);
    this._eagerModules = [];
    this._mainModule = null;
    this._assets = [];
    this._sourceMapUrl = sourceMapUrl;
  }

  addModule(id, module, deps, isPolyfill) {
    this._modules[module.sourcePath] = { module, deps };
    this._moduleIds[id] = module.sourcePath;
    if (isPolyfill) {
      this._eagerModules.push(id);
    }
  }

  addAsset(asset) {
    this._assets.push(asset);
  }

  // Synchronously load a file path.
  _loadFilename(path) {
    const module = this._modules[path];
    if (!module) {
      throw new Error('Could not find file "' + path + '" in preloaded files.');
    }
    return module.module.code;
  }

  // Synchronously resolve a relative require from a parent module.
  _resolveFilename(parentPath, relativePath) {
    if (!parentPath) {
      const resolvedPath = this._moduleIds[relativePath];
      if (!resolvedPath) {
        throw new Error('Could not resolve "' + relativePath + '".');
      }
      return resolvedPath;
    }
    const deps = this._modules[parentPath].deps;
    const resolvedPath = deps[relativePath];
    if (!resolvedPath) {
      throw new Error(
        'Could not resolve "' + relativePath + '" from "' + parentPath + '".'
      );
    }
    return resolvedPath;
  }

  build(options) {
    var prepack = require('prepack');

    var batchedBridgeConfig = (options && options.batchedBridgeConfig) || null;
    if (typeof batchedBridgeConfig === 'string') {
      batchedBridgeConfig = JSON.parse(
        fs.readFileSync(batchedBridgeConfig, 'utf-8')
      );
    }

    var options = {
      batchedBridgeConfig: batchedBridgeConfig,
      environment: 'react-native',
      resolveFilename: this._resolveFilename.bind(this),
      loadFilename: this._loadFilename.bind(this),
      eagerModules: this._eagerModules
    };

    return prepack.compileModule(this._mainModule, options);
  }

  finalize(options) {
    options = options || {};
    if (options.runMainModule) {
      options.runBeforeMainModule.forEach(this._addRequireCall, this);
      this._mainModule = options.mainModuleId;
    }

    Object.freeze(this._moduleIds);
    Object.freeze(this._modules);
    Object.freeze(this._assets);
    Object.freeze(this._eagerModules);
    this._finalized = true;
  }

  _addRequireCall(moduleId) {
    this._eagerModules.push(moduleId);
  }

  _assertFinalized() {
    if (!this._finalized) {
      throw new Error('Bundle needs to be finalized before getting any source');
    }
  }

  getAssets() {
    return this._assets;
  }

  toJSON() {
    if (!this._finalized) {
      throw new Error('Cannot serialize bundle unless finalized');
    }

    return {
      modules: this._modules,
      moduleIds: this._moduleIds,
      assets: this._assets,
      sourceMapUrl: this._sourceMapUrl,
      mainModule: this._mainModule,
      eagerModules: this._eagerModules,
    };
  }

  static fromJSON(json) {
    const bundle = new PrepackBundle(json.sourceMapUrl);
    bundle._assets = json.assets;
    bundle._moduleIds = json.moduleIds;
    bundle._modules = json.modules;
    bundle._sourceMapUrl = json.sourceMapUrl;

    bundle._eagerModules = json.eagerModules;
    bundle._mainModule = json.mainModule;

    Object.freeze(bundle._moduleIds);
    Object.freeze(bundle._modules);
    Object.freeze(bundle._assets);
    Object.freeze(bundle._eagerModules);

    bundle._finalized = true;

    return bundle;
  }
}

module.exports = PrepackBundle;
