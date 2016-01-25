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


const projectBabelRCPath = path.resolve(__dirname, '..', '..', '..', '.babelrc');

let babelRC = { plugins: [] };

// If a babelrc exists in the project,
// don't use the one provided with react-native.
if (!fs.existsSync(projectBabelRCPath)) {
  babelRC = json5.parse(
    fs.readFileSync(
      path.resolve(__dirname, 'react-packager', 'rn-babelrc.json')));
}

/**
 * Given a filename and options, build a Babel
 * config object with the appropriate plugins.
 */
function buildBabelConfig(filename, options) {
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

  // Add extra plugins
  const extraPlugins = [require('babel-plugin-external-helpers')];

  if (options.inlineRequires) {
    extraPlugins.push(inlineRequires);
  }

  config.plugins = extraPlugins.concat(config.plugins);

  return Object.assign({}, babelRC, config);
}

function transform(src, filename, options) {
  options = options || {};

  const babelConfig = buildBabelConfig(filename, options);
  const result = babel.transform(src, babelConfig);

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
