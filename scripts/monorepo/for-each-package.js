/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {readdirSync, readFileSync} = require('fs');
const path = require('path');

const REPO_ROOT = path.join(path.dirname(__filename), '..', '..');
const PACKAGES_LOCATION = path.join(REPO_ROOT, 'packages');

const DEFAULT_OPTIONS /*: Options */ = {includeReactNative: false};

/*::
type PackageJSON = {
  name: string,
  private?: ?boolean,
  version: string,
  dependencies: {[string]: string},
  devDependencies: {[string]: string},
  ...
};

type Options = {
  includeReactNative?: ?boolean,
};
*/

/**
 * Function, which returns an array of all directories inside specified location
 */
const getDirectories = (source /*: string */) /*: Array<string> */ =>
  readdirSync(source, {withFileTypes: true})
    .filter(file => file.isDirectory())
    .map(directory => directory.name.toString());
/**
 * Iterate through every package inside /packages (ignoring react-native) and call provided callback for each of them
 */
const forEachPackage = (
  callback /*: (string, string, PackageJSON) => void */,
  options /*: Options */ = DEFAULT_OPTIONS,
) => {
  const {includeReactNative} = options;

  // We filter react-native package on purpose, so that no CI's script will be executed for this package in future
  // Unless includeReactNative options is provided
  const packagesDirectories = getDirectories(PACKAGES_LOCATION).filter(
    directoryName =>
      directoryName !== 'react-native' || includeReactNative === true,
  );

  packagesDirectories.forEach(packageDirectory => {
    const packageAbsolutePath = path.join(PACKAGES_LOCATION, packageDirectory);
    const packageRelativePathFromRoot = path.join('packages', packageDirectory);

    const packageManifest = JSON.parse(
      readFileSync(path.join(packageAbsolutePath, 'package.json')).toString(),
    );

    callback(packageAbsolutePath, packageRelativePathFromRoot, packageManifest);
  });
};

module.exports = forEachPackage;
