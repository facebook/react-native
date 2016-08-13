/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule getDevServer
 * @flow
 */
'use strict';

const {SourceCode} = require('NativeModules');

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
    const match = SourceCode.scriptURL && SourceCode.scriptURL.match(/^https?:\/\/.*?\//);
    _cachedDevServerURL = match ? match[0] : null;
  }

  return {
    url: _cachedDevServerURL || FALLBACK,
    bundleLoadedFromServer: _cachedDevServerURL !== null,
  };
}

module.exports = getDevServer;
