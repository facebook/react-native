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

var DeviceInfo = require('DeviceInfo');
var EventEmitter = require('EventEmitter');
var Platform = require('Platform');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

var invariant = require('fbjs/lib/invariant');

var eventEmitter = new EventEmitter();
var dimensionsInitialized = false;
var dimensions = {};
class Dimensions {
  /**
   * This should only be called from native code by sending the
   * didUpdateDimensions event.
   *
   * @param {object} dims Simple string-keyed object of dimensions to set
   */
  static set(dims: {[key:string]: any}): void {
    // We calculate the window dimensions in JS so that we don't encounter loss of
    // precision in transferring the dimensions (which could be non-integers) over
    // the bridge.
    if (dims && dims.windowPhysicalPixels) {
      // parse/stringify => Clone hack
      dims = JSON.parse(JSON.stringify(dims));

      var windowPhysicalPixels = dims.windowPhysicalPixels;
      dims.window = {
        width: windowPhysicalPixels.width / windowPhysicalPixels.scale,
        height: windowPhysicalPixels.height / windowPhysicalPixels.scale,
        scale: windowPhysicalPixels.scale,
        fontScale: windowPhysicalPixels.fontScale,
      };
      if (Platform.OS === 'android') {
        // Screen and window dimensions are different on android
        var screenPhysicalPixels = dims.screenPhysicalPixels;
        dims.screen = {
          width: screenPhysicalPixels.width / screenPhysicalPixels.scale,
          height: screenPhysicalPixels.height / screenPhysicalPixels.scale,
          scale: screenPhysicalPixels.scale,
          fontScale: screenPhysicalPixels.fontScale,
        };

        // delete so no callers rely on this existing
        delete dims.screenPhysicalPixels;
      } else {
        dims.screen = dims.window;
      }
      // delete so no callers rely on this existing
      delete dims.windowPhysicalPixels;
    }

    Object.assign(dimensions, dims);
    if (dimensionsInitialized) {
      // Don't fire 'change' the first time the dimensions are set.
      eventEmitter.emit('change', {
        window: dimensions.window,
        screen: dimensions.screen
      });
    } else {
      dimensionsInitialized = true;
    }
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
   * Example: `var {height, width} = Dimensions.get('window');`
   *
   * @param {string} dim Name of dimension as defined when calling `set`.
   * @returns {Object?} Value for the dimension.
   */
  static get(dim: string): Object {
    invariant(dimensions[dim], 'No dimension set for key ' + dim);
    return dimensions[dim];
  }

  /**
   * Add an event handler. Supported events:
   *
   * - `change`: Fires when a property within the `Dimensions` object changes. The argument
   *   to the event handler is an object with `window` and `screen` properties whose values
   *   are the same as the return values of `Dimensions.get('window')` and
   *   `Dimensions.get('screen')`, respectively.
   */
  static addEventListener(
    type: string,
    handler: Function
  ) {
    invariant(
      type === 'change',
      'Trying to subscribe to unknown event: "%s"', type
    );
    eventEmitter.addListener(type, handler);
  }

  /**
   * Remove an event handler.
   */
  static removeEventListener(
    type: string,
    handler: Function
  ) {
    invariant(
      type === 'change',
      'Trying to remove listener for unknown event: "%s"', type
    );
    eventEmitter.removeListener(type, handler);
  }
}

Dimensions.set(DeviceInfo.Dimensions);
RCTDeviceEventEmitter.addListener('didUpdateDimensions', function(update) {
  Dimensions.set(update);
});

module.exports = Dimensions;
