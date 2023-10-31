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

import typeof * as NativeSourceCodeModule from '../NativeModules/specs/NativeSourceCode';
import type {ResolvedAssetSource} from './AssetSourceResolver';
import type {ImageSource} from './ImageSource';

import AssetSourceResolver from './AssetSourceResolver';
import {pickScale} from './AssetUtils';
import AssetRegistry from '@react-native/assets-registry/registry';

let cachedCustomSourceTransformer,
  cachedServerURL,
  cachedScriptURL,
  cachedSourceCodeScriptURL;

function getSourceCodeScriptURL(): ?string {
  if (cachedSourceCodeScriptURL != null) {
    return cachedSourceCodeScriptURL;
  }

  let sourceCode: ?NativeSourceCodeModule['default'] =
    global.nativeExtensions && global.nativeExtensions.SourceCode;
  if (!sourceCode) {
    sourceCode = require('../NativeModules/specs/NativeSourceCode').default;
  }

  cachedSourceCodeScriptURL = sourceCode.getConstants().scriptURL;
  return cachedSourceCodeScriptURL;
}

function getDevServerURL(): ?string {
  // `null` is a valid produced value, so we return it immediately.
  if (cachedServerURL !== undefined) {
    return cachedServerURL;
  }

  const sourceCodeScriptURL = getSourceCodeScriptURL();
  const match = sourceCodeScriptURL?.match(/^https?:\/\/.*?\//);
  if (match) {
    // jsBundle was loaded from network
    cachedServerURL = match[0];
  } else {
    // jsBundle was loaded from file
    cachedServerURL = null;
  }

  return cachedServerURL;
}

function coerceLocalScriptURL(scriptURL: ?string): ?string {
  if (
    scriptURL == null ||
    // android: running from within assets, no offline path to use
    scriptURL.startsWith('assets://')
  ) {
    return null;
  }

  // Take the "directory" part of the scriptURL, as we assume the assets will
  // be in the same directory.
  let localScriptURL = scriptURL.substring(0, scriptURL.lastIndexOf('/') + 1);

  if (!localScriptURL.includes('://')) {
    // Add file protocol in case we have an absolute file path and not a URL.
    // This shouldn't really be necessary. scriptURL should be a URL.
    localScriptURL = 'file://' + localScriptURL;
  }

  return localScriptURL;
}

function getScriptURL(): ?string {
  if (cachedScriptURL === undefined) {
    cachedScriptURL = coerceLocalScriptURL(getSourceCodeScriptURL());
  }

  return cachedScriptURL;
}

function setCustomSourceTransformer(
  transformer: (resolver: AssetSourceResolver) => ResolvedAssetSource,
): void {
  cachedCustomSourceTransformer = transformer;
}

/**
 * `source` is either a number (opaque type returned by require('./foo.png'))
 * or an `ImageSource` like { uri: '<http location || file path>' }
 */
export default function resolveAssetSource(
  source: ?ImageSource,
): ?ResolvedAssetSource {
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

  if (cachedCustomSourceTransformer) {
    return cachedCustomSourceTransformer(resolver);
  }

  return resolver.defaultAsset();
}

resolveAssetSource.pickScale = pickScale;
resolveAssetSource.setCustomSourceTransformer = setCustomSourceTransformer;
