/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>

#include <react/renderer/graphics/ColorComponents.h>
#include <react/renderer/graphics/HostPlatformColor.h>

namespace facebook::react {

/*
 * On Android, a color can be represented as 32 bits integer, so there is no
 * need to instantiate complex color objects and then pass them as shared
 * pointers. Hense instead of using shared_ptr, we use a simple wrapper class
 * which provides a pointer-like interface. On other platforms, colors may be
 * represented by more complex objects that cannot be represented as 32-bits
 * integers, so we hide the implementation detail in HostPlatformColor.h.
 */
class SharedColor {
 public:
  static const Color UndefinedColor = HostPlatformColor::UndefinedColor;

  SharedColor() : color_(UndefinedColor) {}

  SharedColor(Color color) : color_(color) {}

  Color operator*() const {
    return color_;
  }

  bool operator==(const SharedColor& otherColor) const {
    return color_ == otherColor.color_;
  }

  bool operator!=(const SharedColor& otherColor) const {
    return color_ != otherColor.color_;
  }

  operator bool() const {
    return color_ != UndefinedColor;
  }

 private:
  Color color_;
};

bool isColorMeaningful(const SharedColor& color) noexcept;
SharedColor colorFromComponents(ColorComponents components);
ColorComponents colorComponentsFromColor(SharedColor color);

SharedColor clearColor();
SharedColor blackColor();
SharedColor whiteColor();

} // namespace facebook::react

template <>
struct std::hash<facebook::react::SharedColor> {
  size_t operator()(facebook::react::SharedColor color) const {
    return std::hash<decltype(*color)>{}(*color);
  }
};
