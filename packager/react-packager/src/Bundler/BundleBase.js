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

const ModuleTransport = require('../lib/ModuleTransport');

export type FinalizeOptions = {
  allowUpdates?: boolean,
  runBeforeMainModule?: Array<mixed>,
  runMainModule?: boolean,
};

export type GetSourceOptions = {
  inlineSourceMap: boolean,
  dev: boolean,
};

class BundleBase {

  _assets: Array<mixed>;
  _finalized: boolean;
  _mainModuleId: string | void;
  _modules: Array<ModuleTransport>;
  _source: ?string;

  constructor() {
    this._finalized = false;
    this._modules = [];
    this._assets = [];
    this._mainModuleId = undefined;
  }

  isEmpty() {
    return this._modules.length === 0 && this._assets.length === 0;
  }

  getMainModuleId() {
    return this._mainModuleId;
  }

  setMainModuleId(moduleId: string) {
    this._mainModuleId = moduleId;
  }

  addModule(module: ModuleTransport) {
    if (!(module instanceof ModuleTransport)) {
      throw new Error('Expected a ModuleTransport object');
    }

    return this._modules.push(module) - 1;
  }

  replaceModuleAt(index: number, module: ModuleTransport) {
    if (!(module instanceof ModuleTransport)) {
      throw new Error('Expeceted a ModuleTransport object');
    }

    this._modules[index] = module;
  }

  getModules() {
    return this._modules;
  }

  getAssets() {
    return this._assets;
  }

  addAsset(asset: mixed) {
    this._assets.push(asset);
  }

  finalize(options: FinalizeOptions) {
    if (!options.allowUpdates) {
      Object.freeze(this._modules);
      Object.freeze(this._assets);
    }

    this._finalized = true;
  }

  getSource(options: GetSourceOptions) {
    this.assertFinalized();

    if (this._source) {
      return this._source;
    }

    this._source = this._modules.map((module) => module.code).join('\n');
    return this._source;
  }

  invalidateSource() {
    this._source = null;
  }

  assertFinalized(message?: string) {
    if (!this._finalized) {
      throw new Error(message || 'Bundle needs to be finalized before getting any source');
    }
  }

  setRamGroups(ramGroups: Array<string>) {}

  toJSON(): mixed {
    return {
      modules: this._modules,
      assets: this._assets,
      mainModuleId: this.getMainModuleId(),
    };
  }

  static fromJSON(bundle, json) {
    bundle._assets = json.assets;
    bundle._modules = json.modules;
    bundle.setMainModuleId(json.mainModuleId);

    Object.freeze(bundle._modules);
    Object.freeze(bundle._assets);

    bundle._finalized = true;
  }
}

module.exports = BundleBase;
