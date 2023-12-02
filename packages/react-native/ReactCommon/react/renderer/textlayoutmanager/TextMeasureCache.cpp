/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextMeasureCache.h"

#include <utility>

namespace facebook::react {

static Rect rectFromDynamic(const folly::dynamic& data) {
  Point origin;
  origin.x = static_cast<Float>(data.getDefault("x", 0).getDouble());
  origin.y = static_cast<Float>(data.getDefault("y", 0).getDouble());
  Size size;
  size.width = static_cast<Float>(data.getDefault("width", 0).getDouble());
  size.height = static_cast<Float>(data.getDefault("height", 0).getDouble());
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
    : text(std::move(text)),
      frame(frame),
      descender(descender),
      capHeight(capHeight),
      ascender(ascender),
      xHeight(xHeight) {}

LineMeasurement::LineMeasurement(const folly::dynamic& data)
    : text(data.getDefault("text", "").getString()),
      frame(rectFromDynamic(data)),
      descender(
          static_cast<Float>(data.getDefault("descender", 0).getDouble())),
      capHeight(
          static_cast<Float>(data.getDefault("capHeight", 0).getDouble())),
      ascender(static_cast<Float>(data.getDefault("ascender", 0).getDouble())),
      xHeight(static_cast<Float>(data.getDefault("xHeight", 0).getDouble())) {}

bool LineMeasurement::operator==(const LineMeasurement& rhs) const {
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

} // namespace facebook::react
