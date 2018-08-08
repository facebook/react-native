/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

// This is a stub for flow to make it understand require('./icon.png')
// See metro/src/Bundler/index.js

const AssetRegistry = require('AssetRegistry');

module.exports = AssetRegistry.registerAsset({
  __packager_asset: true,
  fileSystemLocation: '/full/path/to/directory',
  httpServerLocation: '/assets/full/path/to/directory',
  width: 100,
  height: 100,
  scales: [1, 2, 3],
  hash: 'nonsense',
  name: 'icon',
  type: 'png',
});
