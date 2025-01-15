/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Float.h>

namespace facebook::react {

struct BoxShadow {
  bool operator==(const BoxShadow& other) const = default;

  Float offsetX{};
  Float offsetY{};
  Float blurRadius{};
  Float spreadDistance{};
  SharedColor color{};
  bool inset{};
};
} // namespace facebook::react
