/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

module.exports = () /*: Array<string> */ => [
  require.resolve('./console.js'),
  require.resolve('./error-guard.js'),
];
