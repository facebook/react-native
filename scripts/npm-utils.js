/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * `package` is an object form of package.json
 * `dependencies` is a map of dependency to version string
 *
 * This replaces both dependencies and devDependencies in package.json
 */
function applyPackageVersions(originalPackageJson, packageVersions) {
  const packageJson = {...originalPackageJson};

  for (const name of Object.keys(packageVersions)) {
    if (
      packageJson.dependencies != null &&
      packageJson.dependencies[name] != null
    ) {
      packageJson.dependencies[name] = packageVersions[name];
    }

    if (
      packageJson.devDependencies != null &&
      packageJson.devDependencies[name] != null
    ) {
      packageJson.devDependencies[name] = packageVersions[name];
    }
  }
  return packageJson;
}

module.exports = {
  applyPackageVersions,
};
