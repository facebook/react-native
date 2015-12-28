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

  if (options.inlineRequires) {
    extraPlugins.push(inlineRequires);
  }
  config.plugins = extraPlugins.concat(config.plugins);

  // Manually resolve all default Babel plugins. babel.transform will attempt to resolve
  // all base plugins relative to the file it's compiling. This makes sure that we're
  // using the plugins installed in the react-native package.
  config.plugins = config.plugins.map(function(plugin) {
    // Normalise plugin to an array.
    if (!Array.isArray(plugin)) {
      plugin = [plugin];
    }
    // Only resolve the plugin if it's a string reference.
    if (typeof plugin[0] === 'string') {
      plugin[0] = require(`babel-plugin-${plugin[0]}`);
      plugin[0] = plugin[0].__esModule ? plugin[0].default : plugin[0];
    }
    return plugin;
  });

  const result = babel.transform(src, Object.assign({}, babelRC, config));

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
