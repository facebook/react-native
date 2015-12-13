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
const inlineRequires = require('fbjs-scripts/babel/inline-requires');

function transform(src, filename, options) {
  options = options || {};
  const plugins = [];

  if (
    options.inlineRequires &&
    // (TODO: balpert, cpojer): Remove this once react is updated to 0.14
    !filename.endsWith('performanceNow.js')
  ) {
    plugins.push({
      position: 'after',
      transformer: inlineRequires,
    });
  }

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
