/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewProps.h"

#include <algorithm>

#include <react/components/view/conversions.h>
#include <react/components/view/propsConversions.h>
#include <react/core/propsConversions.h>
#include <react/debug/debugStringConvertibleUtils.h>
#include <react/graphics/conversions.h>

namespace facebook {
namespace react {

ViewProps::ViewProps(ViewProps const &sourceProps, RawProps const &rawProps)
    : YogaStylableProps(sourceProps, rawProps),
      AccessibilityProps(sourceProps, rawProps),
      opacity(
          convertRawProp(rawProps, "opacity", sourceProps.opacity, (Float)1.0)),
      foregroundColor(convertRawProp(
          rawProps,
          "foregroundColor",
          sourceProps.foregroundColor,
          {})),
      backgroundColor(convertRawProp(
          rawProps,
          "backgroundColor",
          sourceProps.backgroundColor,
          {})),
      borderRadii(convertRawProp(
          rawProps,
          "border",
          "Radius",
          sourceProps.borderRadii,
          {})),
      borderColors(convertRawProp(
          rawProps,
          "border",
          "Color",
          sourceProps.borderColors,
          {})),
      borderStyles(convertRawProp(
          rawProps,
          "border",
          "Style",
          sourceProps.borderStyles,
          {})),
      shadowColor(
          convertRawProp(rawProps, "shadowColor", sourceProps.shadowColor, {})),
      shadowOffset(convertRawProp(
          rawProps,
          "shadowOffset",
          sourceProps.shadowOffset,
          {})),
      shadowOpacity(convertRawProp(
          rawProps,
          "shadowOpacity",
          sourceProps.shadowOpacity,
          {})),
      shadowRadius(convertRawProp(
          rawProps,
          "shadowRadius",
          sourceProps.shadowRadius,
          {})),
      transform(
          convertRawProp(rawProps, "transform", sourceProps.transform, {})),
      backfaceVisibility(convertRawProp(
          rawProps,
          "backfaceVisibility",
          sourceProps.backfaceVisibility,
          {})),
      shouldRasterize(convertRawProp(
          rawProps,
          "shouldRasterize",
          sourceProps.shouldRasterize,
          {})),
      zIndex(convertRawProp(rawProps, "zIndex", sourceProps.zIndex, {})),
      pointerEvents(convertRawProp(
          rawProps,
          "pointerEvents",
          sourceProps.pointerEvents,
          {})),
      hitSlop(convertRawProp(rawProps, "hitSlop", sourceProps.hitSlop, {})),
      onLayout(convertRawProp(rawProps, "onLayout", sourceProps.onLayout, {})),
      collapsable(convertRawProp(
          rawProps,
          "collapsable",
          sourceProps.collapsable,
          true)){};

#pragma mark - Convenience Methods

static BorderRadii ensureNoOverlap(BorderRadii const &radii, Size const &size) {
  // "Corner curves must not overlap: When the sum of any two adjacent border
  // radii exceeds the size of the border box, UAs must proportionally reduce
  // the used values of all border radii until none of them overlap."
  // Source: https://www.w3.org/TR/css-backgrounds-3/#corner-overlap

  auto insets = EdgeInsets{
      /* .left = */ radii.topLeft + radii.bottomLeft,
      /* .top = */ radii.topLeft + radii.topRight,
      /* .right = */ radii.topRight + radii.bottomRight,
      /* .bottom = */ radii.bottomLeft + radii.bottomRight,
  };

  auto insetsScale = EdgeInsets{
      /* .left = */
      insets.left > 0 ? std::min((Float)1.0, size.height / insets.left) : 0,
      /* .top = */
      insets.top > 0 ? std::min((Float)1.0, size.width / insets.top) : 0,
      /* .right = */
      insets.right > 0 ? std::min((Float)1.0, size.height / insets.right) : 0,
      /* .bottom = */
      insets.bottom > 0 ? std::min((Float)1.0, size.width / insets.bottom) : 0,
  };

  return BorderRadii{
      /* topLeft = */
      radii.topLeft * std::min(insetsScale.top, insetsScale.left),
      /* topRight = */
      radii.topRight * std::min(insetsScale.top, insetsScale.right),
      /* bottomLeft = */
      radii.bottomLeft * std::min(insetsScale.bottom, insetsScale.left),
      /* bottomRight = */
      radii.bottomRight * std::min(insetsScale.bottom, insetsScale.right),
  };
}

BorderMetrics ViewProps::resolveBorderMetrics(
    LayoutMetrics const &layoutMetrics) const {
  auto isRTL =
      bool{layoutMetrics.layoutDirection == LayoutDirection::RightToLeft};

  auto borderWidths = CascadedBorderWidths{
      /* .left = */ optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeLeft]),
      /* .top = */ optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeTop]),
      /* .right = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeRight]),
      /* .bottom = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeBottom]),
      /* .start = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeStart]),
      /* .end = */ optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeEnd]),
      /* .horizontal = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeHorizontal]),
      /* .vertical = */
      optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeVertical]),
      /* .all = */ optionalFloatFromYogaValue(yogaStyle.border()[YGEdgeAll]),
  };

  return {
      /* .borderColors = */ borderColors.resolve(isRTL, {}),
      /* .borderWidths = */ borderWidths.resolve(isRTL, 0),
      /* .borderRadii = */
      ensureNoOverlap(borderRadii.resolve(isRTL, 0), layoutMetrics.frame.size),
      /* .borderStyles = */ borderStyles.resolve(isRTL, BorderStyle::Solid),
  };
}

bool ViewProps::getClipsContentToBounds() const {
  return yogaStyle.overflow() != YGOverflowVisible;
}

#ifdef ANDROID
bool ViewProps::getProbablyMoreHorizontalThanVertical_DEPRECATED() const {
  return yogaStyle.flexDirection() == YGFlexDirectionRow;
}
#endif

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList ViewProps::getDebugProps() const {
  const auto &defaultViewProps = ViewProps();

  return AccessibilityProps::getDebugProps() +
      YogaStylableProps::getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem("zIndex", zIndex, defaultViewProps.zIndex),
          debugStringConvertibleItem(
              "opacity", opacity, defaultViewProps.opacity),
          debugStringConvertibleItem(
              "foregroundColor",
              foregroundColor,
              defaultViewProps.foregroundColor),
          debugStringConvertibleItem(
              "backgroundColor",
              backgroundColor,
              defaultViewProps.backgroundColor),
      };
}
#endif

} // namespace react
} // namespace facebook
