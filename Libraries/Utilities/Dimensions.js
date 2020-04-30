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

import EventEmitter from '../vendor/emitter/EventEmitter';
import RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';
import NativeDeviceInfo, {
  type DisplayMetrics,
  type DimensionsPayload,
} from './NativeDeviceInfo';
import invariant from 'invariant';

type DimensionsValue = {
  window?: DisplayMetrics,
  screen?: DisplayMetrics,
  ...
};

const eventEmitter = new EventEmitter();
let dimensionsInitialized = false;
let dimensions: DimensionsValue;

class Dimensions {
  /**
   * NOTE: `useWindowDimensions` is the preffered API for React components.
   *
   * Initial dimensions are set before `runApplication` is called so they should
   * be available before any other require's are run, but may be updated later.
   *
   * Note: Although dimensions are available immediately, they may change (e.g
   * due to device rotation) so any rendering logic or styles that depend on
   * these constants should try to call this function on every render, rather
   * than caching the value (for example, using inline styles rather than
   * setting a value in a `StyleSheet`).
   *
   * Example: `const {height, width} = Dimensions.get('window');`
   *
   * @param {string} dim Name of dimension as defined when calling `set`.
   * @returns {Object?} Value for the dimension.
   */
  static get(dim: string): Object {
    invariant(dimensions[dim], 'No dimension set for key ' + dim);
    return dimensions[dim];
  }

  /**
   * This should only be called from native code by sending the
   * didUpdateDimensions event.
   *
   * @param {object} dims Simple string-keyed object of dimensions to set
   */
  static set(dims: $ReadOnly<{[key: string]: any, ...}>): void {
    // We calculate the window dimensions in JS so that we don't encounter loss of
    // precision in transferring the dimensions (which could be non-integers) over
    // the bridge.
    let {screen, window} = dims;
    const {windowPhysicalPixels} = dims;
    if (windowPhysicalPixels) {
      window = {
        width: windowPhysicalPixels.width / windowPhysicalPixels.scale,
        height: windowPhysicalPixels.height / windowPhysicalPixels.scale,
        scale: windowPhysicalPixels.scale,
        fontScale: windowPhysicalPixels.fontScale,
      };
    }
    const {screenPhysicalPixels} = dims;
    if (screenPhysicalPixels) {
      screen = {
        width: screenPhysicalPixels.width / screenPhysicalPixels.scale,
        height: screenPhysicalPixels.height / screenPhysicalPixels.scale,
        scale: screenPhysicalPixels.scale,
        fontScale: screenPhysicalPixels.fontScale,
      };
    } else if (screen == null) {
      screen = window;
    }

    dimensions = {window, screen};
    if (dimensionsInitialized) {
      // Don't fire 'change' the first time the dimensions are set.
      eventEmitter.emit('change', dimensions);
    } else {
      dimensionsInitialized = true;
    }
  }

  /**
   * Add an event handler. Supported events:
   *
   * - `change`: Fires when a property within the `Dimensions` object changes. The argument
   *   to the event handler is an object with `window` and `screen` properties whose values
   *   are the same as the return values of `Dimensions.get('window')` and
   *   `Dimensions.get('screen')`, respectively.
   */
  static addEventListener(type: 'change', handler: Function) {
    invariant(
      type === 'change',
      'Trying to subscribe to unknown event: "%s"',
      type,
    );
    eventEmitter.addListener(type, handler);
  }

  /**
   * Remove an event handler.
   */
  static removeEventListener(type: 'change', handler: Function) {
    invariant(
      type === 'change',
      'Trying to remove listener for unknown event: "%s"',
      type,
    );
    eventEmitter.removeListener(type, handler);
  }
}

let initialDims: ?$ReadOnly<{[key: string]: any, ...}> =
  global.nativeExtensions &&
  global.nativeExtensions.DeviceInfo &&
  global.nativeExtensions.DeviceInfo.Dimensions;
if (!initialDims) {
  // Subscribe before calling getConstants to make sure we don't miss any updates in between.
  RCTDeviceEventEmitter.addListener(
    'didUpdateDimensions',
    (update: DimensionsPayload) => {
      Dimensions.set(update);
    },
  );
  initialDims = NativeDeviceInfo.getConstants().Dimensions;
}

Dimensions.set(initialDims);

module.exports = Dimensions;
