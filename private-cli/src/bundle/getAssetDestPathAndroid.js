/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const path = require('path');

function getAndroidAssetSuffix(scale) {
  switch (scale) {
    case 0.75: return 'ldpi';
    case 1: return 'mdpi';
    case 1.5: return 'hdpi';
    case 2: return 'xhdpi';
    case 3: return 'xxhdpi';
    case 4: return 'xxxhdpi';
  }
}

function getAssetDestPathAndroid(asset, scale) {
  var suffix = getAndroidAssetSuffix(scale);
  if (!suffix) {
    throw new Error(
      'Don\'t know which android drawable suffix to use for asset: ' +
      JSON.stringify(asset)
    );
  }
  const androidFolder = 'drawable-' + suffix;
  // TODO: reuse this logic from https://fburl.com/151101135
  const fileName = (asset.httpServerLocation.substr(1) + '/' + asset.name)
    .toLowerCase()
    .replace(/\//g, '_')           // Encode folder structure in file name
    .replace(/([^a-z0-9_])/g, '')  // Remove illegal chars
    .replace(/^assets_/, '');      // Remove "assets_" prefix

  return path.join(androidFolder, fileName + '.' + asset.type);
}

module.exports = getAssetDestPathAndroid;
