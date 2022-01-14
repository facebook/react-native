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
import ReactNativeStyleAttributes from './ReactNativeStyleAttributes';

const UIView = {
  pointerEvents: true,
  accessible: true,
  accessibilityActions: true,
  accessibilityLabel: true,
  accessibilityLiveRegion: true,
  accessibilityRole: true,
  accessibilityState: true,
  accessibilityValue: true,
  accessibilityHint: true,
  acceptsFirstMouse: true, // TODO(macOS GH#774)
  acceptsKeyboardFocus: true, // TODO(macOS GH#774)
  enableFocusRing: true, // TODO(macOS GH#774)
  importantForAccessibility: true,
  nativeID: true,
  testID: true,
  renderToHardwareTextureAndroid: true,
  shouldRasterizeIOS: true,
  onLayout: true,
  onAccessibilityAction: true,
  onAccessibilityTap: true,
  onMagicTap: true,
  onAccessibilityEscape: true,
  collapsable: true,
  needsOffscreenAlphaCompositing: true,
  onMouseEnter: true, // [TODO(macOS GH#774)
  onMouseLeave: true,
  onDragEnter: true,
  onDragLeave: true,
  onDrop: true,
  onKeyDown: true,
  onKeyUp: true,
  validKeysDown: true,
  validKeysUp: true,
  draggedTypes: true, // ]TODO(macOS GH#774)
  nextKeyViewTag: true, // TODO(macOS GH#768)
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
