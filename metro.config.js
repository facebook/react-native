/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const getPolyfills = require('./rn-get-polyfills');

/**
 * This cli config is needed for development purposes, e.g. for running
 * integration tests during local development or on CI services.
 */
module.exports = {
  resolver: {
    // $FlowFixMe[signature-verification-failure] Can't infer RegExp type.
    blockList: /buck-out/,
    extraNodeModules: {
      'react-native': __dirname,
    },
  },
  serializer: {
    getPolyfills,
  },
};
