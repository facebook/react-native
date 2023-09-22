/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/RCTPlatformColorUtils.h>
#include <unordered_map>

namespace facebook::react {

inline SharedColor parsePlatformColor(
    const PropsParserContext& context,
    const RawValue& value) {
  if (value.hasType<std::unordered_map<std::string, RawValue>>()) {
    auto items = (std::unordered_map<std::string, RawValue>)value;
    if (items.find("semantic") != items.end() &&
        items.at("semantic").hasType<std::vector<std::string>>()) {
      auto semanticItems = (std::vector<std::string>)items.at("semantic");
      return {colorFromComponents(
          RCTPlatformColorComponentsFromSemanticItems(semanticItems))};
    }
  }

  return clearColor();
}

} // namespace facebook::react
