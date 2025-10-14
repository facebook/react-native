/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/ColorComponents.h>
#include <react/renderer/graphics/LinearGradient.h>
#include <react/renderer/graphics/RadialGradient.h>

namespace facebook::react {

using BackgroundImage = std::variant<LinearGradient, RadialGradient>;

#ifdef RN_SERIALIZABLE_STATE
folly::dynamic toDynamic(const BackgroundImage& backgroundImage);
#endif

}; // namespace facebook::react
