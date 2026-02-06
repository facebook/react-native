/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/debug/flags.h>
#include <react/renderer/graphics/ColorStop.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/ValueUnit.h>

#include <sstream>
#include <variant>
#include <vector>

namespace facebook::react {

enum class GradientDirectionType { Angle, Keyword };

enum class GradientKeyword {
  ToTopRight,
  ToBottomRight,
  ToTopLeft,
  ToBottomLeft,
};

struct GradientDirection {
  GradientDirectionType type;
  std::variant<Float, GradientKeyword> value;

  bool operator==(const GradientDirection &other) const
  {
    return type == other.type && value == other.value;
  }

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const;
#endif
};

struct LinearGradient {
  GradientDirection direction;
  std::vector<ColorStop> colorStops;

  bool operator==(const LinearGradient &other) const
  {
    return direction == other.direction && colorStops == other.colorStops;
  }

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const;
#endif

#if RN_DEBUG_STRING_CONVERTIBLE
  void toString(std::stringstream &ss) const;
#endif
};

}; // namespace facebook::react
