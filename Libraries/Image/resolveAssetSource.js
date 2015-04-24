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

// TODO(frantic):
//   * Pick best scale and append @Nx to file path
//   * We are currently using httpServerLocation for both http and in-app bundle
function resolveAssetSource(source) {
  if (!source.__packager_asset) {
    return source;
  }

  // Deprecated assets are managed by Xcode for now,
  // just returning image name as `uri`
  // Examples:
  //   require('image!deprecatd_logo_example')
  //   require('./new-hotness-logo-example.png')
  if (source.deprecated) {
    return {
      width: source.width,
      height: source.height,
      isStatic: true,
      uri: source.name || source.uri, // TODO(frantic): remove uri
    };
  }

  // TODO(frantic): currently httpServerLocation is used both as
  // path in http URL and path within IPA. Should we have zipArchiveLocation?
  var path = source.httpServerLocation;
  if (path[0] === '/') {
    path = path.substr(1);
  }

  var scale = pickScale(source.scales, PixelRatio.get());
  var scaleSuffix = scale === 1 ? '' : '@' + scale + 'x';

  var fileName = source.name + scaleSuffix + '.' + source.type;
  var serverURL = getServerURL();
  if (serverURL) {
    return {
      width: source.width,
      height: source.height,
      uri: serverURL + path + '/' + fileName +
        '?hash=' + source.hash,
      isStatic: false,
    };
  } else {
    return {
      width: source.width,
      height: source.height,
      uri: path + '/' + fileName,
      isStatic: true,
    };
  }

  return source;
}

module.exports = resolveAssetSource;
module.exports.pickScale = pickScale;
