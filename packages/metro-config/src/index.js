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

/*::
export type * from './index.flow';
*/

if (!process.env.BUILD_EXCLUDE_BABEL_REGISTER) {
  require('../../../scripts/build/babel-register').registerForMonorepo();
}

module.exports = require('./index.flow');
