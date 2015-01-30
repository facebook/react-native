/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ReactIOSViewAttributes
 */

"use strict";

var merge = require('merge');

var ReactIOSViewAttributes = {};

ReactIOSViewAttributes.UIView = {
  pointerEvents: true,
  accessible: true,
  accessibilityLabel: true,
  testID: true,
};

ReactIOSViewAttributes.RKView = merge(
  ReactIOSViewAttributes.UIView, {

  // This is a special performance property exposed by RKView and useful for
  // scrolling content when there are many subviews, most of which are offscreen.
  // For this property to be effective, it must be applied to a view that contains
  // many subviews that extend outside its bound. The subviews must also have
  // overflow: hidden, as should the containing view (or one of its superviews).
  removeClippedSubviews: true
});

module.exports = ReactIOSViewAttributes;
