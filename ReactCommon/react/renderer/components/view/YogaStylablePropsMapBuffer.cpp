/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef ANDROID

#include "ViewProps.h"
#include "ViewPropsMapBuffer.h"

#include "viewPropConversions.h"

#include <react/renderer/mapbuffer/MapBufferBuilder.h>

namespace facebook {
namespace react {

MapBuffer convertBorderWidths(YGStyle::Edges const &border) {
  MapBufferBuilder builder(7);
  putOptionalFloat(
      builder, EDGE_TOP, optionalFloatFromYogaValue(border[YGEdgeTop]));
  putOptionalFloat(
      builder, EDGE_RIGHT, optionalFloatFromYogaValue(border[YGEdgeRight]));
  putOptionalFloat(
      builder, EDGE_BOTTOM, optionalFloatFromYogaValue(border[YGEdgeBottom]));
  putOptionalFloat(
      builder, EDGE_LEFT, optionalFloatFromYogaValue(border[YGEdgeLeft]));
  putOptionalFloat(
      builder, EDGE_START, optionalFloatFromYogaValue(border[YGEdgeStart]));
  putOptionalFloat(
      builder, EDGE_END, optionalFloatFromYogaValue(border[YGEdgeEnd]));
  putOptionalFloat(
      builder, EDGE_ALL, optionalFloatFromYogaValue(border[YGEdgeAll]));
  return builder.build();
}

// TODO: Currently unsupported: nextFocusForward/Left/Up/Right/Down
void YogaStylableProps::propsDiffMapBuffer(
    Props const *oldPropsPtr,
    MapBufferBuilder &builder) const {
  // Call with default props if necessary
  if (oldPropsPtr == nullptr) {
    YogaStylableProps defaultProps{};
    propsDiffMapBuffer(&defaultProps, builder);
    return;
  }

  // Delegate to base classes
  Props::propsDiffMapBuffer(oldPropsPtr, builder);

  YogaStylableProps const &oldProps =
      *(static_cast<const YogaStylableProps *>(oldPropsPtr));
  YogaStylableProps const &newProps = *this;

  if (oldProps.yogaStyle != newProps.yogaStyle) {
    auto const &oldStyle = oldProps.yogaStyle;
    auto const &newStyle = newProps.yogaStyle;

    if (!(oldStyle.border() == newStyle.border())) {
      builder.putMapBuffer(
          YG_BORDER_WIDTH, convertBorderWidths(newStyle.border()));
    }

    if (oldStyle.overflow() != newStyle.overflow()) {
      int value;
      switch (newStyle.overflow()) {
        case YGOverflowVisible:
          value = 0;
          break;
        case YGOverflowHidden:
          value = 1;
          break;
        case YGOverflowScroll:
          value = 2;
          break;
      }
      builder.putInt(YG_OVERFLOW, value);
    }
  }
}

} // namespace react
} // namespace facebook

#endif
