/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Dimension.h"
#include "Utils.h"

#ifdef DEBUG
#include <ostream>
#endif

namespace facebook {
namespace flexlayout {

#ifdef DEBUG
auto operator<<(std::ostream& os, const AlignContent& x) -> std::ostream& {
  switch (x) {
    case AlignContent::FlexStart:
      os << "FlexStart";
      break;
    case AlignContent::Center:
      os << "Center";
      break;
    case AlignContent::FlexEnd:
      os << "FlexEnd";
      break;
    case AlignContent::Stretch:
      os << "Stretch";
      break;
    case AlignContent::Baseline:
      os << "Baseline";
      break;
    case AlignContent::SpaceBetween:
      os << "SpaceBetween";
      break;
    case AlignContent::SpaceAround:
      os << "SpaceAround";
      break;
  }
  return os;
}

auto operator<<(std::ostream& os, const AlignItems& x) -> std::ostream& {
  switch (x) {
    case AlignItems::FlexStart:
      os << "FlexStart";
      break;
    case AlignItems::Center:
      os << "Center";
      break;
    case AlignItems::FlexEnd:
      os << "FlexEnd";
      break;
    case AlignItems::Stretch:
      os << "Stretch";
      break;
    case AlignItems::Baseline:
      os << "Baseline";
      break;
  }
  return os;
}

auto operator<<(std::ostream& os, const AlignSelf& x) -> std::ostream& {
  switch (x) {
    case AlignSelf::Auto:
      os << "Auto";
      break;
    case AlignSelf::FlexStart:
      os << "FlexStart";
      break;
    case AlignSelf::Center:
      os << "Center";
      break;
    case AlignSelf::FlexEnd:
      os << "FlexEnd";
      break;
    case AlignSelf::Stretch:
      os << "Stretch";
      break;
    case AlignSelf::Baseline:
      os << "Baseline";
      break;
  }
  return os;
}

auto operator<<(std::ostream& os, const Edge& x) -> std::ostream& {
  switch (x) {
    case Edge::Left:
      os << "Left";
      break;
    case Edge::Top:
      os << "Top";
      break;
    case Edge::Right:
      os << "Right";
      break;
    case Edge::Bottom:
      os << "Bottom";
      break;
  }
  return os;
}

auto operator<<(std::ostream& os, const PositionType& x) -> std::ostream& {
  switch (x) {
    case PositionType::Relative:
      os << "Relative";
      break;
    case PositionType::Absolute:
      os << "Absolute";
      break;
  }
  return os;
}

auto operator<<(std::ostream& os, const Display& x) -> std::ostream& {
  switch (x) {
    case Display::Flex:
      os << "Flex";
      break;
    case Display::None:
      os << "None";
      break;
  }
  return os;
}
#endif

namespace utils {

auto Dimension::operator==(const Dimension& rhs) const -> bool {
  return unit == rhs.unit && FlexLayoutFloatsEqual(value, rhs.value);
}

auto Dimension::operator!=(const Dimension& rhs) const -> bool {
  return !(*this == rhs);
}

#ifdef DEBUG
auto operator<<(std::ostream& os, const Dimension& x) -> std::ostream& {
  switch (x.unit) {
    case Unit::Undefined:
      os << "-";
      break;
    case Unit::Point:
      os << x.value << "pt";
      break;
    case Unit::Percent:
      os << x.value << "%";
      break;
    case Unit::Auto:
      os << "Auto";
      break;
  }
  return os;
}
#endif
} // namespace utils
} // namespace flexlayout
} // namespace facebook
