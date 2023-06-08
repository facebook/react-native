/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef DEBUG

#include <stdarg.h>

#include <yoga/YGEnums.h>

#include "YGNodePrint.h"
#include "YGNode.h"
#include "Yoga-internal.h"
#include "Utils.h"

namespace facebook {
namespace yoga {
typedef std::string string;

static void indent(string& base, uint32_t level) {
  for (uint32_t i = 0; i < level; ++i) {
    base.append("  ");
  }
}

static bool areFourValuesEqual(const YGStyle::Edges& four) {
  return YGValueEqual(four[0], four[1]) && YGValueEqual(four[0], four[2]) &&
      YGValueEqual(four[0], four[3]);
}

static void appendFormattedString(string& str, const char* fmt, ...) {
  va_list args;
  va_start(args, fmt);
  va_list argsCopy;
  va_copy(argsCopy, args);
  std::vector<char> buf(1 + vsnprintf(NULL, 0, fmt, args));
  va_end(args);
  vsnprintf(buf.data(), buf.size(), fmt, argsCopy);
  va_end(argsCopy);
  string result = string(buf.begin(), buf.end() - 1);
  str.append(result);
}

static void appendFloatOptionalIfDefined(
    string& base,
    const string key,
    const YGFloatOptional num) {
  if (!num.isUndefined()) {
    appendFormattedString(base, "%s: %g; ", key.c_str(), num.unwrap());
  }
}

static void appendNumberIfNotUndefined(
    string& base,
    const string key,
    const YGValue number) {
  if (number.unit != YGUnitUndefined) {
    if (number.unit == YGUnitAuto) {
      base.append(key + ": auto; ");
    } else {
      string unit = number.unit == YGUnitPoint ? "px" : "%%";
      appendFormattedString(
          base, "%s: %g%s; ", key.c_str(), number.value, unit.c_str());
    }
  }
}

static void appendNumberIfNotAuto(
    string& base,
    const string& key,
    const YGValue number) {
  if (number.unit != YGUnitAuto) {
    appendNumberIfNotUndefined(base, key, number);
  }
}

static void appendNumberIfNotZero(
    string& base,
    const string& str,
    const YGValue number) {
  if (number.unit == YGUnitAuto) {
    base.append(str + ": auto; ");
  } else if (!YGFloatsEqual(number.value, 0)) {
    appendNumberIfNotUndefined(base, str, number);
  }
}

static void appendEdges(
    string& base,
    const string& key,
    const YGStyle::Edges& edges) {
  if (areFourValuesEqual(edges)) {
    auto edgeValue = YGNode::computeEdgeValueForColumn(
        edges, YGEdgeLeft, detail::CompactValue::ofZero());
    appendNumberIfNotZero(base, key, edgeValue);
  } else {
    for (int edge = YGEdgeLeft; edge != YGEdgeAll; ++edge) {
      string str = key + "-" + YGEdgeToString(static_cast<YGEdge>(edge));
      appendNumberIfNotZero(base, str, edges[edge]);
    }
  }
}

static void appendEdgeIfNotUndefined(
    string& base,
    const string& str,
    const YGStyle::Edges& edges,
    const YGEdge edge) {
  // TODO: this doesn't take RTL / YGEdgeStart / YGEdgeEnd into account
  auto value = (edge == YGEdgeLeft || edge == YGEdgeRight)
      ? YGNode::computeEdgeValueForRow(
            edges, edge, edge, detail::CompactValue::ofUndefined())
      : YGNode::computeEdgeValueForColumn(
            edges, edge, detail::CompactValue::ofUndefined());
  appendNumberIfNotUndefined(base, str, value);
}

void YGNodeToString(
    std::string& str,
    YGNodeRef node,
    YGPrintOptions options,
    uint32_t level) {
  indent(str, level);
  appendFormattedString(str, "<div ");

  if (options & YGPrintOptionsLayout) {
    appendFormattedString(str, "layout=\"");
    appendFormattedString(
        str, "width: %g; ", node->getLayout().dimensions[YGDimensionWidth]);
    appendFormattedString(
        str, "height: %g; ", node->getLayout().dimensions[YGDimensionHeight]);
    appendFormattedString(
        str, "top: %g; ", node->getLayout().position[YGEdgeTop]);
    appendFormattedString(
        str, "left: %g;", node->getLayout().position[YGEdgeLeft]);
    appendFormattedString(str, "\" ");
  }

  if (options & YGPrintOptionsStyle) {
    appendFormattedString(str, "style=\"");
    const auto& style = node->getStyle();
    if (style.flexDirection() != YGNode().getStyle().flexDirection()) {
      appendFormattedString(
          str,
          "flex-direction: %s; ",
          YGFlexDirectionToString(style.flexDirection()));
    }
    if (style.justifyContent() != YGNode().getStyle().justifyContent()) {
      appendFormattedString(
          str,
          "justify-content: %s; ",
          YGJustifyToString(style.justifyContent()));
    }
    if (style.alignItems() != YGNode().getStyle().alignItems()) {
      appendFormattedString(
          str, "align-items: %s; ", YGAlignToString(style.alignItems()));
    }
    if (style.alignContent() != YGNode().getStyle().alignContent()) {
      appendFormattedString(
          str, "align-content: %s; ", YGAlignToString(style.alignContent()));
    }
    if (style.alignSelf() != YGNode().getStyle().alignSelf()) {
      appendFormattedString(
          str, "align-self: %s; ", YGAlignToString(style.alignSelf()));
    }
    appendFloatOptionalIfDefined(str, "flex-grow", style.flexGrow());
    appendFloatOptionalIfDefined(str, "flex-shrink", style.flexShrink());
    appendNumberIfNotAuto(str, "flex-basis", style.flexBasis());
    appendFloatOptionalIfDefined(str, "flex", style.flex());

    if (style.flexWrap() != YGNode().getStyle().flexWrap()) {
      appendFormattedString(
          str, "flex-wrap: %s; ", YGWrapToString(style.flexWrap()));
    }

    if (style.overflow() != YGNode().getStyle().overflow()) {
      appendFormattedString(
          str, "overflow: %s; ", YGOverflowToString(style.overflow()));
    }

    if (style.display() != YGNode().getStyle().display()) {
      appendFormattedString(
          str, "display: %s; ", YGDisplayToString(style.display()));
    }
    appendEdges(str, "margin", style.margin());
    appendEdges(str, "padding", style.padding());
    appendEdges(str, "border", style.border());

    if (YGNode::computeColumnGap(
            style.gap(), detail::CompactValue::ofUndefined()) !=
        YGNode::computeColumnGap(
            YGNode().getStyle().gap(), detail::CompactValue::ofUndefined())) {
      appendNumberIfNotUndefined(
          str, "column-gap", style.gap()[YGGutterColumn]);
    }
    if (YGNode::computeRowGap(
            style.gap(), detail::CompactValue::ofUndefined()) !=
        YGNode::computeRowGap(
            YGNode().getStyle().gap(), detail::CompactValue::ofUndefined())) {
      appendNumberIfNotUndefined(str, "row-gap", style.gap()[YGGutterRow]);
    }

    appendNumberIfNotAuto(str, "width", style.dimensions()[YGDimensionWidth]);
    appendNumberIfNotAuto(str, "height", style.dimensions()[YGDimensionHeight]);
    appendNumberIfNotAuto(
        str, "max-width", style.maxDimensions()[YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "max-height", style.maxDimensions()[YGDimensionHeight]);
    appendNumberIfNotAuto(
        str, "min-width", style.minDimensions()[YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "min-height", style.minDimensions()[YGDimensionHeight]);

    if (style.positionType() != YGNode().getStyle().positionType()) {
      appendFormattedString(
          str, "position: %s; ", YGPositionTypeToString(style.positionType()));
    }

    appendEdgeIfNotUndefined(str, "left", style.position(), YGEdgeLeft);
    appendEdgeIfNotUndefined(str, "right", style.position(), YGEdgeRight);
    appendEdgeIfNotUndefined(str, "top", style.position(), YGEdgeTop);
    appendEdgeIfNotUndefined(str, "bottom", style.position(), YGEdgeBottom);
    appendFormattedString(str, "\" ");

    if (node->hasMeasureFunc()) {
      appendFormattedString(str, "has-custom-measure=\"true\"");
    }
  }
  appendFormattedString(str, ">");

  const uint32_t childCount = static_cast<uint32_t>(node->getChildren().size());
  if (options & YGPrintOptionsChildren && childCount > 0) {
    for (uint32_t i = 0; i < childCount; i++) {
      appendFormattedString(str, "\n");
      YGNodeToString(str, YGNodeGetChild(node, i), options, level + 1);
    }
    appendFormattedString(str, "\n");
    indent(str, level);
  }
  appendFormattedString(str, "</div>");
}
} // namespace yoga
} // namespace facebook
#endif
