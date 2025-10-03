/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/ValueUnit.h>

namespace facebook::react {

struct ColorStop {
  bool operator==(const ColorStop& other) const = default;
  SharedColor color;
  ValueUnit position;

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const {
    folly::dynamic result = folly::dynamic::object();
    result["color"] = *color;
    result["position"] = position.toDynamic();
    return result;
  }
#endif
};

struct ProcessedColorStop {
  bool operator==(const ProcessedColorStop& other) const = default;
  SharedColor color;
  std::optional<Float> position;
};

}; // namespace facebook::react
