/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
'use strict';

/**
 * Manually resolve all default Babel plugins.
 * `babel.transform` will attempt to resolve all base plugins relative to
 * the file it's compiling. This makes sure that we're using the plugins
 * installed in the react-native package.
 */
function resolvePlugins(plugins, prefix) {
  return plugins.map(plugin => resolvePlugin(plugin, prefix));
}

/**
 * Manually resolve a single Babel plugin.
 */
function resolvePlugin(plugin, prefix = '@babel/plugin-') {
  // Normalise plugin to an array.
  if (!Array.isArray(plugin)) {
    plugin = [plugin];
  }
  // Only resolve the plugin if it's a string reference.
  if (typeof plugin[0] === 'string') {
    plugin[0] = require(prefix + plugin[0]);
    plugin[0] = plugin[0].__esModule ? plugin[0].default : plugin[0];
  }
  return plugin;
}

module.exports = resolvePlugins;
module.exports.resolvePlugin = resolvePlugin;
module.exports.resolvePluginAs = (prefix, plugin) =>
  resolvePlugin(plugin, prefix);
module.exports.resolvePluginsAs = (prefix, plugins) =>
  resolvePlugins(plugins, prefix);
