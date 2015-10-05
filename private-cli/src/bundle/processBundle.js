/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const log = require('../util/log').out('bundle');

function processBundle(input, shouldMinify) {
  log('start');
  let bundle;
  if (shouldMinify) {
    bundle = input.getMinifiedSourceAndMap();
  } else {
    bundle = {
      code: input.getSource(),
      map: JSON.stringify(input.getSourceMap()),
    };
  }
  bundle.assets = input.getAssets();
  log('finish');
  return bundle;
}

module.exports = processBundle;
