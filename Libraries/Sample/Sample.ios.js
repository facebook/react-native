/**
 * @format
 * @flow
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
