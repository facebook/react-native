/**
 * @providesModule Sample
 * @flow
 */
'use strict';

var NativeSample = require('NativeModules').Sample;
var invariant = require('invariant');

/**
 * High-level docs for the Sample iOS API can be written here.
 */

var Sample = {
  test: function() {
    NativeSample.test();
  }
};

module.exports = Sample;
