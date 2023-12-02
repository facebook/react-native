/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/LayoutPrimitives.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/debug/flags.h>
#include <react/renderer/graphics/Rect.h>
#include <react/renderer/graphics/RectangleEdges.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

/*
 * Describes results of layout process for particular shadow node.
 */
struct LayoutMetrics {
  // Origin: relative to the outer border of its parent.
  // Size: includes border, padding and content.
  Rect frame;
  // Width of the border + padding in each direction.
  EdgeInsets contentInsets{0};
  // Width of the border in each direction.
  EdgeInsets borderWidth{0};
  // See `DisplayType` for all possible options.
  DisplayType displayType{DisplayType::Flex};
  // See `LayoutDirection` for all possible options.
  LayoutDirection layoutDirection{LayoutDirection::Undefined};
  // Whether React Native treated cardinal directions as flow-relative
  // directions due to being laid out in RTL with `doLeftAndRightSwapInRTL`
  // enabled.
  bool wasLeftAndRightSwapped{false};
  // Pixel density. Number of device pixels per density-independent pixel.
  Float pointScaleFactor{1.0};
  // How much the children of the node actually overflow in each direction.
  // Positive values indicate that children are overflowing outside of the node.
  // Negative values indicate that children are clipped inside the node
  // (like when using `overflow: clip` on Web).
  EdgeInsets overflowInset{};

  // Origin: the outer border of the node.
  // Size: includes content only.
  Rect getContentFrame() const {
    return Rect{
        Point{contentInsets.left, contentInsets.top},
        Size{
            frame.size.width - contentInsets.left - contentInsets.right,
            frame.size.height - contentInsets.top - contentInsets.bottom}};
  }

  // Origin: the outer border of the node.
  // Size: includes content and padding (but no borders).
  Rect getPaddingFrame() const {
    return Rect{
        Point{borderWidth.left, borderWidth.top},
        Size{
            frame.size.width - borderWidth.left - borderWidth.right,
            frame.size.height - borderWidth.top - borderWidth.bottom}};
  }

  bool operator==(const LayoutMetrics& rhs) const {
    return std::tie(
               this->frame,
               this->contentInsets,
               this->borderWidth,
               this->displayType,
               this->layoutDirection,
               this->pointScaleFactor,
               this->overflowInset) ==
        std::tie(
               rhs.frame,
               rhs.contentInsets,
               rhs.borderWidth,
               rhs.displayType,
               rhs.layoutDirection,
               rhs.pointScaleFactor,
               rhs.overflowInset);
  }

  bool operator!=(const LayoutMetrics& rhs) const {
    return !(*this == rhs);
  }
};

/*
 * Represents some undefined, not-yet-computed or meaningless value of
 * `LayoutMetrics` type.
 * The value is comparable by equality with any other `LayoutMetrics` value.
 */
static const LayoutMetrics EmptyLayoutMetrics = {
    /* .frame = */ {{0, 0}, {-1.0, -1.0}}};

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const LayoutMetrics& object);
std::vector<DebugStringConvertibleObject> getDebugProps(
    const LayoutMetrics& object,
    DebugStringConvertibleOptions options);

#endif

} // namespace facebook::react

namespace std {

template <>
struct hash<facebook::react::LayoutMetrics> {
  size_t operator()(const facebook::react::LayoutMetrics& layoutMetrics) const {
    return facebook::react::hash_combine(
        layoutMetrics.frame,
        layoutMetrics.contentInsets,
        layoutMetrics.borderWidth,
        layoutMetrics.displayType,
        layoutMetrics.layoutDirection,
        layoutMetrics.pointScaleFactor,
        layoutMetrics.overflowInset);
  }
};

} // namespace std
