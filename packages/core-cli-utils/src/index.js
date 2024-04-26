/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const path = require('path');

/*::
export type * from './index.flow.js';
*/

if (!process.env.BUILD_EXCLUDE_BABEL_REGISTER) {
  // Handle internal cases when we call this from the monorepo, and external cases where users call it from a plain-old-node_modules
  let {root, dir} = path.parse(__dirname);
  while (dir !== root) {
    try {
      // $FlowFixMe[unsupported-syntax] we're doing magic here
      require(
        path.resolve(dir, 'scripts/build/babel-register'),
      ).registerForMonorepo();
      break;
    } catch {
      dir = path.resolve(dir, '..');
    }
  }
}

export * from './index.flow.js';
