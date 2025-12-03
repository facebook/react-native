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
    'react-native/jest-preset is deprecated.\n' +
      'To continue using the React Native Jest preset, Install "@react-native/jest-preset" and optionally update Jest\'s "preset" configuration.',
  );
};

try {
  module.exports = require('@react-native/jest-preset');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    deprecated();
  } else {
    throw error;
  }
}
