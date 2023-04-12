/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cmath>
#include <functional>
#include <limits>

#include <react/renderer/graphics/ColorComponents.h>

namespace facebook::react {

/*
 * Represent colors as a 32-bit integer, which is wrapped here to provide
 * a pointer-like interface, instead of passing it around as a shared pointer.
 */
class SharedColor {
  using ColorT = uint32_t;

 public:
  static constexpr ColorT UndefinedColor = std::numeric_limits<ColorT>::max();

  constexpr SharedColor() : color_(UndefinedColor) {}
  explicit constexpr SharedColor(ColorT color) : color_(color) {}

  ColorT operator*() const {
    return color_;
  }

  bool operator==(const SharedColor &otherColor) const {
    return color_ == otherColor.color_;
  }

  bool operator!=(const SharedColor &otherColor) const {
    return color_ != otherColor.color_;
  }

  operator bool() const {
    return color_ != UndefinedColor;
  }

 private:
  ColorT color_;
};

bool isColorMeaningful(SharedColor const &color) noexcept;

SharedColor colorFromComponents(ColorComponents components);
ColorComponents colorComponentsFromColor(SharedColor color);

constexpr SharedColor clearColor() {
  return SharedColor(0x00000000);
}
constexpr SharedColor blackColor() {
  return SharedColor(0xFF000000);
}
constexpr SharedColor whiteColor() {
  return SharedColor(0xFFFFFFFF);
}

} // namespace facebook::react

template <>
struct std::hash<facebook::react::SharedColor> {
  size_t operator()(facebook::react::SharedColor color) const {
    return std::hash<decltype(*color)>{}(*color);
  }
};
