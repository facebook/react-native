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

const path = require('path');
const {PACKAGES_DIR} = require('./build');
const {buildConfig, getBabelConfig} = require('./config');

let isRegisteredForMonorepo = false;

/**
 * Calling this function enables all Node.js packages to run from source when
 * developing in the React Native repo.
 *
 * A call should located in each entry point file in a package (i.e. for all
 * paths in "exports"), inside a special `if` condition that will be compiled
 * away on build.
 *
 *   if (!process.env.BUILD_EXCLUDE_BABEL_REGISTER) {
 *     require('../../../scripts/build/babel-register').registerForMonorepo();
 *   }
 */
function registerForMonorepo() {
  if (isRegisteredForMonorepo) {
    return;
  }

  for (const [packageName, {target}] of Object.entries(buildConfig.packages)) {
    if (target === 'node') {
      registerPackage(packageName);
    }
  }

  isRegisteredForMonorepo = true;
}

function registerPackage(packageName /*: string */) {
  const packageDir = path.join(PACKAGES_DIR, packageName);

  // Prepare the config object before calling `require('@babel/register')` to
  // prevent `require` calls within `getBabelConfig` triggering Babel to
  // attempt to load its config from a babel.config file.
  const registerConfig = {
    ...getBabelConfig(packageName),
    root: packageDir,
    ignore: [/\/node_modules\//],
  };

  require('@babel/register')(registerConfig);
}

module.exports = {registerForMonorepo};
