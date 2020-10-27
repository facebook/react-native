/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextMeasureCache.h"

namespace facebook {
namespace react {

static Rect rectFromDynamic(folly::dynamic const &data) {
  Point origin;
  origin.x = data.getDefault("x", 0).getDouble();
  origin.y = data.getDefault("y", 0).getDouble();
  Size size;
  size.width = data.getDefault("width", 0).getDouble();
  size.height = data.getDefault("height", 0).getDouble();
  Rect frame;
  frame.origin = origin;
  frame.size = size;
  return frame;
}

LineMeasurement::LineMeasurement(
    std::string text,
    Rect frame,
    Float descender,
    Float capHeight,
    Float ascender,
    Float xHeight)
    : text(text),
      frame(frame),
      descender(descender),
      capHeight(capHeight),
      ascender(ascender) {}

LineMeasurement::LineMeasurement(folly::dynamic const &data)
    : text(data.getDefault("text", "").getString()),
      frame(rectFromDynamic(data)),
      descender(data.getDefault("descender", 0).getDouble()),
      capHeight(data.getDefault("capHeight", 0).getDouble()),
      ascender(data.getDefault("ascender", 0).getDouble()),
      xHeight(data.getDefault("xHeight", 0).getDouble()) {}

bool LineMeasurement::operator==(LineMeasurement const &rhs) const {
  return std::tie(
             this->text,
             this->frame,
             this->descender,
             this->capHeight,
             this->ascender,
             this->xHeight) ==
      std::tie(
             rhs.text,
             rhs.frame,
             rhs.descender,
             rhs.capHeight,
             rhs.ascender,
             rhs.xHeight);
}

} // namespace react
} // namespace facebook
