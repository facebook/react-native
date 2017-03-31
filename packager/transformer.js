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
const generate = require('babel-generator').default;
const inlineRequiresPlugin = require('babel-preset-fbjs/plugins/inline-requires');
const json5 = require('json5');
const makeHMRConfig = require('babel-preset-react-native/configs/hmr');
const path = require('path');
const resolvePlugins = require('babel-preset-react-native/lib/resolvePlugins');

const {compactMapping} = require('./src/Bundler/source-map');

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

    babelRC = {plugins: []}; // empty babelrc

    // Let's look for the .babelrc in the first project root.
    // In the future let's look into adding a command line option to specify
    // this location.
    let projectBabelRCPath;
    if (projectRoots && projectRoots.length > 0) {
      projectBabelRCPath = path.resolve(projectRoots[0], '.babelrc');
    }

    // If a .babelrc file doesn't exist in the project,
    // use the Babel config provided with react-native.
    if (!projectBabelRCPath || !fs.existsSync(projectBabelRCPath)) {
      babelRC = json5.parse(
        fs.readFileSync(
          path.resolve(__dirname, 'rn-babelrc.json'))
        );

      // Require the babel-preset's listed in the default babel config
      babelRC.presets = babelRC.presets.map(preset => require('babel-preset-' + preset));
      babelRC.plugins = resolvePlugins(babelRC.plugins);
    } else {
      // if we find a .babelrc file we tell babel to use it
      babelRC.extends = projectBabelRCPath;
    }

    return babelRC;
  };
})();

/**
 * Given a filename and options, build a Babel
 * config object with the appropriate plugins.
 */
function buildBabelConfig(filename, options) {
  const babelRC = getBabelRC(options.projectRoots);

  const extraConfig = {
    code: false,
    filename,
  };

  let config = Object.assign({}, babelRC, extraConfig);

  // Add extra plugins
  const extraPlugins = [externalHelpersPlugin];

  var inlineRequires = options.inlineRequires;
  var blacklist = inlineRequires && inlineRequires.blacklist;
  if (inlineRequires && !(blacklist && filename in blacklist)) {
    extraPlugins.push(inlineRequiresPlugin);
  }

  config.plugins = extraPlugins.concat(config.plugins);

  if (options.hot) {
    const hmrConfig = makeHMRConfig(options, filename);
    config = Object.assign({}, config, hmrConfig);
  }

  return Object.assign({}, babelRC, config);
}

function transform(src, filename, options) {
  options = options || {};

  const OLD_BABEL_ENV = process.env.BABEL_ENV;
  process.env.BABEL_ENV = options.dev ? 'development' : 'production';

  try {
    const babelConfig = buildBabelConfig(filename, options);
    const {ast} = babel.transform(src, babelConfig);
    const result = generate(ast, {
      comments: false,
      compact: false,
      filename,
      sourceFileName: filename,
      sourceMaps: true,
    }, src);

    return {
      ast,
      code: result.code,
      filename,
      map: options.generateSourceMaps ? result.map : result.rawMappings.map(compactMapping),
    };
  } finally {
    process.env.BABEL_ENV = OLD_BABEL_ENV;
  }
}

module.exports.transform = transform;
