/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/graphics/ColorComponents.h>
#include <react/renderer/graphics/RCTPlatformColorUtils.h>

namespace facebook {
namespace react {

inline ColorComponents parsePlatformColor(
    const PropsParserContext &context,
    const RawValue &value) {
  if (value.hasType<butter::map<std::string, RawValue>>()) {
    auto items = (butter::map<std::string, RawValue>)value;
    if (items.find("semantic") != items.end() &&
        items.at("semantic").hasType<std::vector<std::string>>()) {
      auto semanticItems = (std::vector<std::string>)items.at("semantic");
      return RCTPlatformColorComponentsFromSemanticItems(semanticItems);
    }
  }

  return {0, 0, 0, 0};
}

} // namespace react
} // namespace facebook
