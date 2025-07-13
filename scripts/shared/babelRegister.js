/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {
  PACKAGES_DIR,
  PRIVATE_DIR,
  RN_INTEGRATION_TESTS_RUNNER_DIR,
  SCRIPTS_DIR,
} = require('./consts');

let isRegisteredForMonorepo = false;

/**
 * Calling this function enables all Node.js packages to run from source when
 * developing in the React Native repo.
 *
 * A call should located in each entry point file in a package (i.e. for all
 * paths in "exports"), inside a special `if` condition that will be compiled
 * away on build.
 *
 * ```js
 * // Place in a package entry point
 * if (!process.env.BUILD_EXCLUDE_BABEL_REGISTER) {
 *   require('../../../scripts/shared/babelRegister').registerForMonorepo();
 * }
 * ```
 */
function registerForMonorepo() {
  if (isRegisteredForMonorepo) {
    return;
  }

  if (process.env.FBSOURCE_ENV === '1') {
    // $FlowExpectedError[cannot-resolve-module] - Won't resolve in OSS
    require('@fb-tools/babel-register');
  } else {
    // Temporarily allow the default export to be a function (Metro <= 0.82),
    // or contain a `register` function (Metro >= 0.83). Remove shim once Metro
    // is bumped in OSS.
    const metroBabelRegister = require('metro-babel-register') /*:: as $FlowFixMe */;
    const registerFunction =
      typeof metroBabelRegister.register === 'function'
        ? metroBabelRegister.register
        : metroBabelRegister;
    registerFunction([
      PACKAGES_DIR,
      PRIVATE_DIR,
      SCRIPTS_DIR,
      RN_INTEGRATION_TESTS_RUNNER_DIR,
    ]);
  }

  isRegisteredForMonorepo = true;
}

/**
 * Calling this function enables entry points under scripts/ to run from source.
 *
 * ```js
 * // Place in a script entry point
 * require('../shared/babelRegister').registerForScript();
 * ```
 */
function registerForScript() {
  registerForMonorepo();
}

module.exports = {
  registerForMonorepo,
  registerForScript,
};
