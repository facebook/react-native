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

var SourceCode = require('NativeModules').SourceCode;

var _serverURL;

function getServerURL() {
  if (_serverURL === undefined) {
    var scriptURL = SourceCode.scriptURL;
    var serverURLMatch = scriptURL && scriptURL.match(/^https?:\/\/.*?\//);
    if (serverURLMatch) {
      _serverURL = serverURLMatch[0];
    } else {
      _serverURL = null;
    }
  }

  return _serverURL;
}

// TODO(frantic):
//   * Use something other than `path`/`isStatic` for asset identification, `__packager_asset`?
//   * Add cache invalidating hashsum
//   * Move code that selects scale to client
function resolveAssetSource(source) {
  if (source.deprecated) {
    return {
      ...source,
      path: undefined,
      isStatic: true,
      deprecated: undefined,
    };
  }

  var serverURL = getServerURL();
  if (source.path) {
    if (serverURL) {
      return {
        ...source,
        path: undefined,
        uri: serverURL + source.uri,
        isStatic: false,
      };
    } else {
      return {
        ...source,
        path: undefined,
        isStatic: true,
      };
    }
  }

  return source;
}

module.exports = resolveAssetSource;
