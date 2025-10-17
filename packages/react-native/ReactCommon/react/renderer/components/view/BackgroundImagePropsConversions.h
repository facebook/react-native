/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/debug/flags.h>
#include <react/renderer/graphics/BackgroundImage.h>

#include <sstream>
#include <string>

namespace facebook::react {

void parseProcessedBackgroundImage(
    const PropsParserContext& context,
    const RawValue& value,
    std::vector<BackgroundImage>& result);

void parseUnprocessedBackgroundImageList(
    const PropsParserContext& context,
    const std::vector<RawValue>& value,
    std::vector<BackgroundImage>& result);

void parseUnprocessedBackgroundImageString(
    const std::string& value,
    std::vector<BackgroundImage>& result);

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    std::vector<BackgroundImage>& result) {
  if (ReactNativeFeatureFlags::enableNativeCSSParsing()) {
    if (value.hasType<std::string>()) {
      parseUnprocessedBackgroundImageString((std::string)value, result);
    } else if (value.hasType<std::vector<RawValue>>()) {
      parseUnprocessedBackgroundImageList(
          context, (std::vector<RawValue>)value, result);
    } else {
      result = {};
    }
  } else {
    parseProcessedBackgroundImage(context, value, result);
  }
}

#if RN_DEBUG_STRING_CONVERTIBLE
inline void toStringColorStop(
    std::stringstream& ss,
    const ColorStop& colorStop) {
  ss << toString(colorStop.color);
  if (colorStop.position.unit != UnitType::Undefined) {
    ss << " ";
    ss << toString(colorStop.position);
  }
}

inline void toStringLinearGradient(
    std::stringstream& ss,
    const LinearGradient& gradient) {
  ss << "linear-gradient(";

  if (gradient.direction.type == GradientDirectionType::Angle) {
    ss << std::get<Float>(gradient.direction.value) << "deg";
  } else {
    auto keyword = std::get<GradientKeyword>(gradient.direction.value);
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

  for (const auto& colorStop : gradient.colorStops) {
    ss << ", ";
    toStringColorStop(ss, colorStop);
  }

  ss << ")";
}

inline void toStringRadialGradient(
    std::stringstream& ss,
    const RadialGradient& gradient) {
  ss << "radial-gradient("
     << (gradient.shape == RadialGradientShape::Circle ? "circle" : "ellipse")
     << " ";

  if (std::holds_alternative<RadialGradientSize::SizeKeyword>(
          gradient.size.value)) {
    auto& keyword =
        std::get<RadialGradientSize::SizeKeyword>(gradient.size.value);
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
    auto& dimensions =
        std::get<RadialGradientSize::Dimensions>(gradient.size.value);
    ss << toString(dimensions.x) << " " << toString(dimensions.y);
  }

  ss << " at ";

  if (gradient.position.left.has_value()) {
    ss << toString(*gradient.position.left) << " ";
  }
  if (gradient.position.top.has_value()) {
    ss << toString(*gradient.position.top) << " ";
  }
  if (gradient.position.right.has_value()) {
    ss << toString(*gradient.position.right) << " ";
  }
  if (gradient.position.bottom.has_value()) {
    ss << toString(*gradient.position.bottom) << " ";
  }

  for (const auto& colorStop : gradient.colorStops) {
    ss << ", ";
    toStringColorStop(ss, colorStop);
  }

  ss << ")";
}

inline std::string toString(std::vector<BackgroundImage>& value) {
  std::stringstream ss;

  ss << "[";
  for (size_t i = 0; i < value.size(); i++) {
    if (i > 0) {
      ss << ", ";
    }

    if (std::holds_alternative<LinearGradient>(value[i])) {
      toStringLinearGradient(ss, std::get<LinearGradient>(value[i]));
    } else if (std::holds_alternative<RadialGradient>(value[i])) {
      toStringRadialGradient(ss, std::get<RadialGradient>(value[i]));
    }
  }
  ss << "]";

  return ss.str();
}
#endif

} // namespace facebook::react
