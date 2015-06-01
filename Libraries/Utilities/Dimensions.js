/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dimensions
 * @flow
 */
'use strict';

var NativeModules = require('NativeModules');

var invariant = require('invariant');

var dimensions = NativeModules.UIManager.Dimensions;

// We calculate the window dimensions in JS so that we don't encounter loss of
// precision in transferring the dimensions (which could be non-integers) over
// the bridge.
if (dimensions && dimensions.windowPhysicalPixels) {
  // parse/stringify => Clone hack
  dimensions = JSON.parse(JSON.stringify(dimensions));

  var windowPhysicalPixels = dimensions.windowPhysicalPixels;
  dimensions.window = {
    width: windowPhysicalPixels.width / windowPhysicalPixels.scale,
    height: windowPhysicalPixels.height / windowPhysicalPixels.scale,
    scale: windowPhysicalPixels.scale,
    fontScale: windowPhysicalPixels.fontScale,
  };

  // delete so no callers rely on this existing
  delete dimensions.windowPhysicalPixels;
}

class Dimensions {
  /**
   * This should only be called from native code.
   *
   * @param {object} dims Simple string-keyed object of dimensions to set
   */
  static set(dims: {[key:string]: any}): bool {
    Object.assign(dimensions, dims);
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
  static get(dim: string): Object {
    invariant(dimensions[dim], 'No dimension set for key ' + dim);
    return dimensions[dim];
  }
}

module.exports = Dimensions;
