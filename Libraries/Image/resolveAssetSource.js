/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule resolveAssetSource
 */
'use strict';

var AssetRegistry = require('AssetRegistry');
var PixelRatio = require('PixelRatio');
var SourceCode = require('NativeModules').SourceCode;

var _serverURL;

function getServerURL() {
  if (_serverURL === undefined) {
    var scriptURL = SourceCode.scriptURL;
    var match = scriptURL && scriptURL.match(/^https?:\/\/.*?\//);
    if (match) {
      _serverURL = match[0];
    } else {
      _serverURL = null;
    }
  }

  return _serverURL;
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
  // TODO(frantic): currently httpServerLocation is used both as
  // path in http URL and path within IPA. Should we have zipArchiveLocation?
  var path = asset.httpServerLocation;
  if (path[0] === '/') {
    path = path.substr(1);
  }

  var scale = pickScale(asset.scales, PixelRatio.get());
  var scaleSuffix = scale === 1 ? '' : '@' + scale + 'x';

  var fileName = asset.name + scaleSuffix + '.' + asset.type;
  var serverURL = getServerURL();
  if (serverURL) {
    return {
      width: asset.width,
      height: asset.height,
      uri: serverURL + path + '/' + fileName +
        '?hash=' + asset.hash,
      isStatic: false,
    };
  } else {
    return {
      width: asset.width,
      height: asset.height,
      uri: path + '/' + fileName,
      isStatic: true,
    };
  }
}

module.exports = resolveAssetSource;
module.exports.pickScale = pickScale;
