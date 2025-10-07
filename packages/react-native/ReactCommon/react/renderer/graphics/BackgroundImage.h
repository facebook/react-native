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
#include <vector>

namespace facebook::react {

using BackgroundImage = std::variant<LinearGradient, RadialGradient>;

#ifdef RN_SERIALIZABLE_STATE
inline folly::dynamic toDynamic(const BackgroundImage& backgroundImage) {
  if (std::holds_alternative<LinearGradient>(backgroundImage)) {
    return std::get<LinearGradient>(backgroundImage).toDynamic();
  } else if (std::holds_alternative<RadialGradient>(backgroundImage)) {
    return std::get<RadialGradient>(backgroundImage).toDynamic();
  }
  return folly::dynamic(nullptr);
}
#endif

}; // namespace facebook::react
