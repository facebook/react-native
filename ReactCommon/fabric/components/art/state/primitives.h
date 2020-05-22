/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/graphics/Geometry.h>
#include <vector>
#include <functional>
#include <limits>

namespace facebook {
namespace react {

enum class ARTElement { Shape, Text, Group };

enum class ARTTextAlignment { Default, Right, Center };

struct ARTTextFrameFont {
  Float fontSize;
  std::string fontStyle;
  std::string fontFamily;
  std::string fontWeight;
};

struct ARTTextFrame {
  std::vector<std::string> lines;
  ARTTextFrameFont font;
};

} // namespace react
} // namespace facebook
