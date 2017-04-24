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

import type {Options as TransformOptions} from '../../JSTransformer/worker/worker';
import type Module from '../Module';

const NO_OPTIONS = {};

class ResolutionResponse<TModule: {hash(): string}> {

  transformOptions: TransformOptions;
  dependencies: Array<TModule>;
  mainModuleId: ?(number | string);
  mocks: mixed;
  numPrependedDependencies: number;

  // This is monkey-patched from Resolver.
  getModuleId: ?() => number;

  _mappings: {};
  _finalized: boolean;
  _mainModule: ?TModule;

  constructor({transformOptions}: {transformOptions: TransformOptions}) {
    this.transformOptions = transformOptions;
    this.dependencies = [];
    this.mainModuleId = null;
    this.mocks = null;
    this.numPrependedDependencies = 0;
    this._mappings = Object.create(null);
    this._finalized = false;
  }

  copy(properties: {
    dependencies?: Array<TModule>,
    mainModuleId?: number,
    mocks?: mixed,
  }): ResolutionResponse<TModule> {
    const {
      dependencies = this.dependencies,
      mainModuleId = this.mainModuleId,
      mocks = this.mocks,
    } = properties;

    const numPrependedDependencies = dependencies === this.dependencies
      ? this.numPrependedDependencies : 0;

    /* $FlowFixMe: Flow doesn't like Object.assign on class-made objects. */
    return Object.assign(
      new this.constructor({transformOptions: this.transformOptions}),
      this,
      {
        dependencies,
        mainModuleId,
        mocks,
        numPrependedDependencies,
      },
    );
  }

  _assertNotFinalized() {
    if (this._finalized) {
      throw new Error('Attempted to mutate finalized response.');
    }
  }

  _assertFinalized() {
    if (!this._finalized) {
      throw new Error('Attempted to access unfinalized response.');
    }
  }

  finalize(): ResolutionResponse<TModule> {
    /* $FlowFixMe: _mainModule is not initialized in the constructor. */
    return this._mainModule.getName().then(id => {
      this.mainModuleId = id;
      this._finalized = true;
      return this;
    });
  }

  pushDependency(module: TModule) {
    this._assertNotFinalized();
    if (this.dependencies.length === 0) {
      this._mainModule = module;
    }

    this.dependencies.push(module);
  }

  prependDependency(module: TModule) {
    this._assertNotFinalized();
    this.dependencies.unshift(module);
    this.numPrependedDependencies += 1;
  }

  setResolvedDependencyPairs(
    module: Module,
    pairs: mixed,
    options: {ignoreFinalized?: boolean} = NO_OPTIONS,
  ) {
    if (!options.ignoreFinalized) {
      this._assertNotFinalized();
    }
    const hash = module.hash();
    if (this._mappings[hash] == null) {
      this._mappings[hash] = pairs;
    }
  }

  setMocks(mocks: mixed) {
    this.mocks = mocks;
  }

  getResolvedDependencyPairs(module: TModule) {
    this._assertFinalized();
    return this._mappings[module.hash()];
  }
}

module.exports = ResolutionResponse;
