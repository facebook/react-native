/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <yoga/Yoga.h>
#include <yoga/YGNode.h>

#include <fabric/graphics/Geometry.h>

namespace facebook {
namespace react {

struct LayoutMetrics;

Float fabricFloatFromYogaFloat(float value);
float yogaFloatFromFabricFloat(Float value);

Float fabricFloatFromYogaOptionalFloat(YGFloatOptional value);
YGFloatOptional yogaOptionalFloatFromFabricFloat(Float value);

LayoutMetrics layoutMetricsFromYogaNode(YGNode &yogaNode);

YGDirection yogaStyleDirectionFromDynamic(const folly::dynamic &value);
YGFlexDirection yogaStyleFlexDirectionFromDynamic(const folly::dynamic &value);
YGJustify yogaStyleJustifyFromDynamic(const folly::dynamic &value);
YGAlign yogaStyleAlignFromDynamic(const folly::dynamic &value);
YGPositionType yogaStylePositionTypeFromDynamic(const folly::dynamic &value);
YGWrap yogaStyleWrapFromDynamic(const folly::dynamic &value);
YGOverflow yogaStyleOverflowFromDynamic(const folly::dynamic &value);
YGDisplay yogaStyleDisplayFromDynamic(const folly::dynamic &value);
YGValue yogaStyleValueFromDynamic(const folly::dynamic &value);
YGFloatOptional yogaStyleOptionalFloatFromDynamic(const folly::dynamic &value);

std::string stringFromYogaDimensions(std::array<float, 2> dimensions);
std::string stringFromYogaPosition(std::array<float, 4> position);
std::string stringFromYogaEdges(std::array<float, 6> edges);
std::string stringFromYogaStyleDirection(YGDirection direction);
std::string stringFromYogaStyleFlexDirection(YGFlexDirection value);
std::string stringFromYogaStyleJustify(YGJustify value);
std::string stringFromYogaStyleAlign(YGAlign value);
std::string stringFromYogaStylePositionType(YGPositionType value);
std::string stringFromYogaStyleWrap(YGWrap value);
std::string stringFromYogaStyleOverflow(YGOverflow value);
std::string stringFromYogaStyleDisplay(YGDisplay value);
std::string stringFromYogaStyleValue(YGValue value);
std::string stringFromYogaStyleOptionalFloat(YGFloatOptional value);
std::string stringFromYogaStyleDimensions(std::array<YGValue, 2> value);
std::string stringFromYogaStyleEdge(std::array<YGValue, YGEdgeCount> value);

} // namespace react
} // namespace facebook
