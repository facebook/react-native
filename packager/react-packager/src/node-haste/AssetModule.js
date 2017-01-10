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

const Module = require('./Module');

const getAssetDataFromName = require('./lib/getAssetDataFromName');

import type {ConstructorArgs, ReadResult} from './Module';

class AssetModule extends Module {

  resolution: mixed;
  _name: string;
  _type: string;
  _dependencies: Array<string>;

  constructor(args: ConstructorArgs & {dependencies: Array<string>}, platforms: Set<string>) {
    super(args);
    const { resolution, name, type } = getAssetDataFromName(this.path, platforms);
    this.resolution = resolution;
    this._name = name;
    this._type = type;
    this._dependencies = args.dependencies || [];
  }

  isHaste() {
    return Promise.resolve(false);
  }

  getDependencies() {
    return Promise.resolve(this._dependencies);
  }

  read(): Promise<ReadResult> {
    /** $FlowFixMe: improper OOP design. AssetModule, being different from a
     * normal Module, shouldn't inherit it in the first place. */
    return Promise.resolve({});
  }

  getName() {
    return super.getName().then(
      id => id.replace(/\/[^\/]+$/, `/${this._name}.${this._type}`)
    );
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
