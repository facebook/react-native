/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/attributedstring/AttributedString.h>
#include <react/attributedstring/ParagraphAttributes.h>
#include <react/attributedstring/TextAttributes.h>
#include <react/attributedstring/conversions.h>
#include <react/attributedstring/primitives.h>
#include <react/core/LayoutableShadowNode.h>
#include <react/core/ShadowNode.h>
#include <react/core/conversions.h>
#include <react/graphics/Geometry.h>
#include <react/graphics/conversions.h>
#include <cmath>

namespace facebook {
namespace react {

inline std::string toString(const EllipsizeMode &ellipsisMode) {
  switch (ellipsisMode) {
    case EllipsizeMode::Clip:
      return "clip";
    case EllipsizeMode::Head:
      return "head";
    case EllipsizeMode::Tail:
      return "tail";
    case EllipsizeMode::Middle:
      return "middle";
  }
}

inline void fromRawValue(const RawValue &value, EllipsizeMode &result) {
  auto string = (std::string)value;
  if (string == "clip") {
    result = EllipsizeMode::Clip;
    return;
  }
  if (string == "head") {
    result = EllipsizeMode::Head;
    return;
  }
  if (string == "tail") {
    result = EllipsizeMode::Tail;
    return;
  }
  if (string == "middle") {
    result = EllipsizeMode::Middle;
    return;
  }
  abort();
}

inline void fromRawValue(const RawValue &value, FontWeight &result) {
  auto string = (std::string)value;
  if (string == "normal") {
    result = FontWeight::Regular;
    return;
  }
  if (string == "regular") {
    result = FontWeight::Regular;
    return;
  }
  if (string == "bold") {
    result = FontWeight::Bold;
    return;
  }
  if (string == "100") {
    result = FontWeight::Weight100;
    return;
  }
  if (string == "200") {
    result = FontWeight::Weight200;
    return;
  }
  if (string == "300") {
    result = FontWeight::Weight300;
    return;
  }
  if (string == "400") {
    result = FontWeight::Weight400;
    return;
  }
  if (string == "500") {
    result = FontWeight::Weight500;
    return;
  }
  if (string == "600") {
    result = FontWeight::Weight600;
    return;
  }
  if (string == "700") {
    result = FontWeight::Weight700;
    return;
  }
  if (string == "800") {
    result = FontWeight::Weight800;
    return;
  }
  if (string == "900") {
    result = FontWeight::Weight900;
    return;
  }
  abort();
}

inline std::string toString(const FontWeight &fontWeight) {
  return folly::to<std::string>((int)fontWeight);
}

inline void fromRawValue(const RawValue &value, FontStyle &result) {
  auto string = (std::string)value;
  if (string == "normal") {
    result = FontStyle::Normal;
    return;
  }
  if (string == "italic") {
    result = FontStyle::Italic;
    return;
  }
  if (string == "oblique") {
    result = FontStyle::Oblique;
    return;
  }
  abort();
}

inline std::string toString(const FontStyle &fontStyle) {
  switch (fontStyle) {
    case FontStyle::Normal:
      return "normal";
    case FontStyle::Italic:
      return "italic";
    case FontStyle::Oblique:
      return "oblique";
  }
}

inline void fromRawValue(const RawValue &value, FontVariant &result) {
  assert(value.hasType<std::vector<std::string>>());
  result = FontVariant::Default;
  auto items = std::vector<std::string>{value};
  for (const auto &item : items) {
    if (item == "small-caps") {
      result = (FontVariant)((int)result | (int)FontVariant::SmallCaps);
      continue;
    }
    if (item == "oldstyle-nums") {
      result = (FontVariant)((int)result | (int)FontVariant::OldstyleNums);
      continue;
    }
    if (item == "lining-nums") {
      result = (FontVariant)((int)result | (int)FontVariant::LiningNums);
      continue;
    }
    if (item == "tabular-nums") {
      result = (FontVariant)((int)result | (int)FontVariant::TabularNums);
      continue;
    }
    if (item == "proportional-nums") {
      result = (FontVariant)((int)result | (int)FontVariant::ProportionalNums);
      continue;
    }
  }
}

inline std::string toString(const FontVariant &fontVariant) {
  auto result = std::string{};
  auto separator = std::string{", "};
  if ((int)fontVariant & (int)FontVariant::SmallCaps) {
    result += "small-caps" + separator;
  }
  if ((int)fontVariant & (int)FontVariant::OldstyleNums) {
    result += "oldstyle-nums" + separator;
  }
  if ((int)fontVariant & (int)FontVariant::LiningNums) {
    result += "lining-nums" + separator;
  }
  if ((int)fontVariant & (int)FontVariant::TabularNums) {
    result += "tabular-nums" + separator;
  }
  if ((int)fontVariant & (int)FontVariant::ProportionalNums) {
    result += "proportional-nums" + separator;
  }

  if (!result.empty()) {
    result.erase(result.length() - separator.length());
  }

  return result;
}

inline void fromRawValue(const RawValue &value, TextAlignment &result) {
  auto string = (std::string)value;
  if (string == "natural") {
    result = TextAlignment::Natural;
    return;
  }
  if (string == "left") {
    result = TextAlignment::Left;
    return;
  }
  if (string == "center") {
    result = TextAlignment::Center;
    return;
  }
  if (string == "right") {
    result = TextAlignment::Right;
    return;
  }
  if (string == "justified") {
    result = TextAlignment::Justified;
    return;
  }
  abort();
}

inline std::string toString(const TextAlignment &textAlignment) {
  switch (textAlignment) {
    case TextAlignment::Natural:
      return "natural";
    case TextAlignment::Left:
      return "left";
    case TextAlignment::Center:
      return "center";
    case TextAlignment::Right:
      return "right";
    case TextAlignment::Justified:
      return "justified";
  }
}

inline void fromRawValue(const RawValue &value, WritingDirection &result) {
  auto string = (std::string)value;
  if (string == "natural") {
    result = WritingDirection::Natural;
    return;
  }
  if (string == "ltr") {
    result = WritingDirection::LeftToRight;
    return;
  }
  if (string == "rtl") {
    result = WritingDirection::RightToLeft;
    return;
  }
  abort();
}

inline std::string toString(const WritingDirection &writingDirection) {
  switch (writingDirection) {
    case WritingDirection::Natural:
      return "natural";
    case WritingDirection::LeftToRight:
      return "ltr";
    case WritingDirection::RightToLeft:
      return "rtl";
  }
}

inline void fromRawValue(
    const RawValue &value,
    TextDecorationLineType &result) {
  auto string = (std::string)value;
  if (string == "none") {
    result = TextDecorationLineType::None;
    return;
  }
  if (string == "underline") {
    result = TextDecorationLineType::Underline;
    return;
  }
  if (string == "strikethrough") {
    result = TextDecorationLineType::Strikethrough;
    return;
  }
  if (string == "underline-strikethrough") {
    result = TextDecorationLineType::UnderlineStrikethrough;
    return;
  }
  abort();
}

inline std::string toString(
    const TextDecorationLineType &textDecorationLineType) {
  switch (textDecorationLineType) {
    case TextDecorationLineType::None:
      return "none";
    case TextDecorationLineType::Underline:
      return "underline";
    case TextDecorationLineType::Strikethrough:
      return "strikethrough";
    case TextDecorationLineType::UnderlineStrikethrough:
      return "underline-strikethrough";
  }
}

inline void fromRawValue(
    const RawValue &value,
    TextDecorationLineStyle &result) {
  auto string = (std::string)value;
  if (string == "single") {
    result = TextDecorationLineStyle::Single;
    return;
  }
  if (string == "thick") {
    result = TextDecorationLineStyle::Thick;
    return;
  }
  if (string == "double") {
    result = TextDecorationLineStyle::Double;
    return;
  }
  abort();
}

inline std::string toString(
    const TextDecorationLineStyle &textDecorationLineStyle) {
  switch (textDecorationLineStyle) {
    case TextDecorationLineStyle::Single:
      return "single";
    case TextDecorationLineStyle::Thick:
      return "thick";
    case TextDecorationLineStyle::Double:
      return "double";
  }
}

inline void fromRawValue(
    const RawValue &value,
    TextDecorationLinePattern &result) {
  auto string = (std::string)value;
  if (string == "solid") {
    result = TextDecorationLinePattern::Solid;
    return;
  }
  if (string == "dot") {
    result = TextDecorationLinePattern::Dot;
    return;
  }
  if (string == "dash") {
    result = TextDecorationLinePattern::Dash;
    return;
  }
  if (string == "dash-dot") {
    result = TextDecorationLinePattern::DashDot;
    return;
  }
  if (string == "dash-dot-dot") {
    result = TextDecorationLinePattern::DashDotDot;
    return;
  }
  abort();
}

inline std::string toString(
    const TextDecorationLinePattern &textDecorationLinePattern) {
  switch (textDecorationLinePattern) {
    case TextDecorationLinePattern::Solid:
      return "solid";
    case TextDecorationLinePattern::Dot:
      return "dot";
    case TextDecorationLinePattern::Dash:
      return "dash";
    case TextDecorationLinePattern::DashDot:
      return "dash-dot";
    case TextDecorationLinePattern::DashDotDot:
      return "dash-dot-dot";
  }
}

#ifdef ANDROID

inline folly::dynamic toDynamic(
    const ParagraphAttributes &paragraphAttributes) {
  auto values = folly::dynamic::object();
  values("maximumNumberOfLines", paragraphAttributes.maximumNumberOfLines);
  values("ellipsizeMode", toString(paragraphAttributes.ellipsizeMode));
  values("adjustsFontSizeToFit", paragraphAttributes.adjustsFontSizeToFit);
  return values;
}

inline folly::dynamic toDynamic(const TextAttributes &textAttributes) {
  auto _textAttributes = folly::dynamic::object();
  if (textAttributes.foregroundColor) {
    _textAttributes(
        "foregroundColor", toDynamic(textAttributes.foregroundColor));
  }
  if (textAttributes.backgroundColor) {
    _textAttributes(
        "backgroundColor", toDynamic(textAttributes.backgroundColor));
  }
  if (!std::isnan(textAttributes.opacity)) {
    _textAttributes("opacity", textAttributes.opacity);
  }
  if (!textAttributes.fontFamily.empty()) {
    _textAttributes("fontFamily", textAttributes.fontFamily);
  }
  if (!std::isnan(textAttributes.fontSize)) {
    _textAttributes("fontSize", textAttributes.fontSize);
  }
  if (!std::isnan(textAttributes.fontSizeMultiplier)) {
    _textAttributes("fontSizeMultiplier", textAttributes.fontSizeMultiplier);
  }
  if (textAttributes.fontWeight.has_value()) {
    _textAttributes("fontWeight", toString(*textAttributes.fontWeight));
  }
  if (textAttributes.fontStyle.has_value()) {
    _textAttributes("fontStyle", toString(*textAttributes.fontStyle));
  }
  if (textAttributes.fontVariant.has_value()) {
    _textAttributes("fontVariant", toString(*textAttributes.fontVariant));
  }
  if (textAttributes.allowFontScaling.has_value()) {
    _textAttributes("allowFontScaling", *textAttributes.allowFontScaling);
  }
  if (!std::isnan(textAttributes.letterSpacing)) {
    _textAttributes("letterSpacing", textAttributes.letterSpacing);
  }
  if (!std::isnan(textAttributes.lineHeight)) {
    _textAttributes("lineHeight", textAttributes.lineHeight);
  }
  if (textAttributes.alignment.has_value()) {
    _textAttributes("alignment", toString(*textAttributes.alignment));
  }
  if (textAttributes.baseWritingDirection.has_value()) {
    _textAttributes(
        "baseWritingDirection", toString(*textAttributes.baseWritingDirection));
  }
  // Decoration
  if (textAttributes.textDecorationColor) {
    _textAttributes(
        "textDecorationColor", toDynamic(textAttributes.textDecorationColor));
  }
  if (textAttributes.textDecorationLineType.has_value()) {
    _textAttributes(
        "textDecorationLine", toString(*textAttributes.textDecorationLineType));
  }
  if (textAttributes.textDecorationLineStyle.has_value()) {
    _textAttributes(
        "textDecorationLineStyle",
        toString(*textAttributes.textDecorationLineStyle));
  }
  if (textAttributes.textDecorationLinePattern.has_value()) {
    _textAttributes(
        "textDecorationLinePattern",
        toString(*textAttributes.textDecorationLinePattern));
  }
  // Shadow
  // textShadowOffset = textAttributes.textShadowOffset.has_value() ?
  // textAttributes.textShadowOffset.value() : textShadowOffset;
  if (!std::isnan(textAttributes.textShadowRadius)) {
    _textAttributes("textShadowRadius", textAttributes.textShadowRadius);
  }
  if (textAttributes.textShadowColor) {
    _textAttributes(
        "textShadowColor", toDynamic(textAttributes.textShadowColor));
  }
  // Special
  if (textAttributes.isHighlighted.has_value()) {
    _textAttributes("isHighlighted", *textAttributes.isHighlighted);
  }
  if (textAttributes.layoutDirection.has_value()) {
    _textAttributes(
        "layoutDirection", toString(*textAttributes.layoutDirection));
  }
  return _textAttributes;
}

inline folly::dynamic toDynamic(const AttributedString &attributedString) {
  auto value = folly::dynamic::object();
  auto fragments = folly::dynamic::array();
  for (auto fragment : attributedString.getFragments()) {
    folly::dynamic dynamicFragment = folly::dynamic::object();
    dynamicFragment["string"] = fragment.string;
    if (fragment.parentShadowView.componentHandle) {
      dynamicFragment["reactTag"] = fragment.parentShadowView.tag;
    }
    dynamicFragment["textAttributes"] = toDynamic(fragment.textAttributes);
    fragments.push_back(dynamicFragment);
  }
  value("fragments", fragments);
  value(
      "hash", std::hash<facebook::react::AttributedString>{}(attributedString));
  value("string", attributedString.getString());
  return value;
}

#endif

} // namespace react
} // namespace facebook
