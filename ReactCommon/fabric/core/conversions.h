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

} // namespace react
} // namespace facebook
