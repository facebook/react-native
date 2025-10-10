/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RadialGradient.h"

namespace facebook::react {

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic RadialGradientSize::Dimensions::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  result["x"] = x.toDynamic();
  result["y"] = y.toDynamic();
  return result;
}

folly::dynamic RadialGradientSize::toDynamic() const {
  if (std::holds_alternative<SizeKeyword>(value)) {
    switch (std::get<SizeKeyword>(value)) {
      case SizeKeyword::ClosestSide:
        return "closest-side";
      case SizeKeyword::FarthestSide:
        return "farthest-side";
      case SizeKeyword::ClosestCorner:
        return "closest-corner";
      case SizeKeyword::FarthestCorner:
        return "farthest-corner";
    }
  } else if (std::holds_alternative<Dimensions>(value)) {
    return std::get<Dimensions>(value).toDynamic();
  }

  return nullptr;
}

folly::dynamic RadialGradientPosition::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  if (top.has_value()) {
    result["top"] = top.value().toDynamic();
  }
  if (left.has_value()) {
    result["left"] = left.value().toDynamic();
  }
  if (right.has_value()) {
    result["right"] = right.value().toDynamic();
  }
  if (bottom.has_value()) {
    result["bottom"] = bottom.value().toDynamic();
  }
  return result;
}

folly::dynamic RadialGradient::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  result["type"] = "radial-gradient";

  switch (shape) {
    case RadialGradientShape::Circle:
      result["shape"] = "circle";
      break;
    case RadialGradientShape::Ellipse:
      result["shape"] = "ellipse";
      break;
    default:
      break;
  }

  result["size"] = size.toDynamic();
  result["position"] = position.toDynamic();

  folly::dynamic colorStopsArray = folly::dynamic::array();
  for (const auto& colorStop : colorStops) {
    colorStopsArray.push_back(colorStop.toDynamic());
  }
  result["colorStops"] = colorStopsArray;

  return result;
}
#endif
}; // namespace facebook::react
