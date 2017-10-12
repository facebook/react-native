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

const assetPathUtils = require('./assetPathUtils');
const path = require('path');

import type {PackagerAsset} from '../../Libraries/Image/AssetRegistry';

function getAssetDestPathAndroid(asset: PackagerAsset, scale: number): string {
  const androidFolder = assetPathUtils.getAndroidResourceFolderName(asset, scale);
  const fileName =  assetPathUtils.getAndroidResourceIdentifier(asset);
  return path.join(androidFolder, fileName + '.' + asset.type);
}

module.exports = getAssetDestPathAndroid;
