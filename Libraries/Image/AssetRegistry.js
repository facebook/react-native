/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule AssetRegistry
 */
'use strict';

var assets = [];

function registerAsset(asset) {
  // `push` returns new array length, so the first asset will
  // get id 1 (not 0) to make the value truthy
  return assets.push(asset);
}

function getAssetByID(assetId) {
  return assets[assetId - 1];
}

module.exports = { registerAsset, getAssetByID };
