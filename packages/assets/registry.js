/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

/*::
export type AssetDestPathResolver = 'android' | 'generic';

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
  +resolver?: AssetDestPathResolver,
  ...
};
*/

const assets /*: Array<PackagerAsset> */ = [];

function registerAsset(asset /*: PackagerAsset */) /*: number */ {
  // `push` returns new array length, so the first asset will
  // get id 1 (not 0) to make the value truthy
  return assets.push(asset);
}

function getAssetByID(assetId /*: number */) /*: PackagerAsset */ {
  return assets[assetId - 1];
}

module.exports = {registerAsset, getAssetByID};
