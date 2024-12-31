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

const {PACKAGES_DIR, RN_INTEGRATION_TESTS_RUNNER_DIR} = require('../consts');

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

  if (process.env.FBSOURCE_ENV === '1') {
    // $FlowExpectedError[cannot-resolve-module] - Won't resolve in OSS
    require('@fb-tools/babel-register');
  } else {
    require('metro-babel-register')([
      PACKAGES_DIR,
      RN_INTEGRATION_TESTS_RUNNER_DIR,
    ]);
  }

  isRegisteredForMonorepo = true;
}

module.exports = {registerForMonorepo};
