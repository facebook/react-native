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
const fs = require('fs');
const inlineRequires = require('fbjs-scripts/babel-6/inline-requires');
const json5 = require('json5');
const path = require('path');
const ReactPackager = require('./react-packager');
const resolvePlugins = require('./react-packager/src/JSTransformer/resolvePlugins');

const babelRC =
  json5.parse(
    fs.readFileSync(
      path.resolve(__dirname, 'react-packager', '.babelrc')));

function transform(src, filename, options) {
  options = options || {};

  const extraPlugins = ['external-helpers-2'];
  const extraConfig = {
    filename,
    sourceFileName: filename,
  };

  const config = Object.assign({}, babelRC, extraConfig);
  if (options.hot) {
    extraPlugins.push([
      'react-transform',
      {
        transforms: [{
          transform: 'react-transform-hmr/lib/index.js',
          imports: ['React'],
          locals: ['module'],
        }]
      },
    ]);
  }

  if (options.inlineRequires) {
    extraPlugins.push(inlineRequires);
  }
  config.plugins = resolvePlugins(extraPlugins.concat(config.plugins));

  const result = babel.transform(src, Object.assign({}, babelRC, config));

  return {
    code: result.code,
    filename: filename,
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
