/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook::react {

enum class UnitType {
  Undefined,
  Point,
  Percent,
};

struct ValueUnit {
  float value{0.0f};
  UnitType unit{UnitType::Undefined};

  ValueUnit() = default;
  ValueUnit(float v, UnitType u) : value(v), unit(u) {}

  bool operator==(const ValueUnit& other) const {
    return value == other.value && unit == other.unit;
  }
  bool operator!=(const ValueUnit& other) const {
    return !(*this == other);
  }

  constexpr float resolve(float referenceLength) {
    switch (unit) {
      case UnitType::Point:
        return value;
      case UnitType::Percent:
        return value * referenceLength * 0.01f;
      default:
        return 0.0f;
    }
  }
};
} // namespace facebook::react
