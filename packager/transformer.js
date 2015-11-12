/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Note: This is a fork of the fb-specific transform.js
 */
'use strict';

const babel = require('babel-core');
const inlineRequires = require('fbjs-scripts/babel-6/inline-requires');

function transform(src, filename, options) {
  options = options || {};
  const plugins = [];

  if (options.inlineRequires) {
    plugins.push([inlineRequires]);
  }

  const result = babel.transform(src, {
    retainLines: true,
    compact: true,
    comments: false,
    filename,
    plugins: plugins.concat([
      // Keep in sync with packager/react-packager/.babelrc
      'external-helpers-2',
      'syntax-async-functions',
      'syntax-class-properties',
      'syntax-jsx',
      'syntax-trailing-function-commas',
      'transform-class-properties',
      'transform-es2015-arrow-functions',
      'transform-es2015-block-scoping',
      'transform-es2015-classes',
      'transform-es2015-computed-properties',
      'transform-es2015-constants',
      'transform-es2015-destructuring',
      ['transform-es2015-modules-commonjs', {strict: false, allowTopLevelThis: true}],
      'transform-es2015-parameters',
      'transform-es2015-shorthand-properties',
      'transform-es2015-spread',
      'transform-es2015-template-literals',
      'transform-flow-strip-types',
      'transform-object-assign',
      'transform-object-rest-spread',
      'transform-object-assign',
      'transform-react-display-name',
      'transform-react-jsx',
      'transform-regenerator',
    ]),
    sourceFileName: filename,
    sourceMaps: false,
  });

  return {
    code: result.code
  };
}

module.exports = function(data, callback) {
  let result;
  try {
    result = transform(data.sourceCode, data.filename, data.options);
  } catch (e) {
    callback(e);
    return;
  }

  callback(null, result);
};

// export for use in jest
module.exports.transform = transform;
