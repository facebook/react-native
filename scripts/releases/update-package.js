/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

const {HELLOWORLD_DIR, REACT_NATIVE_PACKAGE_DIR} = require('../consts');
const {applyPackageVersions} = require('../npm-utils');
const fs = require('fs');
const path = require('path');

function updateAllPackages(dependencyMap /*: Record<string, string> */) {
  updateHelloWorldPackage(dependencyMap);
  updateTemplatePackage(dependencyMap);
}

function updateTemplatePackage(dependencyMap /*: Record<string, string> */) {
  updatePackage(
    path.join(REACT_NATIVE_PACKAGE_DIR, 'package.json'),
    dependencyMap,
  );
}

function updateHelloWorldPackage(dependencyMap /*: Record<string, string> */) {
  updatePackage(path.join(HELLOWORLD_DIR, 'package.json'), dependencyMap);
}

/**
 * Updates the package.json with dependencies in `dependencyMap`.
 *
 * `dependencyMap` is a dict of package name to its version
 * ex. {"react-native": "0.23.0", "other-dep": "nightly"}
 */
function updatePackage(
  jsonPath /*: string*/,
  dependencyMap /*: Record<string, string> */,
) {
  const templatePackageJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const updatedPackageJson = applyPackageVersions(
    templatePackageJson,
    dependencyMap,
  );

  fs.writeFileSync(
    jsonPath,
    JSON.stringify(updatedPackageJson, null, 2) + '\n',
    'utf-8',
  );
}

if (require.main === module) {
  const dependencyMapStr = process.argv[2];
  if (!dependencyMapStr) {
    console.error(
      'Please provide a json string of package name and their version. Ex. \'{"packageName":"0.23.0"}\'',
    );
    process.exit(1);
  }

  const dependencyMap = JSON.parse(dependencyMapStr);
  updateAllPackages(dependencyMap);
}

module.exports = updateAllPackages;
