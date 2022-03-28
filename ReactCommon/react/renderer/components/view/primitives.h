/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Geometry.h>

#include <array>
#include <bitset>
#include <cmath>
#include <optional>

namespace facebook {
namespace react {

enum class PointerEventsMode { Auto, None, BoxNone, BoxOnly };

struct ViewEvents {
  std::bitset<32> bits{};

  enum class Offset : std::size_t {
    // Pointer events
    PointerEnter = 0,
    PointerMove = 1,
    PointerLeave = 2,

    // PanResponder callbacks
    MoveShouldSetResponder = 3,
    MoveShouldSetResponderCapture = 4,
    StartShouldSetResponder = 5,
    StartShouldSetResponderCapture = 6,
    ResponderGrant = 7,
    ResponderReject = 8,
    ResponderStart = 9,
    ResponderEnd = 10,
    ResponderRelease = 11,
    ResponderMove = 12,
    ResponderTerminate = 13,
    ResponderTerminationRequest = 14,
    ShouldBlockNativeResponder = 15,

    // Touch events
    TouchStart = 16,
    TouchMove = 17,
    TouchEnd = 18,
    TouchCancel = 19,
  };

  constexpr bool operator[](const Offset offset) const {
    return bits[static_cast<std::size_t>(offset)];
  }

  std::bitset<32>::reference operator[](const Offset offset) {
    return bits[static_cast<std::size_t>(offset)];
  }
};

inline static bool operator==(ViewEvents const &lhs, ViewEvents const &rhs) {
  return lhs.bits == rhs.bits;
}

inline static bool operator!=(ViewEvents const &lhs, ViewEvents const &rhs) {
  return lhs.bits != rhs.bits;
}

enum class BackfaceVisibility { Auto, Visible, Hidden };

enum class BorderStyle { Solid, Dotted, Dashed };

template <typename T>
struct CascadedRectangleEdges {
  using Counterpart = RectangleEdges<T>;
  using OptionalT = std::optional<T>;

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
    const auto leadingEdge = isRTL ? end : start;
    const auto trailingEdge = isRTL ? start : end;
    const auto horizontalOrAllOrDefault =
        horizontal.value_or(all.value_or(defaults));
    const auto verticalOrAllOrDefault =
        vertical.value_or(all.value_or(defaults));

    return {
        /* .left = */
        left.value_or(leadingEdge.value_or(horizontalOrAllOrDefault)),
        /* .top = */ top.value_or(verticalOrAllOrDefault),
        /* .right = */
        right.value_or(trailingEdge.value_or(horizontalOrAllOrDefault)),
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
  using OptionalT = std::optional<T>;

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

#ifdef ANDROID

struct NativeDrawable {
  enum class Kind {
    Ripple,
    ThemeAttr,
  };

  struct Ripple {
    std::optional<int32_t> color{};
    bool borderless{false};
    std::optional<Float> rippleRadius{};

    bool operator==(const Ripple &rhs) const {
      return std::tie(this->color, this->borderless, this->rippleRadius) ==
          std::tie(rhs.color, rhs.borderless, rhs.rippleRadius);
    }
  };

  Kind kind;
  std::string themeAttr;
  Ripple ripple;

  bool operator==(const NativeDrawable &rhs) const {
    if (this->kind != rhs.kind)
      return false;
    switch (this->kind) {
      case Kind::ThemeAttr:
        return this->themeAttr == rhs.themeAttr;
      case Kind::Ripple:
        return this->ripple == rhs.ripple;
    }
  }

  bool operator!=(const NativeDrawable &rhs) const {
    return !(*this == rhs);
  }

  ~NativeDrawable() = default;
};

#endif

} // namespace react
} // namespace facebook
