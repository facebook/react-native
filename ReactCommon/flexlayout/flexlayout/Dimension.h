/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cmath>
#include "FlexLayoutEnums.h"
#include "FlexLayoutMacros.h"
#include "Type.h"

#ifdef DEBUG
#include <iosfwd>
#endif

namespace facebook {
namespace flexlayout {

#ifdef DEBUG
auto operator<<(std::ostream& os, const AlignContent& x) -> std::ostream&;
auto operator<<(std::ostream& os, const AlignItems& x) -> std::ostream&;
auto operator<<(std::ostream& os, const AlignSelf& x) -> std::ostream&;
auto operator<<(std::ostream& os, const Edge& x) -> std::ostream&;
auto operator<<(std::ostream& os, const PositionType& x) -> std::ostream&;
auto operator<<(std::ostream& os, const Display& x) -> std::ostream&;
#endif

namespace utils {

class Dimension {
 public:
  Dimension() {
    value = NAN;
    unit = Unit::Undefined;
  }

  explicit Dimension(const Float value, const Unit unit)
      : value(value), unit(unit) {}

  [[nodiscard]] auto resolve(const Float ownerSize) const -> Float {
    switch (unit) {
      case Unit::Point:
        return value;
      case Unit::Percent:
        return value * ownerSize * 0.01f;
      case Unit::Auto:
      case Unit::Undefined:
        return NAN;
    }
  }

  FLEX_LAYOUT_EXPORT auto operator==(const Dimension& rhs) const -> bool;
  auto operator!=(const Dimension& rhs) const -> bool;

  Float value;
  Unit unit;
};

#ifdef DEBUG
auto operator<<(std::ostream& os, const Dimension& x) -> std::ostream&;
#endif
} // namespace utils
} // namespace flexlayout
} // namespace facebook
