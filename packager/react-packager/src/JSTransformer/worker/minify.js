/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const uglify = require('uglify-js');

function minify(filename, code, sourceMap) {
  const minifyResult = uglify.minify(code, {
    fromString: true,
    inSourceMap: sourceMap,
    outSourceMap: true,
    output: {
      ascii_only: true,
      screw_ie8: true,
    },
  });

  minifyResult.map = JSON.parse(minifyResult.map);
  minifyResult.map.sources = [filename];
  return minifyResult;
}

module.exports = minify;
