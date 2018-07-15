/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewProps.h"

#include <fabric/components/view/conversions.h>
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
  borderWidth(convertRawProp(rawProps, "borderWidth", sourceProps.borderWidth)),
  borderRadius(convertRawProp(rawProps, "borderRadius", sourceProps.borderRadius)),
  borderColor(convertRawProp(rawProps, "borderColor", sourceProps.borderColor)),
  borderStyle(convertRawProp(rawProps, "borderStyle", sourceProps.borderStyle)),
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
