/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/debug/react_native_expect.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/graphics/Color.h>
#include <react/utils/ContextContainer.h>

#pragma once

namespace facebook::react {
using parsePlatformColorFn =
    SharedColor (*)(const ContextContainer&, int32_t, const RawValue&);

inline void fromRawValueShared(
    const ContextContainer& contextContainer,
    int32_t surfaceId,
    const RawValue& value,
    SharedColor& result,
    parsePlatformColorFn parsePlatformColor) {
  ColorComponents colorComponents = {0, 0, 0, 0};

  if (value.hasType<int>()) {
    auto argb = (int64_t)value;
    auto ratio = 255.f;
    colorComponents.alpha = ((argb >> 24) & 0xFF) / ratio;
    colorComponents.red = ((argb >> 16) & 0xFF) / ratio;
    colorComponents.green = ((argb >> 8) & 0xFF) / ratio;
    colorComponents.blue = (argb & 0xFF) / ratio;

    result = colorFromComponents(colorComponents);
  } else if (value.hasType<std::vector<float>>()) {
    auto items = (std::vector<float>)value;
    auto length = items.size();
    react_native_expect(length == 3 || length == 4);
    colorComponents.red = items.at(0);
    colorComponents.green = items.at(1);
    colorComponents.blue = items.at(2);
    colorComponents.alpha = length == 4 ? items.at(3) : 1.0f;

    result = colorFromComponents(colorComponents);
  } else {
    result = parsePlatformColor(contextContainer, surfaceId, value);
  }
}
} // namespace facebook::react
