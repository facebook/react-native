/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_expect.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/fromRawValueShared.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

inline SharedColor
parsePlatformColor(const ContextContainer & /*contextContainer*/, int32_t /*surfaceId*/, const RawValue & /*value*/)
{
  float alpha = 0;
  float red = 0;
  float green = 0;
  float blue = 0;

  return {colorFromComponents({red, green, blue, alpha})};
}

inline void
fromRawValue(const ContextContainer &contextContainer, int32_t surfaceId, const RawValue &value, SharedColor &result)
{
  fromRawValueShared(contextContainer, surfaceId, value, result, parsePlatformColor);
}

} // namespace facebook::react
