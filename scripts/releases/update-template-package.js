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

const {applyPackageVersions} = require('../npm-utils');
const fs = require('fs');
const path = require('path');

/**
 * Updates the react-native template package.json with
 * dependencies in `dependencyMap`.
 *
 * `dependencyMap` is a dict of package name to its version
 * ex. {"react-native": "0.23.0", "other-dep": "nightly"}
 */
function updateTemplatePackage(dependencyMap /*: Record<string, string> */) {
  const jsonPath = path.join(
    __dirname,
    '../../packages/react-native/template/package.json',
  );
  // $FlowFixMe[unsupported-syntax]
  const templatePackageJson = require(jsonPath);

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

  updateTemplatePackage(JSON.parse(dependencyMapStr));
}

module.exports = updateTemplatePackage;
