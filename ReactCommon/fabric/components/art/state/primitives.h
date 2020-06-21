/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/graphics/Geometry.h>
#include <functional>
#include <limits>
#include <vector>

namespace facebook {
namespace react {

enum class ARTElementType { Shape, Text, Group };

enum class ARTTextAlignment { Default, Right, Center };

struct ARTTextFrameFont {
  Float fontSize;
  std::string fontStyle;
  std::string fontFamily;
  std::string fontWeight;

  bool operator==(const ARTTextFrameFont &rhs) const {
    return std::tie(
               this->fontSize,
               this->fontStyle,
               this->fontFamily,
               this->fontWeight) ==
        std::tie(rhs.fontSize, rhs.fontStyle, rhs.fontFamily, rhs.fontWeight);
  }

  bool operator!=(const ARTTextFrameFont &rhs) const {
    return !(*this == rhs);
  }
};

struct ARTTextFrame {
  std::vector<std::string> lines;
  ARTTextFrameFont font;

  bool operator==(const ARTTextFrame &rhs) const {
    return std::tie(this->lines, this->font) == std::tie(rhs.lines, rhs.font);
  }

  bool operator!=(const ARTTextFrame &rhs) const {
    return !(*this == rhs);
  }
};

} // namespace react
} // namespace facebook
