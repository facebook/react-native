/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule AssetRegistry
 * @flow
 */
'use strict';

export type PackagerAsset = {
  __packager_asset: boolean,
  fileSystemLocation: string,
  httpServerLocation: string,
  width: number,
  height: number,
  scales: Array<number>,
  hash: string,
  name: string,
  type: string,
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

module.exports = { registerAsset, getAssetByID };
