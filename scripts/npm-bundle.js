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
 * A simple script to build a bundle with all dependencies that can be installed with `npm install` command
 * Useful for end to end testing when we need to test `react-native init` command
 */

/*eslint-disable no-undef */
require(`shelljs/global`);
let lodash = require(`lodash`);
let originalPackageJson = cat(`package.json`);
let packageJson = JSON.parse(cat(`package.json`));
let withDeps = process.argv.indexOf('--with-deps');

// in an ideal world npm CLI would work when PC is offline
// but it is not the case https://addyosmani.com/blog/using-npm-offline/
// even if we bundle all dependencies with react-native it will still go to npmjs repo to check for latest versions or something
// considering all that --with-deps is not a default option because it does not give us more speed (packing takes a few minutes) nor reliability if npmjs.org is down
if(withDeps) {
  // npm needs a list of all dependencies to bundle but our node_modules can be deduped to some level
  // so we need to ask npm to give us full lust of non dev dependencies
  let packagesToBundle = JSON.parse(exec(`npm ls --prod --json --silent`, {silent: true}).stdout);
  function getDependencies(packageTree) {
    if (!packageTree.dependencies) {
      return [];
    }
    return Object
      .keys(packageTree.dependencies)
      .concat(Object.keys(packageTree.dependencies)
        .map(key => getDependencies(packageTree.dependencies[key])))
  }
  let packagesToBundleFlat = lodash.uniq(lodash.flattenDeep(getDependencies(packagesToBundle)));
  console.log("Packages to be bundled", packagesToBundleFlat);
  packageJson.bundledDependencies = packagesToBundleFlat;
  JSON.stringify(packageJson, null, 4).to(`package.json`);
}

echo(`packing react-native`);
exec(`npm pack`);
// revert changes to package.json
originalPackageJson.to(`package.json`);

/*eslint-enable no-undef */
