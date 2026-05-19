/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// A config which strips and transforms Flow features, to be received by either
// Flow/JS compatible Babel presets.

// IMPORTANT: We've given no public guarantee that we will preserve this
// transform. The app/frameworks requirement is still to apply all of
// @react-native/babel-preset.

import type {BabelCoreOptions} from '@babel/core';

const config: BabelCoreOptions = {
  sourceMaps: true,
  presets: [require.resolve('@babel/preset-flow')],
  plugins: [require.resolve('babel-plugin-syntax-hermes-parser')],
};

module.exports = config;
