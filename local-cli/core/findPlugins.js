/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const path = require('path');
const union = require('lodash').union;
const uniq = require('lodash').uniq;
const flatten = require('lodash').flatten;

/**
 * Filter dependencies by name pattern
 * @param  {String} dependency Name of the dependency
 * @return {Boolean}           If dependency is a rnpm plugin
 */
const isRNPMPlugin = (dependency) => dependency.indexOf('rnpm-plugin-') === 0;
const isReactNativePlugin = (dependency) => dependency.indexOf('react-native-') === 0;

const readPackage = (folder) => {
  try {
    return require(path.join(folder, 'package.json'));
  } catch (e) {
    return null;
  }
};

const findPluginsInReactNativePackage = (pjson) => {
  if (!pjson.rnpm || !pjson.rnpm.plugin) {
    return [];
  }

  return path.join(pjson.name, pjson.rnpm.plugin);
};

const findPlatformsInPackage = (pjson) => {
  if (!pjson.rnpm || !pjson.rnpm.platform) {
    return [];
  }

  return path.join(pjson.name, pjson.rnpm.platform);
};

const findPluginInFolder = (folder) => {
  const pjson = readPackage(folder);

  if (!pjson) {
    return {commands: [], platforms: []};
  }

  const deps = union(
    Object.keys(pjson.dependencies || {}),
    Object.keys(pjson.devDependencies || {})
  );

  return deps.reduce(
    (acc, pkg) => {
      let commands = acc.commands;
      let platforms = acc.platforms;
      if (isRNPMPlugin(pkg)) {
        commands = commands.concat(pkg);
      }
      if (isReactNativePlugin(pkg)) {
        const pkgJson = readPackage(path.join(folder, 'node_modules', pkg));
        if (pkgJson) {
          commands = commands.concat(findPluginsInReactNativePackage(pkgJson));
          platforms = platforms.concat(findPlatformsInPackage(pkgJson));
        }
      }
      return {commands: commands, platforms: platforms};
    },
    {commands: [], platforms: []}
  );
};

/**
 * Find plugins in package.json of the given folder
 * @param {String} folder Path to the folder to get the package.json from
 * @type  {Object}        Object of commands and platform plugins
 */
module.exports = function findPlugins(folders) {
  const plugins = folders.map(findPluginInFolder);
  return {
    commands: uniq(flatten(plugins.map(p => p.commands))),
    platforms: uniq(flatten(plugins.map(p => p.platforms)))
  };
};
