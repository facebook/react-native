/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewProps.h"

#include <fabric/components/view/conversions.h>
#include <fabric/components/view/propsConversions.h>
#include <fabric/core/propsConversions.h>
#include <fabric/debug/debugStringConvertibleUtils.h>
#include <fabric/graphics/conversions.h>

namespace facebook {
namespace react {

ViewProps::ViewProps(const YGStyle &yogaStyle):
  YogaStylableProps(yogaStyle) {}

ViewProps::ViewProps(const ViewProps &sourceProps, const RawProps &rawProps):
  Props(sourceProps, rawProps),
  YogaStylableProps(sourceProps, rawProps),
  opacity(convertRawProp(rawProps, "opacity", sourceProps.opacity, (Float)1.0)),
  foregroundColor(convertRawProp(rawProps, "foregroundColor", sourceProps.foregroundColor)),
  backgroundColor(convertRawProp(rawProps, "backgroundColor", sourceProps.backgroundColor)),
  borderRadii(convertRawProp(rawProps, "border", "Radius", sourceProps.borderRadii)),
  borderColors(convertRawProp(rawProps, "border", "Color", sourceProps.borderColors)),
  borderStyles(convertRawProp(rawProps, "border", "Style", sourceProps.borderStyles)),
  shadowColor(convertRawProp(rawProps, "shadowColor", sourceProps.shadowColor)),
  shadowOffset(convertRawProp(rawProps, "shadowOffset", sourceProps.shadowOffset)),
  shadowOpacity(convertRawProp(rawProps, "shadowOpacity", sourceProps.shadowOpacity)),
  shadowRadius(convertRawProp(rawProps, "shadowRadius", sourceProps.shadowRadius)),
  transform(convertRawProp(rawProps, "transform", sourceProps.transform)),
  backfaceVisibility(convertRawProp(rawProps, "backfaceVisibility", sourceProps.backfaceVisibility)),
  shouldRasterize(convertRawProp(rawProps, "shouldRasterize", sourceProps.shouldRasterize)),
  zIndex(convertRawProp(rawProps, "zIndex", sourceProps.zIndex)),
  pointerEvents(convertRawProp(rawProps, "pointerEvents", sourceProps.pointerEvents)),
  hitSlop(convertRawProp(rawProps, "hitSlop", sourceProps.hitSlop)),
  onLayout(convertRawProp(rawProps, "onLayout", sourceProps.onLayout)) {};

#pragma mark - Convenience Methods

BorderMetrics ViewProps::resolveBorderMetrics(bool isRTL) const {
  auto borderWidths = CascadedBorderWidths {
    .left = optionalFloatFromYogaValue(yogaStyle.border[YGEdgeLeft]),
    .top = optionalFloatFromYogaValue(yogaStyle.border[YGEdgeTop]),
    .right = optionalFloatFromYogaValue(yogaStyle.border[YGEdgeRight]),
    .bottom = optionalFloatFromYogaValue(yogaStyle.border[YGEdgeBottom]),
    .start = optionalFloatFromYogaValue(yogaStyle.border[YGEdgeStart]),
    .end = optionalFloatFromYogaValue(yogaStyle.border[YGEdgeEnd]),
    .horizontal = optionalFloatFromYogaValue(yogaStyle.border[YGEdgeHorizontal]),
    .vertical = optionalFloatFromYogaValue(yogaStyle.border[YGEdgeVertical]),
    .all = optionalFloatFromYogaValue(yogaStyle.border[YGEdgeAll])
  };

  return {
    .borderColors = borderColors.resolve(isRTL, {}),
    .borderWidths = borderWidths.resolve(isRTL, 0),
    .borderRadii = borderRadii.resolve(isRTL, 0),
    .borderStyles = borderStyles.resolve(isRTL, BorderStyle::Solid)
  };
}

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList ViewProps::getDebugProps() const {
  const auto &defaultViewProps = ViewProps();

  return
    AccessibilityProps::getDebugProps() +
    YogaStylableProps::getDebugProps() +
    SharedDebugStringConvertibleList {
      debugStringConvertibleItem("zIndex", zIndex, defaultViewProps.zIndex),
      debugStringConvertibleItem("opacity", opacity, defaultViewProps.opacity),
      debugStringConvertibleItem("foregroundColor", foregroundColor, defaultViewProps.foregroundColor),
      debugStringConvertibleItem("backgroundColor", backgroundColor, defaultViewProps.backgroundColor),
    };
}

} // namespace react
} // namespace facebook
