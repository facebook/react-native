/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const asIndexedFile = require('./as-indexed-file');
const asAssets = require('./as-assets');

function buildBundle(packagerClient, requestOptions) {
  return packagerClient.buildBundle({...requestOptions, unbundle: true});
}

function saveUnbundle(bundle, options, log) {
  // we fork here depending on the platform:
  // while android is pretty good at loading individual assets, ios has a large
  // overhead when reading hundreds pf assets from disk
  return options.platform === 'android' ?
    asAssets(bundle, options, log) :
    asIndexedFile(bundle, options, log);
}

exports.build = buildBundle;
exports.save = saveUnbundle;
exports.formatName = 'bundle';
