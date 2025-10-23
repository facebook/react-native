/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LinearGradient.h"

namespace facebook::react {

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic GradientDirection::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  result["type"] = [&]() {
    switch (type) {
      case GradientDirectionType::Angle:
        return "angle";
      case GradientDirectionType::Keyword:
        return "keyword";
    }
    return "";
  }();

  if (std::holds_alternative<Float>(value)) {
    result["value"] = std::get<Float>(value);
  } else if (std::holds_alternative<GradientKeyword>(value)) {
    result["value"] = [&]() {
      switch (std::get<GradientKeyword>(value)) {
        case GradientKeyword::ToTopRight:
          return "to top right";
        case GradientKeyword::ToBottomRight:
          return "to bottom right";
        case GradientKeyword::ToTopLeft:
          return "to top left";
        case GradientKeyword::ToBottomLeft:
          return "to bottom left";
      }
      return "";
    }();
  }
  return result;
}

folly::dynamic LinearGradient::toDynamic() const {
  folly::dynamic result = folly::dynamic::object();
  result["type"] = "linear-gradient";
  result["direction"] = direction.toDynamic();

  folly::dynamic colorStopsArray = folly::dynamic::array();
  for (const auto& colorStop : colorStops) {
    colorStopsArray.push_back(colorStop.toDynamic());
  }
  result["colorStops"] = colorStopsArray;
  return result;
}
#endif

#if RN_DEBUG_STRING_CONVERTIBLE
void LinearGradient::toString(std::stringstream& ss) const {
  ss << "linear-gradient(";

  if (direction.type == GradientDirectionType::Angle) {
    ss << std::get<Float>(direction.value) << "deg";
  } else {
    auto keyword = std::get<GradientKeyword>(direction.value);
    switch (keyword) {
      case GradientKeyword::ToTopRight:
        ss << "to top right";
        break;
      case GradientKeyword::ToBottomRight:
        ss << "to bottom right";
        break;
      case GradientKeyword::ToTopLeft:
        ss << "to top left";
        break;
      case GradientKeyword::ToBottomLeft:
        ss << "to bottom left";
        break;
    }
  }

  for (const auto& colorStop : colorStops) {
    ss << ", ";
    colorStop.toString(ss);
  }

  ss << ")";
}
#endif

}; // namespace facebook::react
