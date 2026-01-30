/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/CSSConversions.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/css/CSSShadow.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/renderer/graphics/TextShadow.h>
#include <optional>
#include <string>
#include <unordered_map>

namespace facebook::react {

void parseTextShadowString(std::string &&value, std::vector<TextShadow> &result)
{
  auto shadowList = parseCSSProperty<CSSShadowList>((std::string)value);
  if (!std::holds_alternative<CSSShadowList>(shadowList)) {
    result = {};
    return;
  }

  for (const auto &cssShadow : std::get<CSSShadowList>(shadowList)) {
    result.push_back(TextShadow{
        .offsetX = cssShadow.offsetX.value,
        .offsetY = cssShadow.offsetY.value,
        .blurRadius = cssShadow.blurRadius.value,
        .color = fromCSSColor(cssShadow.color),
    });
  }
}

std::optional<TextShadow> parseTextShadowRawValue(const PropsParserContext &context, const RawValue &value)
{
  if (!value.hasType<std::unordered_map<std::string, RawValue>>()) {
    return {};
  }

  auto textShadowMap = std::unordered_map<std::string, RawValue>(value);

  auto rawOffsetX = textShadowMap.find("offsetX");
  if (rawOffsetX == textShadowMap.end()) {
    return {};
  }
  auto offsetX = coerceLength(rawOffsetX->second);
  if (!offsetX.has_value()) {
    return {};
  }

  auto rawOffsetY = textShadowMap.find("offsetY");
  if (rawOffsetY == textShadowMap.end()) {
    return {};
  }
  auto offsetY = coerceLength(rawOffsetY->second);
  if (!offsetY.has_value()) {
    return {};
  }

  Float blurRadius = 0;
  auto rawBlurRadius = textShadowMap.find("blurRadius");
  if (rawBlurRadius != textShadowMap.end()) {
    if (auto blurRadiusValue = coerceLength(rawBlurRadius->second)) {
      if (*blurRadiusValue < 0) {
        return {};
      }
      blurRadius = *blurRadiusValue;
    } else {
      return {};
    }
  }

  SharedColor color;
  auto rawColor = textShadowMap.find("color");
  if (rawColor != textShadowMap.end()) {
    color = coerceColor(rawColor->second, context);
    if (!color) {
      return {};
    }
  }

  return TextShadow{
      .offsetX = *offsetX,
      .offsetY = *offsetY,
      .blurRadius = blurRadius,
      .color = color};
}

void parseTextShadowList(
    const PropsParserContext &context,
    std::vector<RawValue> &&value,
    std::vector<TextShadow> &result)
{
  for (const auto &rawValue : value) {
    if (auto textShadow = parseTextShadowRawValue(context, rawValue)) {
      result.push_back(*textShadow);
    } else {
      result = {};
      return;
    }
  }
}

void parseTextShadow(const PropsParserContext &context, const RawValue &value, std::vector<TextShadow> &result)
{
  if (value.hasType<std::string>()) {
    parseTextShadowString((std::string)value, result);
  } else if (value.hasType<std::vector<RawValue>>()) {
    parseTextShadowList(context, (std::vector<RawValue>)value, result);
  } else {
    result = {};
  }
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, std::vector<TextShadow> &result)
{
  parseTextShadow(context, value, result);
}

} // namespace facebook::react
