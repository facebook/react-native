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

const getPlatformExtension = require('./getPlatformExtension');
const path = require('path');

export type AssetData = {|
  assetName: string,
  name: string,
  platform: ?string,
  resolution: number,
  type: string,
|};

function getAssetDataFromName(filename: string, platforms: Set<string>): AssetData {
  const ext = path.extname(filename);
  const platformExt = getPlatformExtension(filename, platforms);

  let pattern = '@([\\d\\.]+)x';
  if (platformExt != null) {
    pattern += '(\\.' + platformExt + ')?';
  }
  pattern += '\\' + ext + '$';
  const re = new RegExp(pattern);

  const match = filename.match(re);
  let resolution;

  if (!(match && match[1])) {
    resolution = 1;
  } else {
    resolution = parseFloat(match[1]);
    if (isNaN(resolution)) {
      resolution = 1;
    }
  }

  let assetName;
  if (match) {
    assetName = filename.replace(re, ext);
  } else if (platformExt != null) {
    assetName = filename.replace(new RegExp(`\\.${platformExt}\\${ext}`), ext);
  } else {
    assetName = filename;
  }
  assetName = decodeURIComponent(assetName);

  return {
    assetName,
    name: path.basename(assetName, ext),
    platform: platformExt,
    resolution,
    type: ext.slice(1),
  };
}

module.exports = getAssetDataFromName;
