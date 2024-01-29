/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_expect.h>
#include <react/renderer/core/rawValue.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/RCTPlatformColorUtils.h>
#include <react/renderer/graphics/fromRawValueShared.h>
#include <react/utils/ContextContainer.h>
#include <unordered_map>

namespace facebook::react {

inline SharedColor parsePlatformColor(
    const ContextContainer& /*contextContainer*/,
    int32_t /*surfaceId*/,
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

inline void fromRawValue(
    const ContextContainer& contextContainer,
    int32_t surfaceId,
    const RawValue& value,
    SharedColor& result) {
  fromRawValueShared(
      contextContainer, surfaceId, value, result, parsePlatformColor);
}

} // namespace facebook::react
