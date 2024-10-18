/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/ColorComponents.h>
#include <react/renderer/graphics/LinearGradient.h>
#include <vector>

namespace facebook::react {

enum class BackgroundImageType {
  LinearGradient,
};

struct BackgroundImage {
  BackgroundImageType type;
  std::variant<LinearGradient> value;
  bool operator==(const BackgroundImage& other) const {
    return type == other.type && value == other.value;
  }
};

}; // namespace facebook::react
