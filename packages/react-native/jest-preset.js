/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

const deprecated = () => {
  throw new Error(
    'react-native/jest-preset is deprecated, please use @react-native/jest-preset instead',
  );
};

try {
  module.exports = require('@react-native/jest-preset');
} catch {
  deprecated();
}
