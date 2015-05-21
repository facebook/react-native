/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Viewport
 * @flow
 */
'use strict';

var NativeModules = require('NativeModules');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTDimensionManager = NativeModules.DimensionManager;
var invariant = require('invariant');

/**
 * Viewport gives access to the viewport's height and width.
 *
 * This could be used if someone wanted an image which stretched the width of
 * the device.
 *
 * Note: The values returned here are all ready in terms of the pixel ratio of
 * the device. For example, the iPhone 6 renders 750x1334 pixels. However, it has
 * a pixel ratio of two. Therefore the return values of these functions will
 * already be modified by the pixel ratio. In the iPhone 6's case this means
 * that the resolution that gets returned will be 375x667.
 */
var Viewport = {};

var _dimensionSubscriptions = {};

Viewport.events = {
  DEVICE_DIMENSIONS_EVENT: 'dimensionsDidChange'
};

Viewport.addEventListener = function(
  eventName: string,
  handler: Function
): void {
  invariant(eventName === Viewport.events.DEVICE_DIMENSIONS_EVENT,
    'No event by name ' + eventName);
  _dimensionSubscriptions[handler] = RCTDeviceEventEmitter.addListener(
    Viewport.events.DEVICE_DIMENSIONS_EVENT,
    handler
  );
};

Viewport.removeEventListener = function(
  eventName: string,
  handler: Function
): void {
  if (!_dimensionSubscriptions[handler]) {
    return;
  }
  _dimensionSubscriptions[handler].remove();
  _dimensionSubscriptions[handler] = null;
};

Viewport.getDimensions = function(
  handler: Function
) {
  RCTDimensionManager.getCurrentDimensions(handler);
}

module.exports = Viewport;
