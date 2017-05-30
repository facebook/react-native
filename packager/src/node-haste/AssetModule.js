/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

'use strict';

const AssetPaths = require('./lib/AssetPaths');
const Module = require('./Module');

import type {CachedReadResult, ConstructorArgs, ReadResult} from './Module';

class AssetModule extends Module {
  resolution: mixed;
  _name: string;
  _type: string;
  _dependencies: Array<string>;

  constructor(
    args: ConstructorArgs & {dependencies: Array<string>},
    platforms: Set<string>,
  ) {
    super(args);
    const {resolution, name, type} = AssetPaths.parse(this.path, platforms);
    this.resolution = resolution;
    this._name = name;
    this._type = type;
    this._dependencies = args.dependencies || [];
  }

  isHaste() {
    return false;
  }

  readCached(): CachedReadResult {
    return {
      /** $FlowFixMe: improper OOP design. AssetModule, being different from a
       * normal Module, shouldn't inherit it in the first place. */
      result: {dependencies: this._dependencies},
      outdatedDependencies: [],
    };
  }

  /** $FlowFixMe: improper OOP design. */
  readFresh(): Promise<ReadResult> {
    return Promise.resolve({dependencies: this._dependencies});
  }

  getName() {
    return super
      .getName()
      .then(id => id.replace(/\/[^\/]+$/, `/${this._name}.${this._type}`));
  }

  hash() {
    return `AssetModule : ${this.path}`;
  }

  isJSON() {
    return false;
  }

  isAsset() {
    return true;
  }
}

module.exports = AssetModule;
