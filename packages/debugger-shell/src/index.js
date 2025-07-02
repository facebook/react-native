/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// As far as Flow is concerned, this package is Node-only.
/*::
export type * from './node';
const Node = require('./node');
declare module.exports: typeof Node;
*/

// Because Electron doesn't support package.json `exports`, we need to
// switch at runtime.
if ('electron' in process.versions) {
  // $FlowIgnore[invalid-export]
  module.exports = require('./electron');
} else {
  // $FlowIgnore[invalid-export]
  module.exports = require('./node');
}
