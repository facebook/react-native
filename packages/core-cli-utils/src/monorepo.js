/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

// Should only used when called in the monorepo when we don't want to use the `yarn run build`
// step to transpile to project. When used as a vanilla npm package, it should be built and
// exported with `dist/index.flow.js` as main.
//
// The reason for this workaround is that flow-api-translator can't understand ESM and CJS style
// exports in the same file.  Throw in a bit of Flow in the mix and it all goes to hell.
//
// See packages/helloworld/cli.js for an example of how to swap this out in the monorepo.
if (process.env.BUILD_EXCLUDE_BABEL_REGISTER == null) {
  require('../../../scripts/build/babel-register').registerForMonorepo();
}

module.exports = require('./index.flow.js');
