/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

// Resolves an asset into a `source` for `Image`.

'use strict';

import type {ResolvedAssetSource} from './AssetSourceResolver';
import type {ImageSource} from './ImageSource';

const AssetSourceResolver = require('./AssetSourceResolver');
const {pickScale} = require('./AssetUtils');
const AssetRegistry = require('@react-native/assets-registry/registry');

let _customSourceTransformer, _serverURL, _scriptURL;

let _sourceCodeScriptURL: ?string;
function getSourceCodeScriptURL(): ?string {
  if (_sourceCodeScriptURL != null) {
    return _sourceCodeScriptURL;
  }

  let sourceCode =
    global.nativeExtensions && global.nativeExtensions.SourceCode;
  if (!sourceCode) {
    sourceCode = require('../NativeModules/specs/NativeSourceCode').default;
  }
  _sourceCodeScriptURL = sourceCode.getConstants().scriptURL;
  return _sourceCodeScriptURL;
}

function getDevServerURL(): ?string {
  if (_serverURL === undefined) {
    const sourceCodeScriptURL = getSourceCodeScriptURL();
    const match = sourceCodeScriptURL?.match(/^https?:\/\/.*?\//);
    if (match) {
      // jsBundle was loaded from network
      _serverURL = match[0];
    } else {
      // jsBundle was loaded from file
      _serverURL = null;
    }
  }
  return _serverURL;
}

function _coerceLocalScriptURL(scriptURL: ?string): ?string {
  let normalizedScriptURL = scriptURL;

  if (normalizedScriptURL != null) {
    if (normalizedScriptURL.startsWith('assets://')) {
      // android: running from within assets, no offline path to use
      return null;
    }
    normalizedScriptURL = normalizedScriptURL.substring(
      0,
      normalizedScriptURL.lastIndexOf('/') + 1,
    );
    if (!normalizedScriptURL.includes('://')) {
      // Add file protocol in case we have an absolute file path and not a URL.
      // This shouldn't really be necessary. scriptURL should be a URL.
      normalizedScriptURL = 'file://' + normalizedScriptURL;
    }
  }

  return normalizedScriptURL;
}

function getScriptURL(): ?string {
  if (_scriptURL === undefined) {
    _scriptURL = _coerceLocalScriptURL(getSourceCodeScriptURL());
  }
  return _scriptURL;
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
function resolveAssetSource(source: ?ImageSource): ?ResolvedAssetSource {
  if (source == null || typeof source === 'object') {
    // $FlowFixMe[incompatible-exact] `source` doesn't exactly match `ResolvedAssetSource`
    // $FlowFixMe[incompatible-return] `source` doesn't exactly match `ResolvedAssetSource`
    return source;
  }

  const asset = AssetRegistry.getAssetByID(source);
  if (!asset) {
    return null;
  }

  const resolver = new AssetSourceResolver(
    getDevServerURL(),
    getScriptURL(),
    asset,
  );
  if (_customSourceTransformer) {
    return _customSourceTransformer(resolver);
  }
  return resolver.defaultAsset();
}

resolveAssetSource.pickScale = pickScale;
resolveAssetSource.setCustomSourceTransformer = setCustomSourceTransformer;
module.exports = resolveAssetSource;
