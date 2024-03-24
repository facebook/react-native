/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 * @oncall react_native
 */

/*::
export type * from './registry.flow';
*/

if (process.env.BUILD_EXCLUDE_BABEL_REGISTER !== true) {
  // $FlowIgnore[nonstrict-import]
  require('../../../scripts/build/babel-register').registerForMonorepo();
}

export * from './registry.flow';
