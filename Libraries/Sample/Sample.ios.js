/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Stub of Sample for Android.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const NativeSample = require('NativeModules').Sample;

/**
 * High-level docs for the Sample iOS API can be written here.
 */

const Sample = {
  test: function() {
    NativeSample.test();
  },
};

module.exports = Sample;
