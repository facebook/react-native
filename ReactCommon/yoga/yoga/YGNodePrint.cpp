/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#ifdef DEBUG
#include "YGNodePrint.h"
#include <stdarg.h>
#include "YGEnums.h"
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

static void appendFormatedString(string& str, const char* fmt, ...) {
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
    appendFormatedString(base, "%s: %g; ", key.c_str(), num.unwrap());
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
      appendFormatedString(
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
    appendNumberIfNotZero(base, key, edges[YGEdgeLeft]);
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
  appendNumberIfNotUndefined(
      base,
      str,
      YGComputedEdgeValue(edges, edge, detail::CompactValue::ofUndefined()));
}

void YGNodeToString(
    std::string& str,
    YGNodeRef node,
    YGPrintOptions options,
    uint32_t level) {
  indent(str, level);
  appendFormatedString(str, "<div ");

  if (options & YGPrintOptionsLayout) {
    appendFormatedString(str, "layout=\"");
    appendFormatedString(
        str, "width: %g; ", node->getLayout().dimensions[YGDimensionWidth]);
    appendFormatedString(
        str, "height: %g; ", node->getLayout().dimensions[YGDimensionHeight]);
    appendFormatedString(
        str, "top: %g; ", node->getLayout().position[YGEdgeTop]);
    appendFormatedString(
        str, "left: %g;", node->getLayout().position[YGEdgeLeft]);
    appendFormatedString(str, "\" ");
  }

  if (options & YGPrintOptionsStyle) {
    appendFormatedString(str, "style=\"");
    const auto& style = node->getStyle();
    if (style.flexDirection() != YGNode().getStyle().flexDirection()) {
      appendFormatedString(
          str,
          "flex-direction: %s; ",
          YGFlexDirectionToString(style.flexDirection()));
    }
    if (style.justifyContent() != YGNode().getStyle().justifyContent()) {
      appendFormatedString(
          str,
          "justify-content: %s; ",
          YGJustifyToString(style.justifyContent()));
    }
    if (style.alignItems() != YGNode().getStyle().alignItems()) {
      appendFormatedString(
          str, "align-items: %s; ", YGAlignToString(style.alignItems()));
    }
    if (style.alignContent() != YGNode().getStyle().alignContent()) {
      appendFormatedString(
          str, "align-content: %s; ", YGAlignToString(style.alignContent()));
    }
    if (style.alignSelf() != YGNode().getStyle().alignSelf()) {
      appendFormatedString(
          str, "align-self: %s; ", YGAlignToString(style.alignSelf()));
    }
    appendFloatOptionalIfDefined(str, "flex-grow", style.flexGrow());
    appendFloatOptionalIfDefined(str, "flex-shrink", style.flexShrink());
    appendNumberIfNotAuto(str, "flex-basis", style.flexBasis());
    appendFloatOptionalIfDefined(str, "flex", style.flex());

    if (style.flexWrap() != YGNode().getStyle().flexWrap()) {
      appendFormatedString(
          str, "flex-wrap: %s; ", YGWrapToString(style.flexWrap()));
    }

    if (style.overflow() != YGNode().getStyle().overflow()) {
      appendFormatedString(
          str, "overflow: %s; ", YGOverflowToString(style.overflow()));
    }

    if (style.display() != YGNode().getStyle().display()) {
      appendFormatedString(
          str, "display: %s; ", YGDisplayToString(style.display()));
    }
    appendEdges(str, "margin", style.margin());
    appendEdges(str, "padding", style.padding());
    appendEdges(str, "border", style.border());

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
      appendFormatedString(
          str, "position: %s; ", YGPositionTypeToString(style.positionType()));
    }

    appendEdgeIfNotUndefined(str, "left", style.position(), YGEdgeLeft);
    appendEdgeIfNotUndefined(str, "right", style.position(), YGEdgeRight);
    appendEdgeIfNotUndefined(str, "top", style.position(), YGEdgeTop);
    appendEdgeIfNotUndefined(str, "bottom", style.position(), YGEdgeBottom);
    appendFormatedString(str, "\" ");

    if (node->hasMeasureFunc()) {
      appendFormatedString(str, "has-custom-measure=\"true\"");
    }
  }
  appendFormatedString(str, ">");

  const uint32_t childCount = static_cast<uint32_t>(node->getChildren().size());
  if (options & YGPrintOptionsChildren && childCount > 0) {
    for (uint32_t i = 0; i < childCount; i++) {
      appendFormatedString(str, "\n");
      YGNodeToString(str, YGNodeGetChild(node, i), options, level + 1);
    }
    appendFormatedString(str, "\n");
    indent(str, level);
  }
  appendFormatedString(str, "</div>");
}
} // namespace yoga
} // namespace facebook
#endif
