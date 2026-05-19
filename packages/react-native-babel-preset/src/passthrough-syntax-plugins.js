/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

// This list of syntax plugins is used for two purposes:
// 1. Enabling experimental syntax features in the INPUT to the Metro Babel
//    transformer, regardless of whether we actually transform them.
// 2. Enabling these same features in parser passes that consume the OUTPUT of
//    the Metro Babel transformer.
const passthroughSyntaxPlugins = [
  [require('@babel/plugin-syntax-nullish-coalescing-operator')],
  [require('@babel/plugin-syntax-optional-chaining')],
];

module.exports = passthroughSyntaxPlugins;
