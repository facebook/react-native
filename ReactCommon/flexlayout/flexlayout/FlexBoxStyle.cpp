/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FlexBoxStyle.h"
#include "Utils.h"

#ifdef DEBUG
#include <sstream>
#endif

namespace facebook {
namespace flexlayout {
namespace style {

auto FlexBoxStyle::getPaddingAndBorder(Edge edge, Float ownerWidth) const
    -> Float {
  const auto paddingValue = padding[static_cast<int>(edge)].resolve(ownerWidth);
  const auto borderValue = border[static_cast<int>(edge)].resolve(ownerWidth);
  return (isUndefined(paddingValue) ? 0 : paddingValue) +
      (isUndefined(borderValue) ? 0 : borderValue);
}

#ifdef DEBUG
static auto operator<<(std::ostream& os, const Direction& d) -> std::ostream& {
  switch (d) {
    case Direction::Inherit:
      os << "Inherit";
      break;
    case Direction::LTR:
      os << "LTR";
      break;
    case Direction::RTL:
      os << "RTL";
      break;
  }
  return os;
}

static auto operator<<(std::ostream& os, const FlexDirection& d)
    -> std::ostream& {
  switch (d) {
    case FlexDirection::Row:
      os << "Row";
      break;
    case FlexDirection::RowReverse:
      os << "RowReverse";
      break;
    case FlexDirection::Column:
      os << "Column";
      break;
    case FlexDirection::ColumnReverse:
      os << "ColumnReverse";
      break;
  }
  return os;
}

static auto operator<<(std::ostream& os, const JustifyContent& x)
    -> std::ostream& {
  switch (x) {
    case JustifyContent::FlexStart:
      os << "FlexStart";
      break;
    case JustifyContent::Center:
      os << "Center";
      break;
    case JustifyContent::FlexEnd:
      os << "FlexEnd";
      break;
    case JustifyContent::SpaceBetween:
      os << "SpaceBetween";
      break;
    case JustifyContent::SpaceAround:
      os << "SpaceAround";
      break;
    case JustifyContent::SpaceEvenly:
      os << "SpaceEvenly";
      break;
  }
  return os;
}

static auto operator<<(std::ostream& os, const FlexWrap& x) -> std::ostream& {
  switch (x) {
    case FlexWrap::NoWrap:
      os << "NoWrap";
      break;
    case FlexWrap::Wrap:
      os << "Wrap";
      break;
    case FlexWrap::WrapReverse:
      os << "WrapReverse";
      break;
  }
  return os;
}

static auto operator<<(std::ostream& os, const Overflow& x) -> std::ostream& {
  switch (x) {
    case Overflow::Visible:
      os << "Visible";
      break;
    case Overflow::Hidden:
      os << "Hidden";
      break;
    case Overflow::Scroll:
      os << "Scroll";
      break;
  }
  return os;
}

auto operator<<(std::ostream& os, const FlexBoxStyle& style) -> std::ostream& {
  std::stringstream styleStr;
  const auto defaultStyle = FlexBoxStyle{};

  if (style.direction != defaultStyle.direction) {
    styleStr << "  direction: " << style.direction << std::endl;
  }

  if (style.flexDirection != defaultStyle.flexDirection) {
    styleStr << "  flexDirection: " << style.flexDirection << std::endl;
  }

  if (style.justifyContent != defaultStyle.justifyContent) {
    styleStr << "  justifyContent: " << style.justifyContent << std::endl;
  }

  if (style.alignContent != defaultStyle.alignContent) {
    styleStr << "  alignContent: " << style.alignContent << std::endl;
  }

  if (style.alignItems != defaultStyle.alignItems) {
    styleStr << "  alignItems: " << style.alignItems << std::endl;
  }

  if (style.flexWrap != defaultStyle.flexWrap) {
    styleStr << "  flexWrap: " << style.flexWrap << std::endl;
  }

  if (style.overflow != defaultStyle.overflow) {
    styleStr << "  overflow: " << style.overflow << std::endl;
  }

  if (style.pointScaleFactor != defaultStyle.pointScaleFactor) {
    styleStr << "  pointScaleFactor: " << style.pointScaleFactor << std::endl;
  }

  std::stringstream paddingStr;
  for (auto edge : {Edge::Left, Edge::Top, Edge::Right, Edge::Bottom}) {
    const auto value = style.getPadding(edge);
    if (value.unit != Unit::Undefined) {
      paddingStr << "    " << edge << ": " << value << std::endl;
    }
  }

  if (!paddingStr.str().empty()) {
    styleStr << "  padding: {" << std::endl;
    styleStr << paddingStr.str();
    styleStr << "  }" << std::endl;
  }

  std::stringstream borderStr;
  for (auto edge : {Edge::Left, Edge::Top, Edge::Right, Edge::Bottom}) {
    const auto value = style.getBorder(edge);
    if (value.unit != Unit::Undefined) {
      borderStr << "    " << edge << ": " << value << std::endl;
    }
  }

  if (!borderStr.str().empty()) {
    styleStr << "  border: {" << std::endl;
    styleStr << borderStr.str();
    styleStr << "  }" << std::endl;
  }

  if (!styleStr.str().empty()) {
    os << '{' << std::endl;
    os << styleStr.str();
    os << '}';
  }
  return os;
}
#endif
} // namespace style
} // namespace flexlayout
} // namespace facebook
