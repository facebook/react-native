/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const {SourceCode} = require('../../BatchedBridge/NativeModules');

let _cachedDevServerURL: ?string;
const FALLBACK = 'http://localhost:8081/';

type DevServerInfo = {
  url: string,
  bundleLoadedFromServer: boolean,
};

/**
 * Many RN development tools rely on the development server (packager) running
 * @return URL to packager with trailing slash
 */
function getDevServer(): DevServerInfo {
  if (_cachedDevServerURL === undefined) {
    const match =
      SourceCode &&
      SourceCode.scriptURL &&
      SourceCode.scriptURL.match(/^https?:\/\/.*?\//);
    _cachedDevServerURL = match ? match[0] : null;
  }

  return {
    url: _cachedDevServerURL || FALLBACK,
    bundleLoadedFromServer: _cachedDevServerURL !== null,
  };
}

module.exports = getDevServer;
