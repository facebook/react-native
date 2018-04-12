/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/* eslint-env node */

'use strict';

const {transformSync: babelTransformSync} = require('@babel/core');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const babelRegisterOnly = require('metro/src/babelRegisterOnly');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const createCacheKeyFunction = require('fbjs-scripts/jest/createCacheKeyFunction');
const generate = require('@babel/generator').default;

const nodeFiles = RegExp([
  '/local-cli/',
  '/metro(-bundler)?/',
].join('|'));
const nodeOptions = babelRegisterOnly.config([nodeFiles]);

babelRegisterOnly([]);

/* $FlowFixMe(site=react_native_oss) */
const transformer = require('metro/src/transformer.js');
module.exports = {
  process(src/*: string*/, file/*: string*/) {
    if (nodeFiles.test(file)) { // node specific transforms only
      return babelTransformSync(
        src,
        Object.assign({filename: file}, nodeOptions)
      ).code;
    }

    const {ast} = transformer.transform({
      filename: file,
      localPath: file,
      options: {
        assetDataPlugins: [],
        dev: true,
        inlineRequires: true,
        minify: false,
        platform: '',
        projectRoot: '',
        retainLines: true,
      },
      src,
      plugins: [
        [require('@babel/plugin-transform-block-scoping')],
        // the flow strip types plugin must go BEFORE class properties!
        // there'll be a test case that fails if you don't.
        [require('@babel/plugin-transform-flow-strip-types')],
        [
          require('@babel/plugin-proposal-class-properties'),
          // use `this.foo = bar` instead of `this.defineProperty('foo', ...)`
          // (Makes the properties enumerable)
          {loose: true},
        ],
        [require('@babel/plugin-transform-computed-properties')],
        [require('@babel/plugin-transform-destructuring')],
        [require('@babel/plugin-transform-function-name')],
        [require('@babel/plugin-transform-literals')],
        [require('@babel/plugin-transform-parameters')],
        [require('@babel/plugin-transform-shorthand-properties')],
        [require('@babel/plugin-transform-react-jsx')],
        [require('@babel/plugin-transform-regenerator')],
        [require('@babel/plugin-transform-sticky-regex')],
        [require('@babel/plugin-transform-unicode-regex')],
        [
          require('@babel/plugin-transform-modules-commonjs'),
          {strict: false, allowTopLevelThis: true},
        ],
        [require('@babel/plugin-transform-classes')],
        [require('@babel/plugin-transform-arrow-functions')],
        [require('@babel/plugin-transform-spread')],
        [require('@babel/plugin-proposal-object-rest-spread')],
        [
          require('@babel/plugin-transform-template-literals'),
          {loose: true}, // dont 'a'.concat('b'), just use 'a'+'b'
        ],
        [require('@babel/plugin-transform-exponentiation-operator')],
        [require('@babel/plugin-transform-object-assign')],
        [require('@babel/plugin-transform-for-of'), {loose: true}],
        [require('@babel/plugin-transform-react-display-name')],
        [require('@babel/plugin-transform-react-jsx-source')],
      ],
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
    require.resolve('@babel/core/package.json'),
  ]),
};
