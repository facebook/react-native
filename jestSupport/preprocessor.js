/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const createCacheKeyFunction = require('fbjs-scripts/jest/createCacheKeyFunction');
const path = require('path');
const transformer = require('../packager/transformer.js');
const fs = require('fs');

var babel_core_location = path.join(__dirname, '../node_modules/babel-core/package.json');
try {
  fs.lstatSync(babel_core_location);
}
catch(e) {
  babel_core_location = path.join(__dirname, '../../babel-core/package.json');
}

module.exports = {
  process(src, file) {
    // Don't transform node_modules, except react-tools which includes the
    // untransformed copy of React
    if (file.match(/node_modules\/(?!react-tools\/)/)) {
      return src;
    }

    return transformer.transform(src, file, {inlineRequires: true}).code;
  },

  getCacheKey: createCacheKeyFunction([
    __filename,
    path.join(__dirname, '../packager/transformer.js'),
    babel_core_location,
  ]),
};
