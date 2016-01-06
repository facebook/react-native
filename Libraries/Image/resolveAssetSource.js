/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule resolveAssetSource
 * @flow
 *
 * Resolves an asset into a `source` for `Image`.
 */
'use strict';

export type ResolvedAssetSource = {
  __packager_asset: boolean,
  width: number,
  height: number,
  uri: string,
  scale: number,
};

var AssetRegistry = require('AssetRegistry');
var PixelRatio = require('PixelRatio');
var Platform = require('Platform');
var SourceCode = require('NativeModules').SourceCode;
var assetPathUtils = require('../../local-cli/bundle/assetPathUtils');

var _serverURL, _offlinePath;

function getDevServerURL() {
  if (_serverURL === undefined) {
    var scriptURL = SourceCode.scriptURL;
    var match = scriptURL && scriptURL.match(/^https?:\/\/.*?\//);
    if (match) {
      // Bundle was loaded from network
      _serverURL = match[0];
    } else {
      // Bundle was loaded from file
      _serverURL = null;
    }
  }

  return _serverURL;
}

function getOfflinePath() {
  if (_offlinePath === undefined) {
    var scriptURL = SourceCode.scriptURL;
    var match = scriptURL && scriptURL.match(/^file:\/\/(\/.*\/)/);
    if (match) {
      _offlinePath = match[1];
    } else {
      _offlinePath = '';
    }
  }

  return _offlinePath;
}

/**
 * Returns the path at which the asset can be found in the archive
 */
function getPathInArchive(asset) {
  var offlinePath = getOfflinePath();
  if (Platform.OS === 'android') {
    if (offlinePath) {
      // E.g. 'file:///sdcard/AwesomeModule/drawable-mdpi/icon.png'
      return 'file://' + offlinePath + getAssetPathInDrawableFolder(asset);
    }
    // E.g. 'assets_awesomemodule_icon'
    // The Android resource system picks the correct scale.
    return assetPathUtils.getAndroidResourceIdentifier(asset);
  } else {
    // E.g. '/assets/AwesomeModule/icon@2x.png'
    return offlinePath + getScaledAssetPath(asset);
  }
}

/**
 * Returns an absolute URL which can be used to fetch the asset
 * from the devserver
 */
function getPathOnDevserver(devServerUrl, asset) {
  return devServerUrl + getScaledAssetPath(asset) + '?platform=' + Platform.OS +
    '&hash=' + asset.hash;
}

/**
 * Returns a path like 'assets/AwesomeModule/icon@2x.png'
 */
function getScaledAssetPath(asset) {
  var scale = pickScale(asset.scales, PixelRatio.get());
  var scaleSuffix = scale === 1 ? '' : '@' + scale + 'x';
  var assetDir = assetPathUtils.getBasePath(asset);
  return assetDir + '/' + asset.name + scaleSuffix + '.' + asset.type;
}

/**
 * Returns a path like 'drawable-mdpi/icon.png'
 */
function getAssetPathInDrawableFolder(asset) {
  var scale = pickScale(asset.scales, PixelRatio.get());
  var drawbleFolder = assetPathUtils.getAndroidDrawableFolderName(asset, scale);
  var fileName =  assetPathUtils.getAndroidResourceIdentifier(asset);
  return drawbleFolder + '/' + fileName + '.' + asset.type;
}

function pickScale(scales: Array<number>, deviceScale: number): number {
  // Packager guarantees that `scales` array is sorted
  for (var i = 0; i < scales.length; i++) {
    if (scales[i] >= deviceScale) {
      return scales[i];
    }
  }

  // If nothing matches, device scale is larger than any available
  // scales, so we return the biggest one. Unless the array is empty,
  // in which case we default to 1
  return scales[scales.length - 1] || 1;
}

function resolveAssetSource(source: any): ?ResolvedAssetSource {
  if (typeof source === 'object') {
    return source;
  }

  var asset = AssetRegistry.getAssetByID(source);
  if (asset) {
    return assetToImageSource(asset);
  }

  return null;
}

function assetToImageSource(asset): ResolvedAssetSource {
  var devServerURL = getDevServerURL();
  return {
    __packager_asset: true,
    width: asset.width,
    height: asset.height,
    uri: devServerURL ? getPathOnDevserver(devServerURL, asset) : getPathInArchive(asset),
    scale: pickScale(asset.scales, PixelRatio.get()),
  };
}

module.exports = resolveAssetSource;
module.exports.pickScale = pickScale;
