/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/attributedstring/primitives.h>
#include <fabric/graphics/Geometry.h>
#include <folly/dynamic.h>

namespace facebook {
namespace react {

inline std::string toString(const EllipsizeMode &ellipsisMode) {
  switch (ellipsisMode) {
    case EllipsizeMode::Clip: return "clip";
    case EllipsizeMode::Head: return "head";
    case EllipsizeMode::Tail: return "tail";
    case EllipsizeMode::Middle: return "middle";
  }
}

inline void fromDynamic(const folly::dynamic &value, EllipsizeMode &result) {
  auto string = value.getString();
  if (string == "clip") { result = EllipsizeMode::Clip; return; }
  if (string == "head") { result = EllipsizeMode::Head; return; }
  if (string == "tail") { result = EllipsizeMode::Tail; return; }
  if (string == "middle") { result = EllipsizeMode::Middle; return; }
  abort();
}

inline void fromDynamic(const folly::dynamic &value, FontWeight &result) {
  auto string = value.asString();
  if (string == "normal") { result = FontWeight::Regular; return; }
  if (string == "regular") { result = FontWeight::Regular; return; }
  if (string == "bold") { result = FontWeight::Bold; return; }
  if (string == "100") { result = FontWeight::Weight100; return; }
  if (string == "200") { result = FontWeight::Weight200; return; }
  if (string == "300") { result = FontWeight::Weight300; return; }
  if (string == "400") { result = FontWeight::Weight400; return; }
  if (string == "500") { result = FontWeight::Weight500; return; }
  if (string == "600") { result = FontWeight::Weight600; return; }
  if (string == "700") { result = FontWeight::Weight700; return; }
  if (string == "800") { result = FontWeight::Weight800; return; }
  if (string == "900") { result = FontWeight::Weight900; return; }
  abort();
}

inline std::string toString(const FontWeight &fontWeight) {
  return std::to_string((int)fontWeight);
}

inline void fromDynamic(const folly::dynamic &value, FontStyle &result) {
  auto string = value.asString();
  if (string == "normal") { result = FontStyle::Normal; return; }
  if (string == "italic") { result = FontStyle::Italic; return; }
  if (string == "oblique") { result = FontStyle::Oblique; return; }
  abort();
}

inline std::string toString(const FontStyle &fontStyle) {
  switch (fontStyle) {
    case FontStyle::Normal: return "normal";
    case FontStyle::Italic: return "italic";
    case FontStyle::Oblique: return "oblique";
  }
}

inline void fromDynamic(const folly::dynamic &value, FontVariant &result) {
  assert(value.isArray());
  result = FontVariant::Default;
  for (auto &&item : value) {
    auto string = item.asString();
    if (string == "small-caps") { result = (FontVariant)((int)result | (int)FontVariant::SmallCaps); continue; }
    if (string == "oldstyle-nums") { result = (FontVariant)((int)result | (int)FontVariant::OldstyleNums); continue; }
    if (string == "lining-nums") { result = (FontVariant)((int)result | (int)FontVariant::LiningNums); continue; }
    if (string == "tabular-nums") { result = (FontVariant)((int)result | (int)FontVariant::TabularNums); continue; }
    if (string == "proportional-nums") { result = (FontVariant)((int)result | (int)FontVariant::ProportionalNums); continue; }
  }
}

inline std::string toString(const FontVariant &fontVariant) {
  std::string result;
  std::string separator = ", ";
  if ((int)fontVariant & (int)FontVariant::SmallCaps) { result += "small-caps" + separator; }
  if ((int)fontVariant & (int)FontVariant::OldstyleNums) { result += "oldstyle-nums" + separator; }
  if ((int)fontVariant & (int)FontVariant::LiningNums) { result += "lining-nums" + separator; }
  if ((int)fontVariant & (int)FontVariant::TabularNums) { result += "tabular-nums" + separator; }
  if ((int)fontVariant & (int)FontVariant::ProportionalNums) { result += "proportional-nums" + separator; }

  if (!result.empty()) {
    result.erase(result.length() - separator.length());
  }

  return result;
}

inline void fromDynamic(const folly::dynamic &value, TextAlignment &result) {
  auto string = value.asString();
  if (string == "natural") { result = TextAlignment::Natural; return; }
  if (string == "left") { result = TextAlignment::Left; return; }
  if (string == "center") { result = TextAlignment::Center; return; }
  if (string == "right") { result = TextAlignment::Right; return; }
  if (string == "justified") { result = TextAlignment::Justified; return; }
  abort();
}

inline std::string toString(const TextAlignment &textAlignment) {
  switch (textAlignment) {
    case TextAlignment::Natural: return "natural";
    case TextAlignment::Left: return "left";
    case TextAlignment::Center: return "center";
    case TextAlignment::Right: return "right";
    case TextAlignment::Justified: return "justified";
  }
}

inline void fromDynamic(const folly::dynamic &value, WritingDirection &result) {
  auto string = value.asString();
  if (string == "natural") { result = WritingDirection::Natural; return; }
  if (string == "ltr") { result = WritingDirection::LeftToRight; return; }
  if (string == "rtl") { result = WritingDirection::RightToLeft; return; }
  abort();
}

inline std::string toString(const WritingDirection &writingDirection) {
  switch (writingDirection) {
    case WritingDirection::Natural: return "natural";
    case WritingDirection::LeftToRight: return "ltr";
    case WritingDirection::RightToLeft: return "rtl";
  }
}

inline void fromDynamic(const folly::dynamic &value, TextDecorationLineType &result) {
  auto string = value.asString();
  if (string == "none") { result = TextDecorationLineType::None; return; }
  if (string == "underline") { result = TextDecorationLineType::Underline; return; }
  if (string == "strikethrough") { result = TextDecorationLineType::Strikethrough; return; }
  if (string == "underline-strikethrough") { result = TextDecorationLineType::UnderlineStrikethrough; return; }
  abort();
}

inline std::string toString(const TextDecorationLineType &textDecorationLineType) {
  switch (textDecorationLineType) {
    case TextDecorationLineType::None: return "none";
    case TextDecorationLineType::Underline: return "underline";
    case TextDecorationLineType::Strikethrough: return "strikethrough";
    case TextDecorationLineType::UnderlineStrikethrough: return "underline-strikethrough";
  }
}

inline void fromDynamic(const folly::dynamic &value, TextDecorationLineStyle &result) {
  auto string = value.asString();
  if (string == "single") { result = TextDecorationLineStyle::Single; return; }
  if (string == "thick") { result = TextDecorationLineStyle::Thick; return; }
  if (string == "double") { result = TextDecorationLineStyle::Double; return; }
  abort();
}

inline std::string toString(const TextDecorationLineStyle &textDecorationLineStyle) {
  switch (textDecorationLineStyle) {
    case TextDecorationLineStyle::Single: return "single";
    case TextDecorationLineStyle::Thick: return "thick";
    case TextDecorationLineStyle::Double: return "double";
  }
}

inline void fromDynamic(const folly::dynamic &value, TextDecorationLinePattern &result) {
  auto string = value.asString();
  if (string == "solid") { result = TextDecorationLinePattern::Solid; return; }
  if (string == "dot") { result = TextDecorationLinePattern::Dot; return; }
  if (string == "dash") { result = TextDecorationLinePattern::Dash; return; }
  if (string == "dash-dot") { result = TextDecorationLinePattern::DashDot; return; }
  if (string == "dash-dot-dot") { result = TextDecorationLinePattern::DashDotDot; return; }
  abort();
}

inline std::string toString(const TextDecorationLinePattern &textDecorationLinePattern) {
  switch (textDecorationLinePattern) {
    case TextDecorationLinePattern::Solid: return "solid";
    case TextDecorationLinePattern::Dot: return "dot";
    case TextDecorationLinePattern::Dash: return "dash";
    case TextDecorationLinePattern::DashDot: return "dash-dot";
    case TextDecorationLinePattern::DashDotDot: return "dash-dot-dot";
  }
}

} // namespace react
} // namespace facebook
