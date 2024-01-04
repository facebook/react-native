/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef DEBUG

#include <stdarg.h>

#include <yoga/debug/Log.h>
#include <yoga/debug/NodeToString.h>
#include <yoga/numeric/Comparison.h>

namespace facebook::yoga {

static void indent(std::string& base, uint32_t level) {
  for (uint32_t i = 0; i < level; ++i) {
    base.append("  ");
  }
}

static void appendFormattedString(std::string& str, const char* fmt, ...) {
  va_list args;
  va_start(args, fmt);
  va_list argsCopy;
  va_copy(argsCopy, args);
  std::vector<char> buf(1 + static_cast<size_t>(vsnprintf(NULL, 0, fmt, args)));
  va_end(args);
  vsnprintf(buf.data(), buf.size(), fmt, argsCopy);
  va_end(argsCopy);
  std::string result = std::string(buf.begin(), buf.end() - 1);
  str.append(result);
}

static void appendFloatOptionalIfDefined(
    std::string& base,
    const std::string key,
    const FloatOptional num) {
  if (num.isDefined()) {
    appendFormattedString(base, "%s: %g; ", key.c_str(), num.unwrap());
  }
}

static void appendNumberIfNotUndefined(
    std::string& base,
    const std::string key,
    const Style::Length& number) {
  if (number.unit() != Unit::Undefined) {
    if (number.unit() == Unit::Auto) {
      base.append(key + ": auto; ");
    } else {
      std::string unit = number.unit() == Unit::Point ? "px" : "%%";
      appendFormattedString(
          base,
          "%s: %g%s; ",
          key.c_str(),
          number.value().unwrap(),
          unit.c_str());
    }
  }
}

static void appendNumberIfNotAuto(
    std::string& base,
    const std::string& key,
    const Style::Length& number) {
  if (number.unit() != Unit::Auto) {
    appendNumberIfNotUndefined(base, key, number);
  }
}

static void appendNumberIfNotZero(
    std::string& base,
    const std::string& str,
    const Style::Length& number) {
  if (number.unit() == Unit::Auto) {
    base.append(str + ": auto; ");
  } else if (!yoga::inexactEquals(number.value().unwrap(), 0)) {
    appendNumberIfNotUndefined(base, str, number);
  }
}

template <auto Field>
static void
appendEdges(std::string& base, const std::string& key, const Style& style) {
  for (auto edge : ordinals<Edge>()) {
    std::string str = key + "-" + toString(edge);
    appendNumberIfNotZero(base, str, (style.*Field)(edge));
  }
}

void nodeToString(
    std::string& str,
    const yoga::Node* node,
    PrintOptions options,
    uint32_t level) {
  indent(str, level);
  appendFormattedString(str, "<div ");

  if ((options & PrintOptions::Layout) == PrintOptions::Layout) {
    appendFormattedString(str, "layout=\"");
    appendFormattedString(
        str, "width: %g; ", node->getLayout().dimension(Dimension::Width));
    appendFormattedString(
        str, "height: %g; ", node->getLayout().dimension(Dimension::Height));
    appendFormattedString(
        str, "top: %g; ", node->getLayout().position(Edge::Top));
    appendFormattedString(
        str, "left: %g;", node->getLayout().position(Edge::Left));
    appendFormattedString(str, "\" ");
  }

  if ((options & PrintOptions::Style) == PrintOptions::Style) {
    appendFormattedString(str, "style=\"");
    const auto& style = node->getStyle();
    if (style.flexDirection() != yoga::Node{}.getStyle().flexDirection()) {
      appendFormattedString(
          str, "flex-direction: %s; ", toString(style.flexDirection()));
    }
    if (style.justifyContent() != yoga::Node{}.getStyle().justifyContent()) {
      appendFormattedString(
          str, "justify-content: %s; ", toString(style.justifyContent()));
    }
    if (style.alignItems() != yoga::Node{}.getStyle().alignItems()) {
      appendFormattedString(
          str, "align-items: %s; ", toString(style.alignItems()));
    }
    if (style.alignContent() != yoga::Node{}.getStyle().alignContent()) {
      appendFormattedString(
          str, "align-content: %s; ", toString(style.alignContent()));
    }
    if (style.alignSelf() != yoga::Node{}.getStyle().alignSelf()) {
      appendFormattedString(
          str, "align-self: %s; ", toString(style.alignSelf()));
    }
    appendFloatOptionalIfDefined(str, "flex-grow", style.flexGrow());
    appendFloatOptionalIfDefined(str, "flex-shrink", style.flexShrink());
    appendNumberIfNotAuto(str, "flex-basis", style.flexBasis());
    appendFloatOptionalIfDefined(str, "flex", style.flex());

    if (style.flexWrap() != yoga::Node{}.getStyle().flexWrap()) {
      appendFormattedString(str, "flex-wrap: %s; ", toString(style.flexWrap()));
    }

    if (style.overflow() != yoga::Node{}.getStyle().overflow()) {
      appendFormattedString(str, "overflow: %s; ", toString(style.overflow()));
    }

    if (style.display() != yoga::Node{}.getStyle().display()) {
      appendFormattedString(str, "display: %s; ", toString(style.display()));
    }
    appendEdges<&Style::margin>(str, "margin", style);
    appendEdges<&Style::padding>(str, "padding", style);
    appendEdges<&Style::border>(str, "border", style);

    if (style.gap(Gutter::All).isDefined()) {
      appendNumberIfNotUndefined(str, "gap", style.gap(Gutter::All));
    } else {
      appendNumberIfNotUndefined(str, "column-gap", style.gap(Gutter::Column));
      appendNumberIfNotUndefined(str, "row-gap", style.gap(Gutter::Row));
    }

    appendNumberIfNotAuto(str, "width", style.dimension(Dimension::Width));
    appendNumberIfNotAuto(str, "height", style.dimension(Dimension::Height));
    appendNumberIfNotAuto(
        str, "max-width", style.maxDimension(Dimension::Width));
    appendNumberIfNotAuto(
        str, "max-height", style.maxDimension(Dimension::Height));
    appendNumberIfNotAuto(
        str, "min-width", style.minDimension(Dimension::Width));
    appendNumberIfNotAuto(
        str, "min-height", style.minDimension(Dimension::Height));

    if (style.positionType() != yoga::Node{}.getStyle().positionType()) {
      appendFormattedString(
          str, "position: %s; ", toString(style.positionType()));
    }

    appendEdges<&Style::position>(str, "position", style);
    appendFormattedString(str, "\" ");

    if (node->hasMeasureFunc()) {
      appendFormattedString(str, "has-custom-measure=\"true\"");
    }
  }
  appendFormattedString(str, ">");

  const size_t childCount = node->getChildCount();
  if ((options & PrintOptions::Children) == PrintOptions::Children &&
      childCount > 0) {
    for (size_t i = 0; i < childCount; i++) {
      appendFormattedString(str, "\n");
      nodeToString(str, node->getChild(i), options, level + 1);
    }
    appendFormattedString(str, "\n");
    indent(str, level);
  }
  appendFormattedString(str, "</div>");
}

void print(const yoga::Node* node, PrintOptions options) {
  std::string str;
  yoga::nodeToString(str, node, options, 0);
  yoga::log(node, LogLevel::Debug, str.c_str());
}

} // namespace facebook::yoga
#endif
