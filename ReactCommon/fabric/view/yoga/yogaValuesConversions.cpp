/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "yogaValuesConversions.h"

#include <folly/Conv.h>

#include <fabric/core/LayoutMetrics.h>

namespace facebook {
namespace react {

Float fabricFloatFromYogaFloat(float value) {
  if (value == YGUndefined) {
    return kFloatUndefined;
  }

  return (Float)value;
}

float yogaFloatFromFabricFloat(Float value) {
  if (value == kFloatUndefined) {
    return YGUndefined;
  }

  return (float)value;
}

Float fabricFloatFromYogaOptionalFloat(YGFloatOptional value) {
  if (value.isUndefined()) {
    return kFloatUndefined;
  }

  return fabricFloatFromYogaFloat(value.getValue());
}

YGFloatOptional yogaOptionalFloatFromFabricFloat(Float value) {
  if (value == kFloatUndefined) {
    return YGFloatOptional();
  }

  return YGFloatOptional(yogaFloatFromFabricFloat(value));
}

LayoutMetrics layoutMetricsFromYogaNode(YGNode &yogaNode) {
  LayoutMetrics layoutMetrics;

  YGLayout layout = yogaNode.getLayout();

  layoutMetrics.frame = Rect {
    Point {
      fabricFloatFromYogaFloat(layout.position[YGEdgeLeft]),
      fabricFloatFromYogaFloat(layout.position[YGEdgeTop])
    },
    Size {
      fabricFloatFromYogaFloat(layout.dimensions[YGDimensionWidth]),
      fabricFloatFromYogaFloat(layout.dimensions[YGDimensionHeight])
    }
  };

  layoutMetrics.borderWidth = EdgeInsets {
    fabricFloatFromYogaFloat(layout.border[YGEdgeLeft]),
    fabricFloatFromYogaFloat(layout.border[YGEdgeTop]),
    fabricFloatFromYogaFloat(layout.border[YGEdgeRight]),
    fabricFloatFromYogaFloat(layout.border[YGEdgeBottom])
  };

  layoutMetrics.contentInsets = EdgeInsets {
    fabricFloatFromYogaFloat(layout.border[YGEdgeLeft] + layout.padding[YGEdgeLeft]),
    fabricFloatFromYogaFloat(layout.border[YGEdgeTop] + layout.padding[YGEdgeTop]),
    fabricFloatFromYogaFloat(layout.border[YGEdgeRight] + layout.padding[YGEdgeRight]),
    fabricFloatFromYogaFloat(layout.border[YGEdgeBottom] + layout.padding[YGEdgeBottom])
  };

  layoutMetrics.displayType =
    yogaNode.getStyle().display == YGDisplayNone ? DisplayType::None : DisplayType::Flex;

  layoutMetrics.layoutDirection =
    layout.direction == YGDirectionRTL ? LayoutDirection::RightToLeft : LayoutDirection::LeftToRight;

  return layoutMetrics;
}

YGDirection yogaStyleDirectionFromDynamic(const folly::dynamic &value) {
  assert(value.isString());
  auto stringValue = value.asString();

  if (stringValue == "inherit") { return YGDirectionInherit; }
  if (stringValue == "ltr") { return YGDirectionLTR; }
  if (stringValue == "rtl") { return YGDirectionRTL; }

  abort();
}

YGFlexDirection yogaStyleFlexDirectionFromDynamic(const folly::dynamic &value) {
  assert(value.isString());
  auto stringValue = value.asString();

  if (stringValue == "column") { return YGFlexDirectionColumn; }
  if (stringValue == "column-reverse") { return YGFlexDirectionColumnReverse; }
  if (stringValue == "row") { return YGFlexDirectionRow; }
  if (stringValue == "row-reverse") { return YGFlexDirectionRowReverse; }

  abort();
}

YGJustify yogaStyleJustifyFromDynamic(const folly::dynamic &value) {
  assert(value.isString());
  auto stringValue = value.asString();

  if (stringValue == "flex-start") { return YGJustifyFlexStart; }
  if (stringValue == "center") { return YGJustifyCenter; }
  if (stringValue == "flex-end") { return YGJustifyFlexEnd; }
  if (stringValue == "space-between") { return YGJustifySpaceBetween; }
  if (stringValue == "space-around") { return YGJustifySpaceAround; }
  if (stringValue == "space-evenly") { return YGJustifySpaceEvenly; }

  abort();
}

YGAlign yogaStyleAlignFromDynamic(const folly::dynamic &value) {
  assert(value.isString());
  auto stringValue = value.asString();

  if (stringValue == "auto") { return YGAlignAuto; }
  if (stringValue == "flex-start") { return YGAlignFlexStart; }
  if (stringValue == "center") { return YGAlignCenter; }
  if (stringValue == "flex-end") { return YGAlignFlexEnd; }
  if (stringValue == "stretch") { return YGAlignStretch; }
  if (stringValue == "baseline") { return YGAlignBaseline; }
  if (stringValue == "between") { return YGAlignSpaceBetween; }
  if (stringValue == "space-around") { return YGAlignSpaceAround; }

  abort();
}

YGPositionType yogaStylePositionTypeFromDynamic(const folly::dynamic &value) {
  assert(value.isString());
  auto stringValue = value.asString();

  if (stringValue == "relative") { return YGPositionTypeRelative; }
  if (stringValue == "absolute") { return YGPositionTypeAbsolute; }

  abort();
}

YGWrap yogaStyleWrapFromDynamic(const folly::dynamic &value) {
  assert(value.isString());
  auto stringValue = value.asString();

  if (stringValue == "no-wrap") { return YGWrapNoWrap; }
  if (stringValue == "wrap") { return YGWrapWrap; }
  if (stringValue == "wrap-reverse") { return YGWrapWrapReverse; }

  abort();
}

YGOverflow yogaStyleOverflowFromDynamic(const folly::dynamic &value) {
  assert(value.isString());
  auto stringValue = value.asString();

  if (stringValue == "visible") { return YGOverflowVisible; }
  if (stringValue == "hidden") { return YGOverflowHidden; }
  if (stringValue == "scroll") { return YGOverflowScroll; }

  abort();
}

YGDisplay yogaStyleDisplayFromDynamic(const folly::dynamic &value) {
  assert(value.isString());
  auto stringValue = value.asString();

  if (stringValue == "flex") { return YGDisplayFlex; }
  if (stringValue == "none") { return YGDisplayNone; }

  abort();
}

YGValue yogaStyleValueFromDynamic(const folly::dynamic &value) {
  if (value.isNumber()) {
    float x = value.asDouble();
    return { x, YGUnitPoint };
  } else if (value.isString()) {
    const auto stringValue = value.asString();
    if (stringValue == "auto") {
      return { YGUndefined, YGUnitAuto };
    } else {
      if (stringValue.back() == '%') {
        return { folly::to<float>(stringValue.substr(stringValue.length() - 1)), YGUnitPercent };
      } else {
        return { folly::to<float>(stringValue), YGUnitPoint };
      }
    }
  }

  return YGValueUndefined;
}

YGFloatOptional yogaStyleOptionalFloatFromDynamic(const folly::dynamic &value) {
  if (value.isNumber()) {
    return YGFloatOptional(value.asDouble());
  } else if (value.isString()) {
    const auto stringValue = value.asString();
    if (stringValue == "auto") {
      return YGFloatOptional();
    }
  }

  abort();
}

std::string stringFromYogaDimensions(std::array<float, 2> dimensions) {
  return "{" + folly::to<std::string>(dimensions[0]) + ", " + folly::to<std::string>(dimensions[1]) + "}";
}

std::string stringFromYogaPosition(std::array<float, 4> position) {
  return "{" + folly::to<std::string>(position[0]) + ", " + folly::to<std::string>(position[1]) + "}";
}

std::string stringFromYogaEdges(std::array<float, 6> edges) {
  return "{" +
    folly::to<std::string>(edges[0]) + ", " +
    folly::to<std::string>(edges[1]) + ", " +
    folly::to<std::string>(edges[2]) + ", " +
    folly::to<std::string>(edges[3]) + "}";
}

std::string stringFromYogaStyleDirection(YGDirection value) {
  switch (value) {
    case YGDirectionInherit: return "inherit";
    case YGDirectionLTR: return "ltr";
    case YGDirectionRTL: return "rtl";
  }
}

std::string stringFromYogaStyleFlexDirection(YGFlexDirection value) {
  switch (value) {
    case YGFlexDirectionColumn: return "column";
    case YGFlexDirectionColumnReverse: return "column-reverse";
    case YGFlexDirectionRow: return "row";
    case YGFlexDirectionRowReverse: return "row-reverse";
  }
}

std::string stringFromYogaStyleJustify(YGJustify value) {
  switch (value) {
    case YGJustifyFlexStart: return "flex-start";
    case YGJustifyCenter: return "center";
    case YGJustifyFlexEnd: return "flex-end";
    case YGJustifySpaceBetween: return "space-between";
    case YGJustifySpaceAround: return "space-around";
    case YGJustifySpaceEvenly: return "space-evenly";
  }
}

std::string stringFromYogaStyleAlign(YGAlign value) {
  switch (value) {
    case YGAlignAuto: return "auto";
    case YGAlignFlexStart: return "flex-start";
    case YGAlignCenter: return "center";
    case YGAlignFlexEnd: return "flex-end";
    case YGAlignStretch: return "stretch";
    case YGAlignBaseline: return "baseline";
    case YGAlignSpaceBetween: return "space-between";
    case YGAlignSpaceAround: return "space-around";
  }
}

std::string stringFromYogaStylePositionType(YGPositionType value) {
  switch (value) {
    case YGPositionTypeRelative: return "relative";
    case YGPositionTypeAbsolute: return "absolute";
  }
}

std::string stringFromYogaStyleWrap(YGWrap value) {
  switch (value) {
    case YGWrapNoWrap: return "no-wrap";
    case YGWrapWrap: return "wrap";
    case YGWrapWrapReverse: return "wrap-reverse";
  }
}

std::string stringFromYogaStyleOverflow(YGOverflow value) {
  switch (value) {
    case YGOverflowVisible: return "visible";
    case YGOverflowScroll: return "scroll";
    case YGOverflowHidden: return "hidden";
  }
}

std::string stringFromYogaStyleDisplay(YGDisplay value) {
  switch (value) {
    case YGDisplayFlex: return "flex";
    case YGDisplayNone: return "none";
  }
}

std::string stringFromYogaStyleValue(YGValue value) {
  switch (value.unit) {
    case YGUnitUndefined: return "undefined";
    case YGUnitPoint: return folly::to<std::string>(value.value);
    case YGUnitPercent: return folly::to<std::string>(value.value) + "%";
    case YGUnitAuto: return "auto";
  }
}

std::string stringFromYogaStyleOptionalFloat(YGFloatOptional value) {
  if (value.isUndefined()) {
    return "undefined";
  }

  return folly::to<std::string>(fabricFloatFromYogaFloat(value.getValue()));
}

std::string stringFromYogaStyleDimensions(std::array<YGValue, 2> value) {
  return "{" +
    stringFromYogaStyleValue(value[0]) + ", " +
    stringFromYogaStyleValue(value[1]) + "}";
}

std::string stringFromYogaStyleEdge(std::array<YGValue, YGEdgeCount> value) {
  return "{" +
    stringFromYogaStyleValue(value[0]) + ", " +
    stringFromYogaStyleValue(value[1]) + ", " +
    stringFromYogaStyleValue(value[2]) + ", " +
    stringFromYogaStyleValue(value[3]) + "}";
}

} // namespace react
} // namespace facebook
