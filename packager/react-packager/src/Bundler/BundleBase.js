/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const _ = require('underscore');
const ModuleTransport = require('../lib/ModuleTransport');

class BundleBase {
  constructor() {
    this._finalized = false;
    this._modules = [];
    this._assets = [];
    this._mainModuleId = this._mainModuleName = undefined;
  }

  isEmpty() {
    return this._modules.length === 0 && this._assets.length === 0;
  }

  getMainModuleId() {
    return this._mainModuleId;
  }

  setMainModuleId(moduleId) {
    this._mainModuleId = moduleId;
  }

  getMainModuleName() {
    return this._mainModuleName;
  }

  setMainModuleName(moduleName) {
    this._mainModuleName = moduleName;
  }

  addModule(module) {
    if (!module instanceof ModuleTransport) {
      throw new Error('Expeceted a ModuleTransport object');
    }

    this._modules.push(module);
  }

  getModules() {
    return this._modules;
  }

  getAssets() {
    return this._assets;
  }

  addAsset(asset) {
    this._assets.push(asset);
  }

  finalize(options) {
    Object.freeze(this._modules);
    Object.seal(this._modules);
    Object.freeze(this._assets);
    Object.seal(this._assets);
    this._finalized = true;
  }

  getSource(options) {
    this.assertFinalized();

    if (this._source) {
      return this._source;
    }

    this._source = _.pluck(this._modules, 'code').join('\n');
    return this._source;
  }

  assertFinalized(message) {
    if (!this._finalized) {
      throw new Error(message || 'Bundle needs to be finalized before getting any source');
    }
  }

  toJSON() {
    return {
      modules: this._modules,
      assets: this._assets,
      mainModuleId: this.getMainModuleId(),
      mainModuleName: this.getMainModuleName(),
    };
  }

  static fromJSON(bundle, json) {
    bundle._assets = json.assets;
    bundle._modules = json.modules;
    bundle.setMainModuleId(json.mainModuleId);
    bundle.setMainModuleName(json.mainModuleName);

    Object.freeze(bundle._modules);
    Object.seal(bundle._modules);
    Object.freeze(bundle._assets);
    Object.seal(bundle._assets);
    bundle._finalized = true;
  }
}

module.exports = BundleBase;
