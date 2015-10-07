/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule resolveAssetSource
 *
 * Resolves an asset into a `source` for `Image`.
 */
'use strict';

var AssetRegistry = require('AssetRegistry');
var PixelRatio = require('PixelRatio');
var Platform = require('Platform');
var SourceCode = require('NativeModules').SourceCode;

var _serverURL;

function getDevServerURL() {
  if (!__DEV__) {
    // In prod we want assets to be loaded from the archive
    return null;
  }
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

/**
 * Returns the path at which the asset can be found in the archive
 */
function getPathInArchive(asset) {
  if (Platform.OS === 'android') {
    var assetDir = getBasePath(asset);
    // E.g. 'assets_awesomemodule_icon'
    // The Android resource system picks the correct scale.
    return (assetDir + '/' + asset.name)
      .toLowerCase()
      .replace(/\//g, '_')           // Encode folder structure in file name
      .replace(/([^a-z0-9_])/g, '')  // Remove illegal chars
      .replace(/^assets_/, '');      // Remove "assets_" prefix
  } else {
    // E.g. 'assets/AwesomeModule/icon@2x.png'
    return getScaledAssetPath(asset);
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
 * Returns a path like 'assets/AwesomeModule'
 */
function getBasePath(asset) {
  // TODO(frantic): currently httpServerLocation is used both as
  // path in http URL and path within IPA. Should we have zipArchiveLocation?
  var path = asset.httpServerLocation;
  if (path[0] === '/') {
    path = path.substr(1);
  }
  return path;
}

/**
 * Returns a path like 'assets/AwesomeModule/icon@2x.png'
 */
function getScaledAssetPath(asset) {
  var scale = pickScale(asset.scales, PixelRatio.get());
  var scaleSuffix = scale === 1 ? '' : '@' + scale + 'x';
  var assetDir = getBasePath(asset);
  return assetDir + '/' + asset.name + scaleSuffix + '.' + asset.type;
}

function pickScale(scales, deviceScale) {
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

function resolveAssetSource(source) {
  if (typeof source === 'object') {
    return source;
  }

  var asset = AssetRegistry.getAssetByID(source);
  if (asset) {
    return assetToImageSource(asset);
  }

  return null;
}

function assetToImageSource(asset) {
  var devServerURL = getDevServerURL();
  if (devServerURL) {
    return {
      __packager_asset: true,
      width: asset.width,
      height: asset.height,
      uri: getPathOnDevserver(devServerURL, asset),
      isStatic: false,
      scale: pickScale(asset.scales, PixelRatio.get()),
    };
  } else {
    return {
      __packager_asset: true,
      width: asset.width,
      height: asset.height,
      uri: getPathInArchive(asset),
      isStatic: true,
    };
  }
}

module.exports = resolveAssetSource;
module.exports.pickScale = pickScale;
