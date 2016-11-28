/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

const findPluginInFolder = (folder) => {
  const pjson = readPackage(folder);

  if (!pjson) {
    return [];
  }

  const deps = union(
    Object.keys(pjson.dependencies || {}),
    Object.keys(pjson.devDependencies || {})
  );

  return deps.reduce(
    (acc, pkg) => {
      if (isRNPMPlugin(pkg)) {
        return acc.concat(pkg);
      }
      if (isReactNativePlugin(pkg)) {
        const pkgJson = readPackage(path.join(folder, 'node_modules', pkg));
        if (!pkgJson) {
          return acc;
        }
        return acc.concat(findPluginsInReactNativePackage(pkgJson));
      }
      return acc;
    },
    []
  );
};

/**
 * Find plugins in package.json of the given folder
 * @param {String} folder Path to the folder to get the package.json from
 * @type  {Array}         Array of plugins or an empty array if no package.json found
 */
module.exports = function findPlugins(folders) {
  return uniq(flatten(folders.map(findPluginInFolder)));
};
