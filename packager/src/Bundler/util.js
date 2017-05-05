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

import type {AssetDescriptor} from '.';

const assetPropertyBlacklist = new Set([
  'files',
  'fileSystemLocation',
  'path',
]);

function generateAssetTransformResult(assetDescriptor: AssetDescriptor): {|
  code: string,
  dependencies: Array<string>,
  dependencyOffsets: Array<number>,
|} {
  const properDescriptor = filterObject(assetDescriptor, assetPropertyBlacklist);
  const json = JSON.stringify(properDescriptor);
  const assetRegistryPath = 'react-native/Libraries/Image/AssetRegistry';
  const code =
    `module.exports = require(${JSON.stringify(assetRegistryPath)}).registerAsset(${json});`;
  const dependencies = [assetRegistryPath];
  const dependencyOffsets = [code.indexOf(assetRegistryPath) - 1];
  return {code, dependencies, dependencyOffsets};
}

// Test extension against all types supported by image-size module.
// If it's not one of these, we won't treat it as an image.
function isAssetTypeAnImage(type: string): boolean {
  return [
    'png', 'jpg', 'jpeg', 'bmp', 'gif', 'webp', 'psd', 'svg', 'tiff',
  ].indexOf(type) !== -1;
}

function filterObject(object, blacklist) {
  const copied = Object.assign({}, object);
  for (const key of blacklist) {
    delete copied[key];
  }
  return copied;
}

exports.generateAssetTransformResult = generateAssetTransformResult;
exports.isAssetTypeAnImage = isAssetTypeAnImage;
