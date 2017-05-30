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
  runBeforeMainModule?: Array<string>,
  runModule?: boolean,
};

export type GetSourceOptions = {
  inlineSourceMap?: boolean,
  dev: boolean,
};

class BundleBase {

  _assets: Array<mixed>;
  _finalized: boolean;
  _mainModuleId: number | void;
  _source: ?string;
  __modules: Array<ModuleTransport>;

  constructor() {
    this._finalized = false;
    this.__modules = [];
    this._assets = [];
    this._mainModuleId = undefined;
  }

  isEmpty() {
    return this.__modules.length === 0 && this._assets.length === 0;
  }

  getMainModuleId() {
    return this._mainModuleId;
  }

  setMainModuleId(moduleId: number) {
    this._mainModuleId = moduleId;
  }

  addModule(module: ModuleTransport) {
    if (!(module instanceof ModuleTransport)) {
      throw new Error('Expected a ModuleTransport object');
    }

    return this.__modules.push(module) - 1;
  }

  replaceModuleAt(index: number, module: ModuleTransport) {
    if (!(module instanceof ModuleTransport)) {
      throw new Error('Expeceted a ModuleTransport object');
    }

    this.__modules[index] = module;
  }

  getModules() {
    return this.__modules;
  }

  getAssets() {
    return this._assets;
  }

  addAsset(asset: mixed) {
    this._assets.push(asset);
  }

  finalize(options: FinalizeOptions) {
    if (!options.allowUpdates) {
      Object.freeze(this.__modules);
      Object.freeze(this._assets);
    }

    this._finalized = true;
  }

  getSource(options: GetSourceOptions) {
    this.assertFinalized();

    if (this._source) {
      return this._source;
    }

    this._source = this.__modules.map(module => module.code).join('\n');
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
}

module.exports = BundleBase;
