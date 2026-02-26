/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const path = require('path');

module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '^react-native($|/.*)': `${path.dirname(require.resolve('react-native'))}/$1`,
  },
};
