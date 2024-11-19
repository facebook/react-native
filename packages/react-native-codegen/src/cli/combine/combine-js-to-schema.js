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
export type * from './combine-js-to-schema.flow';
*/

if (!process.env.BUILD_EXCLUDE_BABEL_REGISTER && !process.env.BUCK_BUILD_ID) {
  require('../../../../../scripts/build/babel-register').registerForMonorepo();
}

module.exports = require('./combine-js-to-schema.flow');
