/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

/**
 * Manually resolve all default Babel plugins.
 * `babel.transform` will attempt to resolve all base plugins relative to
 * the file it's compiling. This makes sure that we're using the plugins
 * installed in the react-native package.
 */
function resolvePlugins(plugins) {
  return plugins.map(function(plugin) {
    // Normalise plugin to an array.
    if (!Array.isArray(plugin)) {
      plugin = [plugin];
    }
    // Only resolve the plugin if it's a string reference.
    if (typeof plugin[0] === 'string') {
      plugin[0] = require('babel-plugin-' + plugin[0]);
      plugin[0] = plugin[0].__esModule ? plugin[0].default : plugin[0];
    }
    return plugin;
  });
}

module.exports = resolvePlugins;
