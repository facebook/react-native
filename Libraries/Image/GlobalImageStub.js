/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule GlobalImageStub
 * @flow
 */
'use strict';

// This is a stub for flow to make it understand require('image!icon')
// See packager/react-packager/src/Bundler/index.js

module.exports = {
  __packager_asset: true,
  path: '/full/path/to/something.png',
  uri: 'icon',
  width: 100,
  height: 100,
  deprecated: true,
};
