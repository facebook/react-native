/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once
#include <cstdint>

namespace facebook {
namespace flexlayout {

enum class Unit : uint8_t { Undefined, Point, Percent, Auto };

enum class Direction : uint8_t { Inherit, LTR, RTL };

enum class FlexDirection : uint8_t { Row, RowReverse, Column, ColumnReverse };

enum class JustifyContent : uint8_t {
  FlexStart,
  Center,
  FlexEnd,
  SpaceBetween,
  SpaceAround,
  SpaceEvenly
};

enum class AlignContent : uint8_t {
  FlexStart,
  Center,
  FlexEnd,
  Stretch,
  Baseline,
  SpaceBetween,
  SpaceAround
};

enum class AlignItems : uint8_t {
  FlexStart,
  Center,
  FlexEnd,
  Stretch,
  Baseline,
};

enum class AlignSelf : uint8_t {
  Auto,
  FlexStart,
  Center,
  FlexEnd,
  Stretch,
  Baseline,
};

enum class FlexWrap : uint8_t { NoWrap, Wrap, WrapReverse };

enum class Overflow : uint8_t { Visible, Hidden, Scroll };

enum class Edge : uint8_t { Left, Top, Right, Bottom };

enum class PositionType : uint8_t { Relative, Absolute };

enum class Display : uint8_t { Flex, None };

} // namespace flexlayout
} // namespace facebook
