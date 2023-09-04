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

namespace facebook::react {

inline SharedColor parsePlatformColor(
    const PropsParserContext& context,
    const RawValue& value) {
  float alpha = 0;
  float red = 0;
  float green = 0;
  float blue = 0;

  return {colorFromComponents({red, green, blue, alpha})};
}

} // namespace facebook::react
