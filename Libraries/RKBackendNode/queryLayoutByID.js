/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule queryLayoutByID
 * @flow
 */
'use strict';

var ReactNativeTagHandles = require('ReactNativeTagHandles');
var RCTUIManager = require('NativeModules').UIManager;

type OnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number
) => void

// I don't know what type error is...
type OnErrorCallback = (error: any) => void

/**
 * Queries the layout of a view. The layout does not reflect the element as
 * seen by the user, rather it reflects the position within the layout system,
 * before any transforms are applied.
 *
 * The only other requirement is that the `pageX, pageY` values be in the same
 * coordinate system that events' `pageX/Y` are reported. That means that for
 * the web, `pageXOffset/pageYOffset` should be added to to
 * getBoundingClientRect to make consistent with touches.
 *
 *  var pageXOffset = window.pageXOffset;
 *  var pageYOffset = window.pageYOffset;
 *
 * This is an IOS specific implementation.
 *
 * @param {string} rootNodeID ID of the platform specific node to be measured.
 * @param {function} onError `func(error)`
 * @param {function} onSuccess `func(left, top, width, height, pageX, pageY)`
 */
var queryLayoutByID = function(
  rootNodeID: string,
  onError: OnErrorCallback,
  onSuccess: OnSuccessCallback
): void {
  // Native bridge doesn't *yet* surface errors.
  RCTUIManager.measure(
    ReactNativeTagHandles.rootNodeIDToTag[rootNodeID],
    onSuccess
  );
};

module.exports = queryLayoutByID;
