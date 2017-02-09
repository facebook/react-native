/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const babel = require('babel-core');
const babelRegisterOnly = require('../packager/babelRegisterOnly');
const createCacheKeyFunction = require('fbjs-scripts/jest/createCacheKeyFunction');
const path = require('path');

const nodeFiles = RegExp([
  '/local-cli/',
  '/packager/(?!src/Resolver/polyfills/)',
].join('|'));
const nodeOptions = babelRegisterOnly.config([nodeFiles]);

babelRegisterOnly([]);
// has to be required after setting up babelRegisterOnly
const transformer = require('../packager/transformer.js');

module.exports = {
  process(src, file) {
    // Don't transform node_modules, except react-tools which includes the
    // untransformed copy of React
    if (file.match(/node_modules\/(?!react-tools\/)/)) {
      return src;
    } else if (nodeFiles.test(file)) { // node specific transforms only
      return babel.transform(
        src, Object.assign({filename: file}, nodeOptions)).code;
    }

    return transformer.transform(src, file, {inlineRequires: true}).code;
  },

  getCacheKey: createCacheKeyFunction([
    __filename,
    path.join(__dirname, '../packager/transformer.js'),
    require.resolve('babel-core/package.json'),
  ]),
};
