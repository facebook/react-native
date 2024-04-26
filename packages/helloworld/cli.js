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

if (process.env.BUILD_EXCLUDE_BABEL_REGISTER == null) {
  // $FlowFixMe[cannot-resolve-module]
  require('../../scripts/build/babel-register').registerForMonorepo();
}

require('./cli.flow.js');
