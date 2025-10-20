/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RadialGradient.h"

#if RN_DEBUG_STRING_CONVERTIBLE
#include <react/renderer/debug/DebugStringConvertible.h>
#endif

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

#if RN_DEBUG_STRING_CONVERTIBLE
void RadialGradient::toString(std::stringstream& ss) const {
  ss << "radial-gradient("
     << (shape == RadialGradientShape::Circle ? "circle" : "ellipse") << " ";

  if (std::holds_alternative<RadialGradientSize::SizeKeyword>(size.value)) {
    auto& keyword = std::get<RadialGradientSize::SizeKeyword>(size.value);
    switch (keyword) {
      case RadialGradientSize::SizeKeyword::ClosestSide:
        ss << "closest-side";
        break;
      case RadialGradientSize::SizeKeyword::FarthestSide:
        ss << "farthest-side";
        break;
      case RadialGradientSize::SizeKeyword::ClosestCorner:
        ss << "closest-corner";
        break;
      case RadialGradientSize::SizeKeyword::FarthestCorner:
        ss << "farthest-corner";
        break;
    }
  } else {
    auto& dimensions = std::get<RadialGradientSize::Dimensions>(size.value);
    ss << react::toString(dimensions.x) << " " << react::toString(dimensions.y);
  }

  ss << " at ";

  if (position.left.has_value()) {
    ss << position.left->toString() << " ";
  }
  if (position.top.has_value()) {
    ss << position.top->toString() << " ";
  }
  if (position.right.has_value()) {
    ss << position.right->toString() << " ";
  }
  if (position.bottom.has_value()) {
    ss << position.bottom->toString() << " ";
  }

  for (const auto& colorStop : colorStops) {
    ss << ", ";
    colorStop.toString(ss);
  }

  ss << ")";
}
#endif

}; // namespace facebook::react
