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

// A project Babel config that names the preset with no options - the shape of
// the app template. The preset then only learns about Metro's transform
// options through the Babel caller.
module.exports = {
  // Babel loads this config with a plain `require`, so the cast has to stay in
  // a Flow comment to keep the file valid at runtime.
  presets: [
    require.resolve('@react-native/babel-preset'),
  ] /*:: as ReadonlyArray<string> */,
};
