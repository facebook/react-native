/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNativeViewAttributes
 * @flow
 */
'use strict';

var merge = require('merge');

var ReactNativeViewAttributes = {};

ReactNativeViewAttributes.UIView = {
  pointerEvents: true,
  accessible: true,
  accessibilityLabel: true,
  accessibilityTraits: true,
  testID: true,
  onLayout: true,
  onAccessibilityTap: true,
  onMagicTap: true,
  collapsible: true,

  // If any below are set, view should not be collapsible!
  onMoveShouldSetResponder: true,
  onResponderGrant: true,
  onResponderMove: true,
  onResponderReject: true,
  onResponderRelease: true,
  onResponderTerminate: true,
  onResponderTerminationRequest: true,
  onStartShouldSetResponder: true,
  onStartShouldSetResponderCapture: true,
};

ReactNativeViewAttributes.RCTView = merge(
  ReactNativeViewAttributes.UIView, {

  // This is a special performance property exposed by RCTView and useful for
  // scrolling content when there are many subviews, most of which are offscreen.
  // For this property to be effective, it must be applied to a view that contains
  // many subviews that extend outside its bound. The subviews must also have
  // overflow: hidden, as should the containing view (or one of its superviews).
  removeClippedSubviews: true,
});

module.exports = ReactNativeViewAttributes;
