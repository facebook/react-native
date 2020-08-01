/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>

#include <react/renderer/graphics/ColorComponents.h>

namespace facebook {
namespace react {

using Color = int;

/*
 * On Android, a color can be represented as 32 bits integer, so there is no
 * need to instantiate complex color objects and then pass them as shared
 * pointers. Hense instead of using shared_ptr, we use a simple wrapper class
 * which provides a pointer-like interface.
 */
class SharedColor {
 public:
  static const Color UndefinedColor = std::numeric_limits<Color>::max();

  SharedColor() : color_(UndefinedColor) {}

  SharedColor(const SharedColor &sharedColor) : color_(sharedColor.color_) {}

  SharedColor(Color color) : color_(color) {}

  SharedColor &operator=(const SharedColor &sharedColor) {
    color_ = sharedColor.color_;
    return *this;
  }

  Color operator*() const {
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
  Color color_;
};

SharedColor colorFromComponents(ColorComponents components);
ColorComponents colorComponentsFromColor(SharedColor color);

SharedColor clearColor();
SharedColor blackColor();
SharedColor whiteColor();

} // namespace react
} // namespace facebook

namespace std {
template <>
struct hash<facebook::react::SharedColor> {
  size_t operator()(const facebook::react::SharedColor &sharedColor) const {
    return hash<decltype(*sharedColor)>{}(*sharedColor);
  }
};
} // namespace std
