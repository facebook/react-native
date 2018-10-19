/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

import type {PackagerAsset} from '../../Libraries/Image/AssetRegistry';

/**
 * FIXME: using number to represent discrete scale numbers is fragile in essence because of
 * floating point numbers imprecision.
 */
function getAndroidAssetSuffix(scale: number): string {
  switch (scale) {
    case 0.75:
      return 'ldpi';
    case 1:
      return 'mdpi';
    case 1.5:
      return 'hdpi';
    case 2:
      return 'xhdpi';
    case 3:
      return 'xxhdpi';
    case 4:
      return 'xxxhdpi';
  }
  throw new Error('no such scale');
}

// See https://developer.android.com/guide/topics/resources/drawable-resource.html
const drawableFileTypes = new Set([
  'gif',
  'jpeg',
  'jpg',
  'png',
  'svg',
  'webp',
  'xml',
]);

function getAndroidResourceFolderName(asset: PackagerAsset, scale: number) {
  if (!drawableFileTypes.has(asset.type)) {
    return 'raw';
  }
  var suffix = getAndroidAssetSuffix(scale);
  if (!suffix) {
    throw new Error(
      "Don't know which android drawable suffix to use for asset: " +
        JSON.stringify(asset),
    );
  }
  const androidFolder = 'drawable-' + suffix;
  return androidFolder;
}

function getAndroidResourceIdentifier(asset: PackagerAsset) {
  var folderPath = getBasePath(asset);
  return (folderPath + '/' + asset.name)
    .toLowerCase()
    .replace(/\//g, '_') // Encode folder structure in file name
    .replace(/([^a-z0-9_])/g, '') // Remove illegal chars
    .replace(/^assets_/, ''); // Remove "assets_" prefix
}

function getBasePath(asset: PackagerAsset) {
  var basePath = asset.httpServerLocation;
  if (basePath[0] === '/') {
    basePath = basePath.substr(1);
  }
  return basePath;
}

module.exports = {
  getAndroidAssetSuffix: getAndroidAssetSuffix,
  getAndroidResourceFolderName: getAndroidResourceFolderName,
  getAndroidResourceIdentifier: getAndroidResourceIdentifier,
  getBasePath: getBasePath,
};
