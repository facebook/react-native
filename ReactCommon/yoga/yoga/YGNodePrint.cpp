/*
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YGNodePrint.h"
#include <stdarg.h>
#include "YGEnums.h"
#include "YGNode.h"
#include "Yoga-internal.h"

namespace facebook {
namespace yoga {
typedef std::string string;

static void indent(string* base, uint32_t level) {
  for (uint32_t i = 0; i < level; ++i) {
    base->append("  ");
  }
}

static bool areFourValuesEqual(const std::array<YGValue, YGEdgeCount>& four) {
  return YGValueEqual(four[0], four[1]) && YGValueEqual(four[0], four[2]) &&
      YGValueEqual(four[0], four[3]);
}

static void appendFormatedString(string* str, const char* fmt, ...) {
  va_list args;
  va_start(args, fmt);
  va_list argsCopy;
  va_copy(argsCopy, args);
  std::vector<char> buf(1 + vsnprintf(NULL, 0, fmt, args));
  va_end(args);
  vsnprintf(buf.data(), buf.size(), fmt, argsCopy);
  va_end(argsCopy);
  string result = string(buf.begin(), buf.end() - 1);
  str->append(result);
}

static void appendFloatOptionalIfDefined(
    string* base,
    const string key,
    const YGFloatOptional num) {
  if (!num.isUndefined()) {
    appendFormatedString(base, "%s: %g; ", key.c_str(), num.getValue());
  }
}

static void appendNumberIfNotUndefined(
    string* base,
    const string key,
    const YGValue number) {
  if (number.unit != YGUnitUndefined) {
    if (number.unit == YGUnitAuto) {
      base->append(key + ": auto; ");
    } else {
      string unit = number.unit == YGUnitPoint ? "px" : "%%";
      appendFormatedString(
          base, "%s: %g%s; ", key.c_str(), number.value, unit.c_str());
    }
  }
}

static void
appendNumberIfNotAuto(string* base, const string& key, const YGValue number) {
  if (number.unit != YGUnitAuto) {
    appendNumberIfNotUndefined(base, key, number);
  }
}

static void
appendNumberIfNotZero(string* base, const string& str, const YGValue number) {

  if (number.unit == YGUnitAuto) {
    base->append(str + ": auto; ");
  } else if (!YGFloatsEqual(number.value, 0)) {
    appendNumberIfNotUndefined(base, str, number);
  }
}

static void appendEdges(
    string* base,
    const string& key,
    const std::array<YGValue, YGEdgeCount>& edges) {
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
    string* base,
    const string& str,
    const std::array<YGValue, YGEdgeCount>& edges,
    const YGEdge edge) {
  appendNumberIfNotUndefined(
      base, str, *YGComputedEdgeValue(edges, edge, &YGValueUndefined));
}

void YGNodeToString(
    std::string* str,
    YGNodeRef node,
    YGPrintOptions options,
    uint32_t level) {
  indent(str, level);
  appendFormatedString(str, "<div ");
  if (node->getPrintFunc() != nullptr) {
    node->getPrintFunc()(node);
  }

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
    if (node->getStyle().flexDirection != YGNode().getStyle().flexDirection) {
      appendFormatedString(
          str,
          "flex-direction: %s; ",
          YGFlexDirectionToString(node->getStyle().flexDirection));
    }
    if (node->getStyle().justifyContent != YGNode().getStyle().justifyContent) {
      appendFormatedString(
          str,
          "justify-content: %s; ",
          YGJustifyToString(node->getStyle().justifyContent));
    }
    if (node->getStyle().alignItems != YGNode().getStyle().alignItems) {
      appendFormatedString(
          str,
          "align-items: %s; ",
          YGAlignToString(node->getStyle().alignItems));
    }
    if (node->getStyle().alignContent != YGNode().getStyle().alignContent) {
      appendFormatedString(
          str,
          "align-content: %s; ",
          YGAlignToString(node->getStyle().alignContent));
    }
    if (node->getStyle().alignSelf != YGNode().getStyle().alignSelf) {
      appendFormatedString(
          str, "align-self: %s; ", YGAlignToString(node->getStyle().alignSelf));
    }
    appendFloatOptionalIfDefined(str, "flex-grow", node->getStyle().flexGrow);
    appendFloatOptionalIfDefined(
        str, "flex-shrink", node->getStyle().flexShrink);
    appendNumberIfNotAuto(str, "flex-basis", node->getStyle().flexBasis);
    appendFloatOptionalIfDefined(str, "flex", node->getStyle().flex);

    if (node->getStyle().flexWrap != YGNode().getStyle().flexWrap) {
      appendFormatedString(
          str, "flexWrap: %s; ", YGWrapToString(node->getStyle().flexWrap));
    }

    if (node->getStyle().overflow != YGNode().getStyle().overflow) {
      appendFormatedString(
          str, "overflow: %s; ", YGOverflowToString(node->getStyle().overflow));
    }

    if (node->getStyle().display != YGNode().getStyle().display) {
      appendFormatedString(
          str, "display: %s; ", YGDisplayToString(node->getStyle().display));
    }
    appendEdges(str, "margin", node->getStyle().margin);
    appendEdges(str, "padding", node->getStyle().padding);
    appendEdges(str, "border", node->getStyle().border);

    appendNumberIfNotAuto(
        str, "width", node->getStyle().dimensions[YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "height", node->getStyle().dimensions[YGDimensionHeight]);
    appendNumberIfNotAuto(
        str, "max-width", node->getStyle().maxDimensions[YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "max-height", node->getStyle().maxDimensions[YGDimensionHeight]);
    appendNumberIfNotAuto(
        str, "min-width", node->getStyle().minDimensions[YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "min-height", node->getStyle().minDimensions[YGDimensionHeight]);

    if (node->getStyle().positionType != YGNode().getStyle().positionType) {
      appendFormatedString(
          str,
          "position: %s; ",
          YGPositionTypeToString(node->getStyle().positionType));
    }

    appendEdgeIfNotUndefined(
        str, "left", node->getStyle().position, YGEdgeLeft);
    appendEdgeIfNotUndefined(
        str, "right", node->getStyle().position, YGEdgeRight);
    appendEdgeIfNotUndefined(str, "top", node->getStyle().position, YGEdgeTop);
    appendEdgeIfNotUndefined(
        str, "bottom", node->getStyle().position, YGEdgeBottom);
    appendFormatedString(str, "\" ");

    if (node->getMeasure() != nullptr) {
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
