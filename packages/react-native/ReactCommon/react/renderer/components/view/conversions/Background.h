/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_expect.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/view/conversions/Transform.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/graphics/BackgroundImage.h>
#include <react/renderer/graphics/BackgroundPosition.h>
#include <react/renderer/graphics/BackgroundRepeat.h>
#include <react/renderer/graphics/BackgroundSize.h>
#include <react/renderer/graphics/ValueUnit.h>
#include <string>
#include <unordered_map>
#include <vector>

namespace facebook::react {

inline void
fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, std::vector<BackgroundSize> &result)
{
  react_native_expect(value.hasType<std::vector<RawValue>>());
  if (!value.hasType<std::vector<RawValue>>()) {
    result = {};
    return;
  }

  std::vector<BackgroundSize> backgroundSizes{};
  auto rawBackgroundSizes = static_cast<std::vector<RawValue>>(value);

  for (const auto &rawBackgroundSizeValue : rawBackgroundSizes) {
    if (rawBackgroundSizeValue.hasType<std::string>()) {
      auto sizeStr = (std::string)rawBackgroundSizeValue;
      if (sizeStr == "cover") {
        backgroundSizes.emplace_back(BackgroundSizeKeyword::Cover);
      } else if (sizeStr == "contain") {
        backgroundSizes.emplace_back(BackgroundSizeKeyword::Contain);
      }
    } else if (rawBackgroundSizeValue.hasType<std::unordered_map<std::string, RawValue>>()) {
      auto sizeMap = static_cast<std::unordered_map<std::string, RawValue>>(rawBackgroundSizeValue);

      BackgroundSizeLengthPercentage sizeLengthPercentage;

      auto xIt = sizeMap.find("x");
      if (xIt != sizeMap.end()) {
        if (xIt->second.hasType<std::string>() && (std::string)(xIt->second) == "auto") {
          sizeLengthPercentage.x = std::monostate{};
        } else {
          auto valueUnit = toValueUnit(xIt->second);
          if (valueUnit) {
            sizeLengthPercentage.x = valueUnit;
          }
        }
      }

      auto yIt = sizeMap.find("y");
      if (yIt != sizeMap.end()) {
        if (yIt->second.hasType<std::string>() && (std::string)(yIt->second) == "auto") {
          sizeLengthPercentage.y = std::monostate{};
        } else {
          auto valueUnit = toValueUnit(yIt->second);
          if (valueUnit) {
            sizeLengthPercentage.y = valueUnit;
          }
        }
      }

      backgroundSizes.emplace_back(sizeLengthPercentage);
    }
  }

  result = backgroundSizes;
}

inline void
fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, std::vector<BackgroundPosition> &result)
{
  react_native_expect(value.hasType<std::vector<RawValue>>());
  if (!value.hasType<std::vector<RawValue>>()) {
    result = {};
    return;
  }

  std::vector<BackgroundPosition> backgroundPositions{};
  auto rawBackgroundPositions = static_cast<std::vector<RawValue>>(value);

  for (const auto &rawBackgroundPositionValue : rawBackgroundPositions) {
    if (rawBackgroundPositionValue.hasType<std::unordered_map<std::string, RawValue>>()) {
      auto positionMap = static_cast<std::unordered_map<std::string, RawValue>>(rawBackgroundPositionValue);

      BackgroundPosition backgroundPosition;

      auto topIt = positionMap.find("top");
      if (topIt != positionMap.end()) {
        auto valueUnit = toValueUnit(topIt->second);
        if (valueUnit) {
          backgroundPosition.top = valueUnit;
        }
      }

      auto bottomIt = positionMap.find("bottom");
      if (bottomIt != positionMap.end()) {
        auto valueUnit = toValueUnit(bottomIt->second);
        if (valueUnit) {
          backgroundPosition.bottom = valueUnit;
        }
      }

      auto leftIt = positionMap.find("left");
      if (leftIt != positionMap.end()) {
        auto valueUnit = toValueUnit(leftIt->second);
        if (valueUnit) {
          backgroundPosition.left = valueUnit;
        }
      }

      auto rightIt = positionMap.find("right");
      if (rightIt != positionMap.end()) {
        auto valueUnit = toValueUnit(rightIt->second);
        if (valueUnit) {
          backgroundPosition.right = valueUnit;
        }
      }

      backgroundPositions.emplace_back(backgroundPosition);
    }
  }

  result = backgroundPositions;
}

inline void
fromRawValue(const PropsParserContext & /*context*/, const RawValue &value, std::vector<BackgroundRepeat> &result)
{
  react_native_expect(value.hasType<std::vector<RawValue>>());
  if (!value.hasType<std::vector<RawValue>>()) {
    result = {};
    return;
  }

  std::vector<BackgroundRepeat> backgroundRepeats{};
  auto rawBackgroundRepeats = static_cast<std::vector<RawValue>>(value);

  for (const auto &rawBackgroundRepeatValue : rawBackgroundRepeats) {
    if (rawBackgroundRepeatValue.hasType<std::unordered_map<std::string, RawValue>>()) {
      auto repeatMap = static_cast<std::unordered_map<std::string, RawValue>>(rawBackgroundRepeatValue);

      BackgroundRepeat backgroundRepeat;

      auto xIt = repeatMap.find("x");
      if (xIt != repeatMap.end() && xIt->second.hasType<std::string>()) {
        auto xStr = (std::string)(xIt->second);
        if (xStr == "repeat") {
          backgroundRepeat.x = BackgroundRepeatStyle::Repeat;
        } else if (xStr == "space") {
          backgroundRepeat.x = BackgroundRepeatStyle::Space;
        } else if (xStr == "round") {
          backgroundRepeat.x = BackgroundRepeatStyle::Round;
        } else if (xStr == "no-repeat") {
          backgroundRepeat.x = BackgroundRepeatStyle::NoRepeat;
        }
      }

      auto yIt = repeatMap.find("y");
      if (yIt != repeatMap.end() && yIt->second.hasType<std::string>()) {
        auto yStr = (std::string)(yIt->second);
        if (yStr == "repeat") {
          backgroundRepeat.y = BackgroundRepeatStyle::Repeat;
        } else if (yStr == "space") {
          backgroundRepeat.y = BackgroundRepeatStyle::Space;
        } else if (yStr == "round") {
          backgroundRepeat.y = BackgroundRepeatStyle::Round;
        } else if (yStr == "no-repeat") {
          backgroundRepeat.y = BackgroundRepeatStyle::NoRepeat;
        }
      }

      backgroundRepeats.emplace_back(backgroundRepeat);
    }
  }

  result = backgroundRepeats;
}

void parseProcessedBackgroundImage(
    const PropsParserContext &context,
    const RawValue &value,
    std::vector<BackgroundImage> &result);

void parseUnprocessedBackgroundImageList(
    const PropsParserContext &context,
    const std::vector<RawValue> &value,
    std::vector<BackgroundImage> &result);

void parseUnprocessedBackgroundImageString(const std::string &value, std::vector<BackgroundImage> &result);

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, std::vector<BackgroundImage> &result)
{
  if (ReactNativeFeatureFlags::enableNativeCSSParsing()) {
    if (value.hasType<std::string>()) {
      parseUnprocessedBackgroundImageString((std::string)value, result);
    } else if (value.hasType<std::vector<RawValue>>()) {
      parseUnprocessedBackgroundImageList(context, (std::vector<RawValue>)value, result);
    } else {
      result = {};
    }
  } else {
    parseProcessedBackgroundImage(context, value, result);
  }
}

} // namespace facebook::react
