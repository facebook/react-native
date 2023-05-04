/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const path = require('path');
const {readdirSync, readFileSync} = require('fs');

const ROOT_LOCATION = path.join(__dirname, '..', '..');
const PACKAGES_LOCATION = path.join(ROOT_LOCATION, 'packages');

const DEFAULT_OPTIONS = {includeReactNative: false};

/**
 * Function, which returns an array of all directories inside specified location
 *
 * @param {string} source Path to directory, where this should be executed
 * @returns {string[]} List of directories names
 */
const getDirectories = source =>
  readdirSync(source, {withFileTypes: true})
    .filter(file => file.isDirectory())
    .map(directory => directory.name);

/**
 * @callback forEachPackageCallback
 * @param {string} packageAbsolutePath
 * @param {string} packageRelativePathFromRoot
 * @param {Object} packageManifest
 */

/**
 * Iterate through every package inside /packages (ignoring react-native) and call provided callback for each of them
 *
 * @param {forEachPackageCallback} callback The callback which will be called for each package
 * @param {{includeReactNative: (boolean|undefined)}} [options={}] description
 */
const forEachPackage = (callback, options = DEFAULT_OPTIONS) => {
  const {includeReactNative} = options;

  // We filter react-native package on purpose, so that no CI's script will be executed for this package in future
  // Unless includeReactNative options is provided
  const packagesDirectories = getDirectories(PACKAGES_LOCATION).filter(
    directoryName => directoryName !== 'react-native' || includeReactNative,
  );

  packagesDirectories.forEach(packageDirectory => {
    const packageAbsolutePath = path.join(PACKAGES_LOCATION, packageDirectory);
    const packageRelativePathFromRoot = path.join('packages', packageDirectory);

    const packageManifest = JSON.parse(
      readFileSync(path.join(packageAbsolutePath, 'package.json')),
    );

    callback(packageAbsolutePath, packageRelativePathFromRoot, packageManifest);
  });
};

module.exports = forEachPackage;
