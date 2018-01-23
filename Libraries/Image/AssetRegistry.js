/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule AssetRegistry
 * @flow
 * @format
 */
'use strict';

export type PackagerAsset = {
  +__packager_asset: boolean,
  +fileSystemLocation: string,
  +httpServerLocation: string,
  +width: ?number,
  +height: ?number,
  +scales: Array<number>,
  +hash: string,
  +name: string,
  +type: string,
};

var assets: Array<PackagerAsset> = [];

function registerAsset(asset: PackagerAsset): number {
  // `push` returns new array length, so the first asset will
  // get id 1 (not 0) to make the value truthy
  return assets.push(asset);
}

function getAssetByID(assetId: number): PackagerAsset {
  return assets[assetId - 1];
}

module.exports = {registerAsset, getAssetByID};
