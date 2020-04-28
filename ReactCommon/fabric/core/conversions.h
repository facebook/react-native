/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/core/LayoutPrimitives.h>

namespace facebook {
namespace react {

inline std::string toString(const LayoutDirection &layoutDirection) {
  switch (layoutDirection) {
    case LayoutDirection::Undefined:
      return "undefined";
    case LayoutDirection::LeftToRight:
      return "ltr";
    case LayoutDirection::RightToLeft:
      return "rtl";
  }
}

inline int toInt(const LayoutDirection &layoutDirection) {
  switch (layoutDirection) {
    case LayoutDirection::Undefined:
      return 0;
    case LayoutDirection::LeftToRight:
      return 1;
    case LayoutDirection::RightToLeft:
      return 2;
  }
}

inline std::string toString(const DisplayType &displayType) {
  switch (displayType) {
    case DisplayType::None:
      return "none";
    case DisplayType::Flex:
      return "flex";
    case DisplayType::Inline:
      return "inline";
  }
}

inline Size yogaMeassureToSize(int64_t value) {
  static_assert(
      sizeof(value) == 8,
      "Expected measureResult to be 8 bytes, or two 32 bit ints");

  int32_t wBits = 0xFFFFFFFF & (value >> 32);
  int32_t hBits = 0xFFFFFFFF & value;

  float *measuredWidth = reinterpret_cast<float *>(&wBits);
  float *measuredHeight = reinterpret_cast<float *>(&hBits);

  return {*measuredWidth, *measuredHeight};
}

} // namespace react
} // namespace facebook
