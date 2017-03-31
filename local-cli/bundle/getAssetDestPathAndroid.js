/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const assetPathUtils = require('./assetPathUtils');
const path = require('path');

function getAssetDestPathAndroid(asset, scale) {
  const androidFolder = assetPathUtils.getAndroidDrawableFolderName(asset, scale);
  const fileName =  assetPathUtils.getAndroidResourceIdentifier(asset);
  return path.join(androidFolder, fileName + '.' + asset.type);
}

module.exports = getAssetDestPathAndroid;
