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
const externalHelpersPlugin = require('babel-plugin-external-helpers');
const fs = require('fs');
const makeHMRConfig = require('babel-preset-react-native/configs/hmr');
const resolvePlugins = require('babel-preset-react-native/lib/resolvePlugins');
const inlineRequiresPlugin = require('fbjs-scripts/babel-6/inline-requires');
const json5 = require('json5');
const path = require('path');

/**
 * Return a memoized function that checks for the existence of a
 * project level .babelrc file, and if it doesn't exist, reads the
 * default RN babelrc file and uses that.
 */
const getBabelRC = (function() {
  let babelRC = null;

  return function _getBabelRC(projectRoots) {
    if (babelRC !== null) {
      return babelRC;
    }

    babelRC = { plugins: [] }; // empty babelrc

    // Let's look for the .babelrc in the first project root.
    // In the future let's look into adding a command line option to specify
    // this location.
    //
    // NOTE: we're not reading the project's .babelrc here. We leave it up to
    // Babel to do that automatically and apply the transforms accordingly
    // (which works because we pass in `filename` and `sourceFilename` to
    // Babel when we transform).
    let projectBabelRCPath;
    if (projectRoots && projectRoots.length > 0) {
      projectBabelRCPath = path.resolve(projectRoots[0], '.babelrc');
    }

    // If a .babelrc file doesn't exist in the project,
    // use the Babel config provided with react-native.
    if (!projectBabelRCPath || !fs.existsSync(projectBabelRCPath)) {
      babelRC = json5.parse(
        fs.readFileSync(
          path.resolve(__dirname, 'react-packager', 'rn-babelrc.json'))
        );

      // Require the babel-preset's listed in the default babel config
      babelRC.presets = babelRC.presets.map((preset) => require('babel-preset-' + preset));
      babelRC.plugins = resolvePlugins(babelRC.plugins);
    }

    return babelRC;
  }
})();

/**
 * Given a filename and options, build a Babel
 * config object with the appropriate plugins.
 */
function buildBabelConfig(filename, options) {
  const babelRC = getBabelRC(options.projectRoots);

  const extraConfig = {
    filename,
    sourceFileName: filename,
  };

  let config = Object.assign({}, babelRC, extraConfig);

  // Add extra plugins
  const extraPlugins = [externalHelpersPlugin];

  if (options.inlineRequires) {
    extraPlugins.push(inlineRequiresPlugin);
  }

  config.plugins = extraPlugins.concat(config.plugins);

  if (options.hot) {
    const hmrConfig = makeHMRConfig(options);
    config = Object.assign({}, config, hmrConfig);
  }

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
