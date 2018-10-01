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

const assetPathUtils = require('./assetPathUtils');
const path = require('path');

import type {PackagerAsset} from '../../Libraries/Image/AssetRegistry';

function getAssetDestPathAndroid(asset: PackagerAsset, scale: number): string {
  const androidFolder = assetPathUtils.getAndroidResourceFolderName(
    asset,
    scale,
  );
  const fileName = assetPathUtils.getAndroidResourceIdentifier(asset);
  return path.join(androidFolder, fileName + '.' + asset.type);
}

module.exports = getAssetDestPathAndroid;
