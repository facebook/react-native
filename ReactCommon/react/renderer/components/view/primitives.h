/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/optional.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Geometry.h>
#include <array>
#include <cmath>

namespace facebook {
namespace react {

enum class PointerEventsMode { Auto, None, BoxNone, BoxOnly };

enum class BackfaceVisibility { Auto, Visible, Hidden };

enum class BorderStyle { Solid, Dotted, Dashed };

template <typename T>
struct CascadedRectangleEdges {
  using Counterpart = RectangleEdges<T>;
  using OptionalT = better::optional<T>;

  OptionalT left{};
  OptionalT top{};
  OptionalT right{};
  OptionalT bottom{};
  OptionalT start{};
  OptionalT end{};
  OptionalT horizontal{};
  OptionalT vertical{};
  OptionalT all{};

  Counterpart resolve(bool isRTL, T defaults) const {
    const auto leading = isRTL ? end : start;
    const auto trailing = isRTL ? start : end;
    const auto horizontalOrAllOrDefault =
        horizontal.value_or(all.value_or(defaults));
    const auto verticalOrAllOrDefault =
        vertical.value_or(all.value_or(defaults));

    return {
        /* .left = */ left.value_or(leading.value_or(horizontalOrAllOrDefault)),
        /* .top = */ top.value_or(verticalOrAllOrDefault),
        /* .right = */
        right.value_or(trailing.value_or(horizontalOrAllOrDefault)),
        /* .bottom = */ bottom.value_or(verticalOrAllOrDefault),
    };
  }

  bool operator==(const CascadedRectangleEdges<T> &rhs) const {
    return std::tie(
               this->left,
               this->top,
               this->right,
               this->bottom,
               this->start,
               this->end,
               this->horizontal,
               this->vertical,
               this->all) ==
        std::tie(
               rhs.left,
               rhs.top,
               rhs.right,
               rhs.bottom,
               rhs.start,
               rhs.end,
               rhs.horizontal,
               rhs.vertical,
               rhs.all);
  }

  bool operator!=(const CascadedRectangleEdges<T> &rhs) const {
    return !(*this == rhs);
  }
};

template <typename T>
struct CascadedRectangleCorners {
  using Counterpart = RectangleCorners<T>;
  using OptionalT = better::optional<T>;

  OptionalT topLeft{};
  OptionalT topRight{};
  OptionalT bottomLeft{};
  OptionalT bottomRight{};
  OptionalT topStart{};
  OptionalT topEnd{};
  OptionalT bottomStart{};
  OptionalT bottomEnd{};
  OptionalT all{};

  Counterpart resolve(bool isRTL, T defaults) const {
    const auto topLeading = isRTL ? topEnd : topStart;
    const auto topTrailing = isRTL ? topStart : topEnd;
    const auto bottomLeading = isRTL ? bottomEnd : bottomStart;
    const auto bottomTrailing = isRTL ? bottomStart : bottomEnd;

    return {
        /* .topLeft = */ topLeft.value_or(
            topLeading.value_or(all.value_or(defaults))),
        /* .topRight = */
        topRight.value_or(topTrailing.value_or(all.value_or(defaults))),
        /* .bottomLeft = */
        bottomLeft.value_or(bottomLeading.value_or(all.value_or(defaults))),
        /* .bottomRight = */
        bottomRight.value_or(bottomTrailing.value_or(all.value_or(defaults))),
    };
  }

  bool operator==(const CascadedRectangleCorners<T> &rhs) const {
    return std::tie(
               this->topLeft,
               this->topRight,
               this->bottomLeft,
               this->bottomRight,
               this->topStart,
               this->topEnd,
               this->bottomStart,
               this->bottomEnd,
               this->all) ==
        std::tie(
               rhs.topLeft,
               rhs.topRight,
               rhs.bottomLeft,
               rhs.bottomRight,
               rhs.topStart,
               rhs.topEnd,
               rhs.bottomStart,
               rhs.bottomEnd,
               rhs.all);
  }

  bool operator!=(const CascadedRectangleCorners<T> &rhs) const {
    return !(*this == rhs);
  }
};

using BorderWidths = RectangleEdges<Float>;
using BorderStyles = RectangleEdges<BorderStyle>;
using BorderColors = RectangleEdges<SharedColor>;
using BorderRadii = RectangleCorners<Float>;

using CascadedBorderWidths = CascadedRectangleEdges<Float>;
using CascadedBorderStyles = CascadedRectangleEdges<BorderStyle>;
using CascadedBorderColors = CascadedRectangleEdges<SharedColor>;
using CascadedBorderRadii = CascadedRectangleCorners<Float>;

struct BorderMetrics {
  BorderColors borderColors{};
  BorderWidths borderWidths{};
  BorderRadii borderRadii{};
  BorderStyles borderStyles{};

  bool operator==(const BorderMetrics &rhs) const {
    return std::tie(
               this->borderColors,
               this->borderWidths,
               this->borderRadii,
               this->borderStyles) ==
        std::tie(
               rhs.borderColors,
               rhs.borderWidths,
               rhs.borderRadii,
               rhs.borderStyles);
  }

  bool operator!=(const BorderMetrics &rhs) const {
    return !(*this == rhs);
  }
};

} // namespace react
} // namespace facebook
