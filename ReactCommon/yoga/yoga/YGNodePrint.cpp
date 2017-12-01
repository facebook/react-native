/*
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "YGNodePrint.h"
#include <stdarg.h>
#include "YGEnums.h"
#include "Yoga-internal.h"

namespace facebook {
namespace yoga {
typedef std::string string;

static void indent(string* base, uint32_t level) {
  for (uint32_t i = 0; i < level; ++i) {
    base->append("  ");
  }
}

static bool areFourValuesEqual(const YGValue four[4]) {
  return YGValueEqual(four[0], four[1]) && YGValueEqual(four[0], four[2]) &&
      YGValueEqual(four[0], four[3]);
}

static void appendFormatedString(string* str, const char* fmt, ...) {
  char buffer[1024];
  va_list args;
  va_start(args, fmt);
  va_list argsCopy;
  va_copy(argsCopy, args);
  va_end(args);
  vsnprintf(buffer, 1024, fmt, argsCopy);
  va_end(argsCopy);
  string result = string(buffer);
  str->append(result);
}

static void
appendFloatIfNotUndefined(string* base, const string key, const float num) {
  if (!YGFloatIsUndefined(num)) {
    appendFormatedString(base, "%s: %g; ", key.c_str(), num);
  }
}

static void appendNumberIfNotUndefined(
    string* base,
    const string key,
    const YGValue* const number) {
  if (number->unit != YGUnitUndefined) {
    if (number->unit == YGUnitAuto) {
      base->append(key + ": auto; ");
    } else {
      string unit = number->unit == YGUnitPoint ? "px" : "%%";
      appendFormatedString(
          base, "%s: %g%s; ", key.c_str(), number->value, unit.c_str());
    }
  }
}

static void appendNumberIfNotAuto(
    string* base,
    const string key,
    const YGValue* const number) {
  if (number->unit != YGUnitAuto) {
    appendNumberIfNotUndefined(base, key, number);
  }
}

static void appendNumberIfNotZero(
    string* base,
    const string str,
    const YGValue* const number) {
  if (!YGFloatsEqual(number->value, 0)) {
    appendNumberIfNotUndefined(base, str, number);
  }
}

static void appendEdges(string* base, const string key, const YGValue* edges) {
  if (areFourValuesEqual(edges)) {
    appendNumberIfNotZero(base, key, &edges[YGEdgeLeft]);
  } else {
    for (int edge = YGEdgeLeft; edge != YGEdgeAll; ++edge) {
      string str = key + "-" + YGEdgeToString(static_cast<YGEdge>(edge));
      appendNumberIfNotZero(base, str, &edges[edge]);
    }
  }
}

static void appendEdgeIfNotUndefined(
    string* base,
    const string str,
    const YGValue* edges,
    const YGEdge edge) {
  appendNumberIfNotUndefined(
      base, str, YGComputedEdgeValue(edges, edge, &YGValueUndefined));
}

void YGNodeToString(
    std::string* str,
    YGNodeRef node,
    YGPrintOptions options,
    uint32_t level) {
  indent(str, level);
  appendFormatedString(str, "<div ");
  if (node->print != nullptr) {
    node->print(node);
  }

  if (options & YGPrintOptionsLayout) {
    appendFormatedString(str, "layout=\"");
    appendFormatedString(
        str, "width: %g; ", node->layout.dimensions[YGDimensionWidth]);
    appendFormatedString(
        str, "height: %g; ", node->layout.dimensions[YGDimensionHeight]);
    appendFormatedString(str, "top: %g; ", node->layout.position[YGEdgeTop]);
    appendFormatedString(str, "left: %g;", node->layout.position[YGEdgeLeft]);
    appendFormatedString(str, "\" ");
  }

  if (options & YGPrintOptionsStyle) {
    appendFormatedString(str, "style=\"");
    if (node->style.flexDirection != gYGNodeDefaults.style.flexDirection) {
      appendFormatedString(
          str,
          "flex-direction: %s; ",
          YGFlexDirectionToString(node->style.flexDirection));
    }
    if (node->style.justifyContent != gYGNodeDefaults.style.justifyContent) {
      appendFormatedString(
          str,
          "justify-content: %s; ",
          YGJustifyToString(node->style.justifyContent));
    }
    if (node->style.alignItems != gYGNodeDefaults.style.alignItems) {
      appendFormatedString(
          str, "align-items: %s; ", YGAlignToString(node->style.alignItems));
    }
    if (node->style.alignContent != gYGNodeDefaults.style.alignContent) {
      appendFormatedString(
          str,
          "align-content: %s; ",
          YGAlignToString(node->style.alignContent));
    }
    if (node->style.alignSelf != gYGNodeDefaults.style.alignSelf) {
      appendFormatedString(
          str, "align-self: %s; ", YGAlignToString(node->style.alignSelf));
    }
    appendFloatIfNotUndefined(str, "flex-grow", node->style.flexGrow);
    appendFloatIfNotUndefined(str, "flex-shrink", node->style.flexShrink);
    appendNumberIfNotAuto(str, "flex-basis", &node->style.flexBasis);
    appendFloatIfNotUndefined(str, "flex", node->style.flex);

    if (node->style.flexWrap != gYGNodeDefaults.style.flexWrap) {
      appendFormatedString(
          str, "flexWrap: %s; ", YGWrapToString(node->style.flexWrap));
    }

    if (node->style.overflow != gYGNodeDefaults.style.overflow) {
      appendFormatedString(
          str, "overflow: %s; ", YGOverflowToString(node->style.overflow));
    }

    if (node->style.display != gYGNodeDefaults.style.display) {
      appendFormatedString(
          str, "display: %s; ", YGDisplayToString(node->style.display));
    }
    appendEdges(str, "margin", node->style.margin);
    appendEdges(str, "padding", node->style.padding);
    appendEdges(str, "border", node->style.border);

    appendNumberIfNotAuto(
        str, "width", &node->style.dimensions[YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "height", &node->style.dimensions[YGDimensionHeight]);
    appendNumberIfNotAuto(
        str, "max-width", &node->style.maxDimensions[YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "max-height", &node->style.maxDimensions[YGDimensionHeight]);
    appendNumberIfNotAuto(
        str, "min-width", &node->style.minDimensions[YGDimensionWidth]);
    appendNumberIfNotAuto(
        str, "min-height", &node->style.minDimensions[YGDimensionHeight]);

    if (node->style.positionType != gYGNodeDefaults.style.positionType) {
      appendFormatedString(
          str,
          "position: %s; ",
          YGPositionTypeToString(node->style.positionType));
    }

    appendEdgeIfNotUndefined(str, "left", node->style.position, YGEdgeLeft);
    appendEdgeIfNotUndefined(str, "right", node->style.position, YGEdgeRight);
    appendEdgeIfNotUndefined(str, "top", node->style.position, YGEdgeTop);
    appendEdgeIfNotUndefined(str, "bottom", node->style.position, YGEdgeBottom);
    appendFormatedString(str, "\" ");

    if (node->measure != nullptr) {
      appendFormatedString(str, "has-custom-measure=\"true\"");
    }
  }
  appendFormatedString(str, ">");

  const uint32_t childCount = YGNodeListCount(node->children);
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
