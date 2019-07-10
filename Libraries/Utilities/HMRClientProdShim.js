/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */
'use strict';

import type {HMRClientNativeInterface} from './HMRClient';

// This shim ensures DEV binary builds don't crash in JS
// when they're combined with a PROD JavaScript build.
const HMRClientProdShim: HMRClientNativeInterface = {
  setup() {},
  enable() {
    console.error(
      'Fast Refresh is disabled in JavaScript bundles built in production mode. ' +
        'Did you forget to run Metro?',
    );
  },
  disable() {},
};

module.exports = HMRClientProdShim;
