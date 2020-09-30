/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/LayoutPrimitives.h>
#include <react/graphics/Geometry.h>

namespace facebook {
namespace react {

/*
 * Describes results of layout process for particular shadow node.
 */
struct LayoutMetrics {
  Rect frame;
  EdgeInsets contentInsets{0};
  EdgeInsets borderWidth{0};
  DisplayType displayType{DisplayType::Flex};
  LayoutDirection layoutDirection{LayoutDirection::Undefined};
  Float pointScaleFactor{1.0};

  Rect getContentFrame() const {
    return Rect{
        Point{contentInsets.left, contentInsets.top},
        Size{frame.size.width - contentInsets.left - contentInsets.right,
             frame.size.height - contentInsets.top - contentInsets.bottom}};
  }

  bool operator==(const LayoutMetrics &rhs) const {
    return std::tie(
               this->frame,
               this->contentInsets,
               this->borderWidth,
               this->displayType,
               this->layoutDirection,
               this->pointScaleFactor) ==
        std::tie(
               rhs.frame,
               rhs.contentInsets,
               rhs.borderWidth,
               rhs.displayType,
               rhs.layoutDirection,
               rhs.pointScaleFactor);
  }

  bool operator!=(const LayoutMetrics &rhs) const {
    return !(*this == rhs);
  }
};

/*
 * Represents some undefined, not-yet-computed or meaningless value of
 * `LayoutMetrics` type.
 * The value is comparable by equality with any other `LayoutMetrics` value.
 * All individual sub-properties of `EmptyLayoutMetrics` have the most possible
 * "invalid" values; this is useful when we compare them with some valid values.
 */
static const LayoutMetrics EmptyLayoutMetrics = {
    /* .frame = */ {
        /* .origin = */ {std::numeric_limits<Float>::min(),
                         std::numeric_limits<Float>::min()},
        /* .size = */
        {std::numeric_limits<Float>::min(), std::numeric_limits<Float>::min()},
    },
    /* .contentInsets = */
    {std::numeric_limits<Float>::min(),
     std::numeric_limits<Float>::min(),
     std::numeric_limits<Float>::min(),
     std::numeric_limits<Float>::min()},
    /* .borderWidth = */
    {std::numeric_limits<Float>::min(),
     std::numeric_limits<Float>::min(),
     std::numeric_limits<Float>::min(),
     std::numeric_limits<Float>::min()},
    /* .displayType = */ (DisplayType)-1,
    /* .layoutDirection = */ (LayoutDirection)-1,
    /* .pointScaleFactor = */ std::numeric_limits<Float>::min()};

} // namespace react
} // namespace facebook
