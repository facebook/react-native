/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <react/debug/react_native_expect.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/graphics/BackgroundImage.h>
#include <react/renderer/components/view/CSSConversions.h>
#include <react/renderer/graphics/ColorStop.h>
#include <react/renderer/graphics/LinearGradient.h>
#include <react/renderer/graphics/RadialGradient.h>
#include <react/renderer/graphics/ValueUnit.h>
#include <react/renderer/css/CSSBackgroundImage.h>
#include <react/renderer/css/CSSLengthUnit.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/renderer/components/view/conversions.h>

#include <optional>
#include <string>
#include <unordered_map>

namespace facebook::react {
void parseProcessedBackgroundImage(
    const PropsParserContext& context,
    const RawValue& value,
    std::vector<BackgroundImage>& result) {
  react_native_expect(value.hasType<std::vector<RawValue>>());
  if (!value.hasType<std::vector<RawValue>>()) {
    result = {};
    return;
  }

  std::vector<BackgroundImage> backgroundImage{};
  auto rawBackgroundImage = static_cast<std::vector<RawValue>>(value);
  for (const auto& rawBackgroundImageValue : rawBackgroundImage) {
    bool isMap = rawBackgroundImageValue
                      .hasType<std::unordered_map<std::string, RawValue>>();
    react_native_expect(isMap);
    if (!isMap) {
      result = {};
      return;
    }

    auto rawBackgroundImageMap =
        static_cast<std::unordered_map<std::string, RawValue>>(
            rawBackgroundImageValue);

    auto typeIt = rawBackgroundImageMap.find("type");
    if (typeIt == rawBackgroundImageMap.end() ||
        !typeIt->second.hasType<std::string>()) {
      continue;
    }

    std::string type = (std::string)(typeIt->second);
    std::vector<ColorStop> colorStops;
    auto colorStopsIt = rawBackgroundImageMap.find("colorStops");

    if (colorStopsIt != rawBackgroundImageMap.end() &&
        colorStopsIt->second.hasType<std::vector<RawValue>>()) {
      auto rawColorStops =
          static_cast<std::vector<RawValue>>(colorStopsIt->second);

      for (const auto& stop : rawColorStops) {
        if (stop.hasType<std::unordered_map<std::string, RawValue>>()) {
          auto stopMap =
              static_cast<std::unordered_map<std::string, RawValue>>(stop);
          auto positionIt = stopMap.find("position");
          auto colorIt = stopMap.find("color");

          if (positionIt != stopMap.end() && colorIt != stopMap.end()) {
            ColorStop colorStop;
            if (positionIt->second.hasValue()) {
              auto valueUnit = toValueUnit(positionIt->second);
              if (!valueUnit) {
                result = {};
                return;
              }
              colorStop.position = valueUnit;
            }
            if (colorIt->second.hasValue()) {
              fromRawValue(
                  context.contextContainer,
                  context.surfaceId,
                  colorIt->second,
                  colorStop.color);
            }
            colorStops.push_back(colorStop);
          }
        }
      }
    }

    if (type == "linear-gradient") {
      LinearGradient linearGradient;

      auto directionIt = rawBackgroundImageMap.find("direction");
      if (directionIt != rawBackgroundImageMap.end() &&
          directionIt->second
              .hasType<std::unordered_map<std::string, RawValue>>()) {
        auto directionMap =
            static_cast<std::unordered_map<std::string, RawValue>>(
                directionIt->second);

        auto directionTypeIt = directionMap.find("type");
        auto valueIt = directionMap.find("value");

        if (directionTypeIt != directionMap.end() &&
            valueIt != directionMap.end()) {
          std::string directionType = (std::string)(directionTypeIt->second);

          if (directionType == "angle") {
            linearGradient.direction.type = GradientDirectionType::Angle;
            if (valueIt->second.hasType<Float>()) {
              linearGradient.direction.value = (Float)(valueIt->second);
            }
          } else if (directionType == "keyword") {
            linearGradient.direction.type = GradientDirectionType::Keyword;
            if (valueIt->second.hasType<std::string>()) {
              linearGradient.direction.value =
                  parseGradientKeyword((std::string)(valueIt->second));
            }
          }
        }
      }

      if (!colorStops.empty()) {
        linearGradient.colorStops = colorStops;
      }

      backgroundImage.emplace_back(std::move(linearGradient));
    } else if (type == "radial-gradient") {
      RadialGradient radialGradient;
      auto shapeIt = rawBackgroundImageMap.find("shape");
      if (shapeIt != rawBackgroundImageMap.end() &&
          shapeIt->second.hasType<std::string>()) {
        auto shape = (std::string)(shapeIt->second);
        radialGradient.shape = shape == "circle" ? RadialGradientShape::Circle
                                                  : RadialGradientShape::Ellipse;
      }

      auto sizeIt = rawBackgroundImageMap.find("size");
      if (sizeIt != rawBackgroundImageMap.end()) {
        if (sizeIt->second.hasType<std::string>()) {
          auto sizeStr = (std::string)(sizeIt->second);
          if (sizeStr == "closest-side") {
            radialGradient.size.value =
                RadialGradientSize::SizeKeyword::ClosestSide;
          } else if (sizeStr == "farthest-side") {
            radialGradient.size.value =
                RadialGradientSize::SizeKeyword::FarthestSide;
          } else if (sizeStr == "closest-corner") {
            radialGradient.size.value =
                RadialGradientSize::SizeKeyword::ClosestCorner;
          } else if (sizeStr == "farthest-corner") {
            radialGradient.size.value =
                RadialGradientSize::SizeKeyword::FarthestCorner;
          }
        } else if (sizeIt->second
                        .hasType<std::unordered_map<std::string, RawValue>>()) {
          auto sizeMap = static_cast<std::unordered_map<std::string, RawValue>>(
              sizeIt->second);
          auto xIt = sizeMap.find("x");
          auto yIt = sizeMap.find("y");
          if (xIt != sizeMap.end() && yIt != sizeMap.end()) {
            RadialGradientSize sizeObj;
            sizeObj.value = RadialGradientSize::Dimensions{
                toValueUnit(xIt->second), toValueUnit(yIt->second)};
            radialGradient.size = sizeObj;
          }
        }

        auto positionIt = rawBackgroundImageMap.find("position");
        if (positionIt != rawBackgroundImageMap.end() &&
            positionIt->second
                .hasType<std::unordered_map<std::string, RawValue>>()) {
          auto positionMap =
              static_cast<std::unordered_map<std::string, RawValue>>(
                  positionIt->second);

          auto topIt = positionMap.find("top");
          auto bottomIt = positionMap.find("bottom");
          auto leftIt = positionMap.find("left");
          auto rightIt = positionMap.find("right");

          if (topIt != positionMap.end()) {
            auto topValue = toValueUnit(topIt->second);
            radialGradient.position.top = topValue;
          } else if (bottomIt != positionMap.end()) {
            auto bottomValue = toValueUnit(bottomIt->second);
            radialGradient.position.bottom = bottomValue;
          }

          if (leftIt != positionMap.end()) {
            auto leftValue = toValueUnit(leftIt->second);
            radialGradient.position.left = leftValue;
          } else if (rightIt != positionMap.end()) {
            auto rightValue = toValueUnit(rightIt->second);
            radialGradient.position.right = rightValue;
          }
        }
      }

      if (!colorStops.empty()) {
        radialGradient.colorStops = colorStops;
      }

      backgroundImage.emplace_back(std::move(radialGradient));
    }
  }

  result = backgroundImage;
}

void parseUnProcessedBackgroundImageList(
    const PropsParserContext& context,
    const RawValue& value,
    std::vector<BackgroundImage>& result) {
  react_native_expect(value.hasType<std::vector<RawValue>>());
  if (!value.hasType<std::vector<RawValue>>()) {
    result = {};
    return;
  }

  std::vector<BackgroundImage> backgroundImage{};
  auto rawBackgroundImage = static_cast<std::vector<RawValue>>(value);
  for (const auto& rawBackgroundImageValue : rawBackgroundImage) {
    bool isMap = rawBackgroundImageValue
                      .hasType<std::unordered_map<std::string, RawValue>>();
    react_native_expect(isMap);
    if (!isMap) {
      result = {};
      return;
    }

    auto rawBackgroundImageMap =
        static_cast<std::unordered_map<std::string, RawValue>>(
            rawBackgroundImageValue);

    auto typeIt = rawBackgroundImageMap.find("type");
    if (typeIt == rawBackgroundImageMap.end() ||
        !typeIt->second.hasType<std::string>()) {
      continue;
    }

    std::string type = (std::string)(typeIt->second);
    std::vector<ColorStop> colorStops;
    auto colorStopsIt = rawBackgroundImageMap.find("colorStops");

    if (colorStopsIt != rawBackgroundImageMap.end() &&
        colorStopsIt->second.hasType<std::vector<RawValue>>()) {
      auto rawColorStops =
          static_cast<std::vector<RawValue>>(colorStopsIt->second);

      for (const auto& stop : rawColorStops) {
        if (stop.hasType<std::unordered_map<std::string, RawValue>>()) {
          auto stopMap =
              static_cast<std::unordered_map<std::string, RawValue>>(stop);
          auto positionsIt = stopMap.find("positions");
          auto colorIt = stopMap.find("color");
          // has only color. e.g. (red, green)
          if (positionsIt == stopMap.end() ||
              (positionsIt->second.hasType<std::vector<RawValue>>() &&
               static_cast<std::vector<RawValue>>(positionsIt->second).size() == 0)) {
            auto color = coerceColor(colorIt->second, context);
            if (!color) {
              // invalid color
              result = {};
              return;
            }
            ColorStop colorStop;
            colorStop.color = color;
            colorStops.push_back(colorStop);
            continue;
          }

          // Color hint (red, 20%, blue)
          // or Color Stop with positions (red, 20% 30%)
          if (positionsIt != stopMap.end() && positionsIt->second.hasType<std::vector<RawValue>>()) {
            auto positions = static_cast<std::vector<RawValue>>(positionsIt->second);
            for (const auto& position : positions) {
              auto positionValue = toValueUnit(position);
              if (!positionValue) {
                // invalid position
                result = {};
                return;
              }
              
              ColorStop colorStop;
              colorStop.position = positionValue;

              if (colorIt != stopMap.end()) {
                auto color = coerceColor(colorIt->second, context);
                if (color) {
                  colorStop.color = color;
                }
              }

              colorStops.push_back(colorStop);
            }
          }
        }
      }
    }

    if (type == "linear-gradient") {
      LinearGradient linearGradient;

      auto directionIt = rawBackgroundImageMap.find("direction");
      if (directionIt != rawBackgroundImageMap.end()) {
        if (directionIt->second.hasType<std::string>()) {
          std::string directionStr = (std::string)(directionIt->second);
          auto cssDirection = parseCSSProperty<CSSLinearGradientDirection>(directionStr);
          
          if (std::holds_alternative<CSSLinearGradientDirection>(cssDirection)) {
            auto direction = std::get<CSSLinearGradientDirection>(cssDirection);
            
            if (std::holds_alternative<CSSAngle>(direction.value)) {
              linearGradient.direction.type = GradientDirectionType::Angle;
              linearGradient.direction.value = std::get<CSSAngle>(direction.value).degrees;
            } else if (std::holds_alternative<CSSLinearGradientDirectionKeyword>(direction.value)) {
              linearGradient.direction.type = GradientDirectionType::Keyword;
              auto keyword = std::get<CSSLinearGradientDirectionKeyword>(direction.value);
              
              switch (keyword) {
                case CSSLinearGradientDirectionKeyword::ToTopLeft: 
                  linearGradient.direction.value = GradientKeyword::ToTopLeft; break;
                case CSSLinearGradientDirectionKeyword::ToTopRight: 
                  linearGradient.direction.value = GradientKeyword::ToTopRight; break;
                case CSSLinearGradientDirectionKeyword::ToBottomLeft: 
                  linearGradient.direction.value = GradientKeyword::ToBottomLeft; break;
                case CSSLinearGradientDirectionKeyword::ToBottomRight: 
                  linearGradient.direction.value = GradientKeyword::ToBottomRight; break;
              }
            }
          }
        }
      }

      if (!colorStops.empty()) {
        linearGradient.colorStops = colorStops;
      }

      backgroundImage.emplace_back(std::move(linearGradient));
    } else if (type == "radial-gradient") {
      RadialGradient radialGradient;
      auto shapeIt = rawBackgroundImageMap.find("shape");
      if (shapeIt != rawBackgroundImageMap.end() &&
          shapeIt->second.hasType<std::string>()) {
        auto shape = (std::string)(shapeIt->second);
        radialGradient.shape = shape == "circle" ? RadialGradientShape::Circle
                                                  : RadialGradientShape::Ellipse;
      }

      auto sizeIt = rawBackgroundImageMap.find("size");
      if (sizeIt != rawBackgroundImageMap.end()) {
        if (sizeIt->second.hasType<std::string>()) {
          auto sizeStr = (std::string)(sizeIt->second);
          if (sizeStr == "closest-side") {
            radialGradient.size.value =
                RadialGradientSize::SizeKeyword::ClosestSide;
          } else if (sizeStr == "farthest-side") {
            radialGradient.size.value =
                RadialGradientSize::SizeKeyword::FarthestSide;
          } else if (sizeStr == "closest-corner") {
            radialGradient.size.value =
                RadialGradientSize::SizeKeyword::ClosestCorner;
          } else if (sizeStr == "farthest-corner") {
            radialGradient.size.value =
                RadialGradientSize::SizeKeyword::FarthestCorner;
          }
        } else if (sizeIt->second
                        .hasType<std::unordered_map<std::string, RawValue>>()) {
          auto sizeMap = static_cast<std::unordered_map<std::string, RawValue>>(
              sizeIt->second);
          auto xIt = sizeMap.find("x");
          auto yIt = sizeMap.find("y");
          if (xIt != sizeMap.end() && yIt != sizeMap.end()) {
            RadialGradientSize sizeObj;
            sizeObj.value = RadialGradientSize::Dimensions{
                toValueUnit(xIt->second), toValueUnit(yIt->second)};
            radialGradient.size = sizeObj;
          }
        }

        auto positionIt = rawBackgroundImageMap.find("position");
        if (positionIt != rawBackgroundImageMap.end() &&
            positionIt->second
                .hasType<std::unordered_map<std::string, RawValue>>()) {
          auto positionMap =
              static_cast<std::unordered_map<std::string, RawValue>>(
                  positionIt->second);

          auto topIt = positionMap.find("top");
          auto bottomIt = positionMap.find("bottom");
          auto leftIt = positionMap.find("left");
          auto rightIt = positionMap.find("right");

          if (topIt != positionMap.end()) {
            auto topValue = toValueUnit(topIt->second);
            radialGradient.position.top = topValue;
          } else if (bottomIt != positionMap.end()) {
            auto bottomValue = toValueUnit(bottomIt->second);
            radialGradient.position.bottom = bottomValue;
          }

          if (leftIt != positionMap.end()) {
            auto leftValue = toValueUnit(leftIt->second);
            radialGradient.position.left = leftValue;
          } else if (rightIt != positionMap.end()) {
            auto rightValue = toValueUnit(rightIt->second);
            radialGradient.position.right = rightValue;
          }
        }
      }

      if (!colorStops.empty()) {
        radialGradient.colorStops = colorStops;
      }

      backgroundImage.emplace_back(std::move(radialGradient));
    }
  }

  result = backgroundImage;
}

ValueUnit convertLengthPercentageToValueUnit(const std::variant<CSSLength, CSSPercentage>& value) {
  if (std::holds_alternative<CSSLength>(value)) {
    return ValueUnit(std::get<CSSLength>(value).value, UnitType::Point);
  } else {
    return ValueUnit(std::get<CSSPercentage>(value).value, UnitType::Percent);
  }
}

void fromCSSColorStop(const std::variant<CSSColorStop, CSSColorHint>& item, std::vector<ColorStop>& colorStops) {
  if (std::holds_alternative<CSSColorStop>(item)) {
    const auto& colorStop = std::get<CSSColorStop>(item);
    
    // handle two positions case: [color, position, position] -> push two stops
    if (colorStop.startPosition.has_value() && colorStop.endPosition.has_value()) {
      // first stop with start position
      ColorStop stop1;
      stop1.color = fromCSSColor(colorStop.color);
      stop1.position = convertLengthPercentageToValueUnit(*colorStop.startPosition);
      colorStops.push_back(stop1);
      
      // second stop with end position (same color)
      ColorStop stop2;
      stop2.color = fromCSSColor(colorStop.color);
      stop2.position = convertLengthPercentageToValueUnit(*colorStop.endPosition);
      colorStops.push_back(stop2);
    } else {
      // single color stop
      ColorStop stop;
      stop.color = fromCSSColor(colorStop.color);
      
      // handle start position if present
      if (colorStop.startPosition.has_value()) {
        stop.position = convertLengthPercentageToValueUnit(*colorStop.startPosition);
      }
      
      colorStops.push_back(stop);
    }
  } else if (std::holds_alternative<CSSColorHint>(item)) {
    const auto& colorHint = std::get<CSSColorHint>(item);
    // color hint: add a stop with null color and the hint position
    ColorStop hintStop;
    hintStop.position = convertLengthPercentageToValueUnit(colorHint.position);
    colorStops.push_back(hintStop);
  }
}

std::optional<BackgroundImage> fromCSSBackgroundImage(const CSSBackgroundImageVariant& cssBackgroundImage) {
  if (std::holds_alternative<CSSLinearGradientFunction>(cssBackgroundImage)) {
    const auto& gradient = std::get<CSSLinearGradientFunction>(cssBackgroundImage);
    LinearGradient linearGradient;
    
    if (gradient.direction.has_value()) {
      if (std::holds_alternative<CSSAngle>(gradient.direction->value)) {
        const auto& angle = std::get<CSSAngle>(gradient.direction->value);
        linearGradient.direction.type = GradientDirectionType::Angle;
        linearGradient.direction.value = angle.degrees;
      } else if (std::holds_alternative<CSSLinearGradientDirectionKeyword>(gradient.direction->value)) {
        const auto& dirKeyword = std::get<CSSLinearGradientDirectionKeyword>(gradient.direction->value);
        linearGradient.direction.type = GradientDirectionType::Keyword;
        
        switch (dirKeyword) {
          case CSSLinearGradientDirectionKeyword::ToTopLeft: 
            linearGradient.direction.value = GradientKeyword::ToTopLeft; break;
          case CSSLinearGradientDirectionKeyword::ToTopRight: 
            linearGradient.direction.value = GradientKeyword::ToTopRight; break;
          case CSSLinearGradientDirectionKeyword::ToBottomLeft: 
            linearGradient.direction.value = GradientKeyword::ToBottomLeft; break;
          case CSSLinearGradientDirectionKeyword::ToBottomRight: 
            linearGradient.direction.value = GradientKeyword::ToBottomRight; break;
        }
      }
    }
    
    for (const auto& item : gradient.items) {
      fromCSSColorStop(item, linearGradient.colorStops);
    }
    
    return BackgroundImage{linearGradient};
    
  } else if (std::holds_alternative<CSSRadialGradientFunction>(cssBackgroundImage)) {
    const auto& gradient = std::get<CSSRadialGradientFunction>(cssBackgroundImage);
    RadialGradient radialGradient;
    
    if (gradient.shape.has_value()) {
      radialGradient.shape = (*gradient.shape == CSSRadialGradientShape::Circle) ? 
                            RadialGradientShape::Circle : RadialGradientShape::Ellipse;
    }
    
    if (gradient.size.has_value()) {
      if (std::holds_alternative<CSSRadialGradientSizeKeyword>(*gradient.size)) {
        const auto& sizeKeyword = std::get<CSSRadialGradientSizeKeyword>(*gradient.size);
        switch (sizeKeyword) {
          case CSSRadialGradientSizeKeyword::ClosestSide:
            radialGradient.size.value = RadialGradientSize::SizeKeyword::ClosestSide;
            break;
          case CSSRadialGradientSizeKeyword::ClosestCorner:
            radialGradient.size.value = RadialGradientSize::SizeKeyword::ClosestCorner;
            break;
          case CSSRadialGradientSizeKeyword::FarthestSide:
            radialGradient.size.value = RadialGradientSize::SizeKeyword::FarthestSide;
            break;
          case CSSRadialGradientSizeKeyword::FarthestCorner:
            radialGradient.size.value = RadialGradientSize::SizeKeyword::FarthestCorner;
            break;
        }
      } else if (std::holds_alternative<CSSRadialGradientExplicitSize>(*gradient.size)) {
        const auto& explicitSize = std::get<CSSRadialGradientExplicitSize>(*gradient.size);
        ValueUnit sizeX = convertLengthPercentageToValueUnit(explicitSize.sizeX);
        ValueUnit sizeY = convertLengthPercentageToValueUnit(explicitSize.sizeY);
        radialGradient.size.value = RadialGradientSize::Dimensions{sizeX, sizeY};
      }
    }
    
    if (gradient.position.has_value()) {
      const auto& pos = *gradient.position;
      
      if (pos.top.has_value()) {
        radialGradient.position.top = convertLengthPercentageToValueUnit(*pos.top);
      }
      if (pos.bottom.has_value()) {
        radialGradient.position.bottom = convertLengthPercentageToValueUnit(*pos.bottom);
      }
      if (pos.left.has_value()) {
        radialGradient.position.left = convertLengthPercentageToValueUnit(*pos.left);
      }
      if (pos.right.has_value()) {
        radialGradient.position.right = convertLengthPercentageToValueUnit(*pos.right);
      }
    }
    
    for (const auto& item : gradient.items) {
      fromCSSColorStop(item, radialGradient.colorStops);
    }
    
    return BackgroundImage{radialGradient};
  }
  
  return std::nullopt;
}

void parseUnprocessedBackgroundImageString(std::string&& value, std::vector<BackgroundImage>& result) {
  auto backgroundImageList = parseCSSProperty<CSSBackgroundImageList>((std::string)value);
  if (!std::holds_alternative<CSSBackgroundImageList>(backgroundImageList)) {
    result = {};
    return;
  }

  std::vector<BackgroundImage> backgroundImages;
  for (const auto& cssBackgroundImage : std::get<CSSBackgroundImageList>(backgroundImageList)) {
    if (auto backgroundImage = fromCSSBackgroundImage(cssBackgroundImage)) {
      backgroundImages.push_back(*backgroundImage);
    } else {
      result = {};
      return;
    }
  }
  
  result = backgroundImages;
}


inline void parseUnprocessedBackgroundImage(
    const PropsParserContext& context,
    const RawValue& value,
    std::vector<BackgroundImage>& result) {
  if (value.hasType<std::string>()) {
    parseUnprocessedBackgroundImageString((std::string)value, result);
  } else if (value.hasType<std::vector<RawValue>>()) {
    parseUnProcessedBackgroundImageList(context, value, result);
  } else {
    result = {};
  }
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    std::vector<BackgroundImage>& result) {
  if (ReactNativeFeatureFlags::enableNativeCSSParsing()) {
    parseUnprocessedBackgroundImage(context, value, result);
  } else {
    parseProcessedBackgroundImage(context, value, result);
  }
}

} // namespace facebook::react
