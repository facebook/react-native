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

const AssetRegistry = require('AssetRegistry');
const AssetSourceResolver = require('AssetSourceResolver');
const NativeModules = require('NativeModules');

import type { ResolvedAssetSource } from 'AssetSourceResolver';

let _customSourceTransformer, _serverURL, _bundleSourceURL;

function getDevServerURL(): ?string {
  if (_serverURL === undefined) {
    var scriptURL = NativeModules.SourceCode.scriptURL;
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

function getBundleSourceURL(): ?string {
  if (_bundleSourceURL === undefined) {
    const scriptURL = NativeModules.SourceCode.scriptURL;
    if (!scriptURL) {
      // scriptURL is falsy, we have nothing to go on here
      _bundleSourceURL = null;
      return _bundleSourceURL;
    }
    if (scriptURL.startsWith('assets://')) {
      // android: running from within assets, no offline path to use
      _bundleSourceURL = null;
      return _bundleSourceURL;
    }
    _bundleSourceURL = scriptURL.substring(0, scriptURL.lastIndexOf('/') + 1);
    if (!scriptURL.startsWith('file://')) {
      // Add file protocol in case we have an absolute file path and not a URL.
      // This shouldn't really be necessary. scriptURL should be a URL.
      _bundleSourceURL = 'file://' + _bundleSourceURL;
    }
  }

  return _bundleSourceURL;
}

function setCustomSourceTransformer(
  transformer: (resolver: AssetSourceResolver) => ResolvedAssetSource,
): void {
  _customSourceTransformer = transformer;
}

/**
 * `source` is either a number (opaque type returned by require('./foo.png'))
 * or an `ImageSource` like { uri: '<http location || file path>' }
 */
function resolveAssetSource(source: any): ?ResolvedAssetSource {
  if (typeof source === 'object') {
    return source;
  }

  var asset = AssetRegistry.getAssetByID(source);
  if (!asset) {
    return null;
  }

  const resolver = new AssetSourceResolver(getDevServerURL(), getBundleSourceURL(), asset);
  if (_customSourceTransformer) {
    return _customSourceTransformer(resolver);
  }
  return resolver.defaultAsset();
}

module.exports = resolveAssetSource;
module.exports.pickScale = AssetSourceResolver.pickScale;
module.exports.setCustomSourceTransformer = setCustomSourceTransformer;
