/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef DEBUG

#include <stdarg.h>

#include <nlohmann/json.hpp>
#include <yoga/debug/Log.h>
#include <yoga/debug/NodeToString.h>
#include <yoga/numeric/Comparison.h>

namespace facebook::yoga {

using namespace nlohmann;

static void appendFloatOptionalIfDefined(
    json& j,
    const std::string key,
    const FloatOptional num) {
  if (num.isDefined()) {
    j["style"][key] = num.unwrap();
  }
}

static void appendNumberIfNotUndefined(
    json& j,
    const std::string key,
    const Style::Length& number) {
  if (number.unit() != Unit::Undefined) {
    if (number.unit() == Unit::Auto) {
      j["style"][key] = "auto";
    } else {
      std::string unit = number.unit() == Unit::Point ? "px" : "%%";
      j["style"][key]["value"] = number.value().unwrap();
      j["style"][key]["unit"] = unit;
    }
  }
}

static void appendNumberIfNotAuto(
    json& j,
    const std::string& key,
    const Style::Length& number) {
  if (number.unit() != Unit::Auto) {
    appendNumberIfNotUndefined(j, key, number);
  }
}

static void appendNumberIfNotZero(
    json& j,
    const std::string& str,
    const Style::Length& number) {
  if (number.unit() == Unit::Auto) {
    j["style"][str] = "auto";
  } else if (!yoga::inexactEquals(number.value().unwrap(), 0)) {
    appendNumberIfNotUndefined(j, str, number);
  }
}

template <auto Field>
static void appendEdges(json& j, const std::string& key, const Style& style) {
  for (auto edge : ordinals<Edge>()) {
    std::string str = key + "-" + toString(edge);
    appendNumberIfNotZero(j, str, (style.*Field)(edge));
  }
}

static void
nodeToStringImpl(json& j, const yoga::Node* node, PrintOptions options) {
  if ((options & PrintOptions::Layout) == PrintOptions::Layout) {
    j["layout"]["width"] = node->getLayout().dimension(Dimension::Width);
    j["layout"]["height"] = node->getLayout().dimension(Dimension::Height);
    j["layout"]["top"] = node->getLayout().position(PhysicalEdge::Top);
    j["layout"]["left"] = node->getLayout().position(PhysicalEdge::Top);
  }

  if ((options & PrintOptions::Style) == PrintOptions::Style) {
    const auto& style = node->style();
    if (style.flexDirection() != yoga::Style{}.flexDirection()) {
      j["style"]["flex-direction"] = toString(style.flexDirection());
    }
    if (style.justifyContent() != yoga::Style{}.justifyContent()) {
      j["style"]["justify-content"] = toString(style.justifyContent());
    }
    if (style.alignItems() != yoga::Style{}.alignItems()) {
      j["style"]["align-items"] = toString(style.alignItems());
    }
    if (style.alignContent() != yoga::Style{}.alignContent()) {
      j["style"]["align-content"] = toString(style.alignContent());
    }
    if (style.alignSelf() != yoga::Style{}.alignSelf()) {
      j["style"]["align-self"] = toString(style.alignSelf());
    }
    if (style.flexWrap() != yoga::Style{}.flexWrap()) {
      j["style"]["flex-wrap"] = toString(style.flexWrap());
    }
    if (style.overflow() != yoga::Style{}.overflow()) {
      j["style"]["overflow"] = toString(style.overflow());
    }
    if (style.display() != yoga::Style{}.display()) {
      j["style"]["display"] = toString(style.display());
    }
    if (style.positionType() != yoga::Style{}.positionType()) {
      j["style"]["position-type"] = toString(style.positionType());
    }

    appendFloatOptionalIfDefined(j, "flex-grow", style.flexGrow());
    appendFloatOptionalIfDefined(j, "flex-shrink", style.flexShrink());
    appendFloatOptionalIfDefined(j, "flex", style.flex());
    appendNumberIfNotAuto(j, "flex-basis", style.flexBasis());

    appendEdges<&Style::margin>(j, "margin", style);
    appendEdges<&Style::padding>(j, "padding", style);
    appendEdges<&Style::border>(j, "border", style);
    appendEdges<&Style::position>(j, "position", style);

    if (style.gap(Gutter::All).isDefined()) {
      appendNumberIfNotUndefined(j, "gap", style.gap(Gutter::All));
    } else {
      appendNumberIfNotUndefined(j, "column-gap", style.gap(Gutter::Column));
      appendNumberIfNotUndefined(j, "row-gap", style.gap(Gutter::Row));
    }

    appendNumberIfNotAuto(j, "width", style.dimension(Dimension::Width));
    appendNumberIfNotAuto(j, "height", style.dimension(Dimension::Height));
    appendNumberIfNotAuto(j, "max-width", style.maxDimension(Dimension::Width));
    appendNumberIfNotAuto(
        j, "max-height", style.maxDimension(Dimension::Height));
    appendNumberIfNotAuto(j, "min-width", style.minDimension(Dimension::Width));
    appendNumberIfNotAuto(
        j, "min-height", style.minDimension(Dimension::Height));

    if (node->hasMeasureFunc()) {
      j["style"]["has-custom-measure"] = true;
    }
  }

  const size_t childCount = node->getChildCount();
  if ((options & PrintOptions::Children) == PrintOptions::Children &&
      childCount > 0) {
    for (size_t i = 0; i < childCount; i++) {
      j["children"].push_back({});
      nodeToStringImpl(j["children"][i], node->getChild(i), options);
    }
  }
}

void nodeToString(
    std::string& str,
    const yoga::Node* node,
    PrintOptions options) {
  json j;
  nodeToStringImpl(j, node, options);
  str = j.dump(2);
}

void print(const yoga::Node* node, PrintOptions options) {
  std::string str;
  yoga::nodeToString(str, node, options);
  yoga::log(node, LogLevel::Debug, str.c_str());
}

} // namespace facebook::yoga
#endif
