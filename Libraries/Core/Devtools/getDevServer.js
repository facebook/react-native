/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

import NativeSourceCode from '../../NativeModules/specs/NativeSourceCode';

let _cachedDevServerURL: ?string;
let _cachedFullBundleURL: ?string;
const FALLBACK = 'http://localhost:8081/';

type DevServerInfo = {
  url: string,
  fullBundleUrl: ?string,
  bundleLoadedFromServer: boolean,
  ...
};

/**
 * Many RN development tools rely on the development server (packager) running
 * @return URL to packager with trailing slash
 */
function getDevServer(): DevServerInfo {
  if (_cachedDevServerURL === undefined) {
    const scriptUrl = NativeSourceCode.getConstants().scriptURL;
    const match = scriptUrl.match(/^https?:\/\/.*?\//);
    _cachedDevServerURL = match ? match[0] : null;
    _cachedFullBundleURL = match ? scriptUrl : null;
  }

  return {
    url: _cachedDevServerURL ?? FALLBACK,
    fullBundleUrl: _cachedFullBundleURL,
    bundleLoadedFromServer: _cachedDevServerURL !== null,
  };
}

module.exports = getDevServer;
