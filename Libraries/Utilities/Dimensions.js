/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule Dimensions
 */
'use strict';

var NativeModules = require('NativeModules');

var invariant = require('invariant');
var mergeInto = require('mergeInto');

var dimensions = NativeModules.RKUIManager.Dimensions;

class Dimensions {
  /**
   * This should only be called from native code.
   *
   * @param {object} dims Simple string-keyed object of dimensions to set
   */
  static set(dims) {
    mergeInto(dimensions, dims);
    return true;
  }

  /**
   * Initial dimensions are set before `runApplication` is called so they should
   * be available before any other require's are run, but may be updated later.
   *
   * Note: Although dimensions are available immediately, they may change (e.g
   * due to device rotation) so any rendering logic or styles that depend on
   * these constants should try to call this function on every render, rather
   * than caching the value (for example, using inline styles rather than
   * setting a value in a `StyleSheet`).
   *
   * @param {string} dim Name of dimension as defined when calling `set`.
   * @returns {Object?} Value for the dimension.
   */
  static get(dim) {
    invariant(dimensions[dim], 'No dimension set for key ' + dim);
    return dimensions[dim];
  }
}

module.exports = Dimensions;
