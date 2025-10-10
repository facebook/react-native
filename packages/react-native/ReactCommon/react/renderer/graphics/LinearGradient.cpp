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
  switch (type) {
    case GradientDirectionType::Angle:
      result["type"] = "angle";
      break;
    case GradientDirectionType::Keyword:
      result["type"] = "keyword";
      break;
    default:
      break;
  }

  if (std::holds_alternative<Float>(value)) {
    result["value"] = std::get<Float>(value);
  } else if (std::holds_alternative<GradientKeyword>(value)) {
    switch (std::get<GradientKeyword>(value)) {
      case GradientKeyword::ToTopRight:
        result["value"] = "to top right";
        break;
      case GradientKeyword::ToBottomRight:
        result["value"] = "to bottom right";
        break;
      case GradientKeyword::ToTopLeft:
        result["value"] = "to top left";
        break;
      case GradientKeyword::ToBottomLeft:
        result["value"] = "to bottom left";
        break;
      default:
        break;
    }
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

}; // namespace facebook::react
