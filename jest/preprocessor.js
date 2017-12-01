/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

/* eslint-env node */

'use strict';

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const babel = require('babel-core');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const babelRegisterOnly = require('metro/src/babelRegisterOnly');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const createCacheKeyFunction = require('fbjs-scripts/jest/createCacheKeyFunction');
const generate = require('babel-generator').default;

const nodeFiles = RegExp([
  '/local-cli/',
  '/metro(-bundler)?/',
].join('|'));
const nodeOptions = babelRegisterOnly.config([nodeFiles]);

babelRegisterOnly([]);

/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const transformer = require('metro/src/transformer.js');
module.exports = {
  process(src/*: string*/, file/*: string*/) {
    if (nodeFiles.test(file)) { // node specific transforms only
      return babel.transform(
        src,
        Object.assign({filename: file}, nodeOptions)
      ).code;
    }

    const {ast} = transformer.transform({
      filename: file,
      localPath: file,
      options: {
        dev: true,
        inlineRequires: true,
        minify: false,
        platform: '',
        projectRoot: '',
        retainLines: true,
      },
      src,
    });

    return generate(ast, {
      code: true,
      comments: false,
      compact: false,
      filename: file,
      retainLines: true,
      sourceFileName: file,
      sourceMaps: true,
    }, src).code;
  },

  getCacheKey: createCacheKeyFunction([
    __filename,
    require.resolve('metro/src/transformer.js'),
    require.resolve('babel-core/package.json'),
  ]),
};
