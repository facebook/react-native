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

// Compatibility module for tools which don't support the "exports" field:
// - Flow (type exports)
// - Metro (runtime exports)

/*::
export * from './src/registry.flow';
*/

try {
  // $FlowIgnore[cannot-resolve-module]
  // $FlowIgnore[invalid-export]
  // $FlowIgnore[module-type-conflict]
  module.exports = require('./dist/registry.flow');
} catch (e) {
  // $FlowIgnore[invalid-export]
  // $FlowIgnore[module-type-conflict]
  module.exports = require('./src/registry');
}
