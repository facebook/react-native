/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const ReactNativeStyleAttributes = require('./ReactNativeStyleAttributes');

const UIView = {
  pointerEvents: true,
  accessible: true,
  accessibilityActions: true,
  accessibilityLabel: true,
  accessibilityLiveRegion: true,
  accessibilityRole: true,
  accessibilityStates: true,
  accessibilityState: true,
  accessibilityHint: true,
  acceptsKeyboardFocus: true, // TODO(macOS ISS#2323203)
  enableFocusRing: true, // TODO(macOS ISS#2323203)
  importantForAccessibility: true,
  nativeID: true,
  testID: true,
  tabIndex: true, // TODO(win ISS#2323203)
  renderToHardwareTextureAndroid: true,
  shouldRasterizeIOS: true,
  onLayout: true,
  onAccessibilityAction: true,
  onAccessibilityTap: true,
  onMagicTap: true,
  onAccessibilityEscape: true,
  collapsable: true,
  needsOffscreenAlphaCompositing: true,
  onMouseEnter: true, // [TODO(macOS ISS#2323203)
  onMouseLeave: true,
  onDragEnter: true,
  onDragLeave: true,
  onDrop: true,
  draggedTypes: true, // ]TODO(macOS ISS#2323203)
  style: ReactNativeStyleAttributes,
};

const RCTView = {
  ...UIView,

  // This is a special performance property exposed by RCTView and useful for
  // scrolling content when there are many subviews, most of which are offscreen.
  // For this property to be effective, it must be applied to a view that contains
  // many subviews that extend outside its bound. The subviews must also have
  // overflow: hidden, as should the containing view (or one of its superviews).
  removeClippedSubviews: true,
};

const ReactNativeViewAttributes = {
  UIView: UIView,
  RCTView: RCTView,
};

module.exports = ReactNativeViewAttributes;
