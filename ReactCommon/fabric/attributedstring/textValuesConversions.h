/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fabric/attributedstring/TextPrimitives.h>
#include <fabric/graphics/Geometry.h>
#include <folly/dynamic.h>

namespace facebook {
namespace react {

inline std::string stringFromEllipsizeMode(const EllipsizeMode &ellipsisMode) {
  switch (ellipsisMode) {
    case EllipsizeMode::Clip: return "clip";
    case EllipsizeMode::Head: return "head";
    case EllipsizeMode::Tail: return "tail";
    case EllipsizeMode::Middle: return "middle";
  }
}

inline EllipsizeMode ellipsizeModeFromDynamic(const folly::dynamic &value) {
  auto string = value.getString();
  if (string == "clip") { return EllipsizeMode::Clip; }
  if (string == "head") { return EllipsizeMode::Head; }
  if (string == "tail") { return EllipsizeMode::Tail; }
  if (string == "middle") { return EllipsizeMode::Middle; }
  abort();
}

inline FontWeight fontWeightFromDynamic(const folly::dynamic &value) {
  auto string = value.asString();
  if (string == "normal") { return FontWeight::Regular; }
  if (string == "regular") { return FontWeight::Regular; }
  if (string == "bold") { return FontWeight::Bold; }
  if (string == "100") { return FontWeight::Weight100; }
  if (string == "200") { return FontWeight::Weight200; }
  if (string == "300") { return FontWeight::Weight300; }
  if (string == "400") { return FontWeight::Weight400; }
  if (string == "500") { return FontWeight::Weight500; }
  if (string == "600") { return FontWeight::Weight600; }
  if (string == "700") { return FontWeight::Weight700; }
  if (string == "800") { return FontWeight::Weight800; }
  if (string == "900") { return FontWeight::Weight900; }
  abort();
}

inline std::string stringFromFontWeight(const FontWeight &fontWeight) {
  return std::to_string((int)fontWeight);
}

inline FontStyle fontStyleFromDynamic(const folly::dynamic &value) {
  auto string = value.asString();
  if (string == "normal") { return FontStyle::Normal; }
  if (string == "italic") { return FontStyle::Italic; }
  if (string == "oblique") { return FontStyle::Oblique; }
  abort();
}

inline std::string stringFromFontStyle(const FontStyle &fontStyle) {
  switch (fontStyle) {
    case FontStyle::Normal: return "normal";
    case FontStyle::Italic: return "italic";
    case FontStyle::Oblique: return "oblique";
  }
}

inline FontVariant fontVariantFromDynamic(const folly::dynamic &value) {
  assert(value.isArray());
  FontVariant fontVariant = FontVariant::Default;
  for (auto &&item : value) {
    auto string = item.asString();
    if (string == "small-caps") { fontVariant = (FontVariant)((int)fontVariant | (int)FontVariant::SmallCaps); continue; }
    if (string == "oldstyle-nums") { fontVariant = (FontVariant)((int)fontVariant | (int)FontVariant::OldstyleNums); continue; }
    if (string == "lining-nums") { fontVariant = (FontVariant)((int)fontVariant | (int)FontVariant::LiningNums); continue; }
    if (string == "tabular-nums") { fontVariant = (FontVariant)((int)fontVariant | (int)FontVariant::TabularNums); continue; }
    if (string == "proportional-nums") { fontVariant = (FontVariant)((int)fontVariant | (int)FontVariant::ProportionalNums); continue; }
  }
  return fontVariant;
}

inline TextAlignment textAlignmentFromDynamic(const folly::dynamic &value) {
  auto string = value.asString();
  if (string == "natural") { return TextAlignment::Natural; }
  if (string == "left") { return TextAlignment::Left; }
  if (string == "center") { return TextAlignment::Center; }
  if (string == "right") { return TextAlignment::Right; }
  if (string == "justified") { return TextAlignment::Justified; }
  abort();
}

inline WritingDirection writingDirectionFromDynamic(const folly::dynamic &value) {
  auto string = value.asString();
  if (string == "natural") { return WritingDirection::Natural; }
  if (string == "ltr") { return WritingDirection::LeftToRight; }
  if (string == "rtl") { return WritingDirection::RightToLeft; }
  abort();
}

inline TextDecorationLineType textDecorationLineTypeFromDynamic(const folly::dynamic &value) {
  auto string = value.asString();
  if (string == "none") { return TextDecorationLineType::None; }
  if (string == "underline") { return TextDecorationLineType::Underline; }
  if (string == "strikethrough") { return TextDecorationLineType::Strikethrough; }
  if (string == "underline-strikethrough") { return TextDecorationLineType::UnderlineStrikethrough; }
  abort();
}

inline TextDecorationLineStyle textDecorationLineStyleFromDynamic(const folly::dynamic &value) {
  auto string = value.asString();
  if (string == "single") { return TextDecorationLineStyle::Single; }
  if (string == "thick") { return TextDecorationLineStyle::Thick; }
  if (string == "double") { return TextDecorationLineStyle::Double; }
  abort();
}

inline TextDecorationLinePattern textDecorationLinePatternFromDynamic(const folly::dynamic &value) {
  auto string = value.asString();
  if (string == "solid") { return TextDecorationLinePattern::Solid; }
  if (string == "dot") { return TextDecorationLinePattern::Dot; }
  if (string == "dash") { return TextDecorationLinePattern::Dash; }
  if (string == "dash-dot") { return TextDecorationLinePattern::DashDot; }
  if (string == "dash-dot-dot") { return TextDecorationLinePattern::DashDotDot; }
  abort();
}

} // namespace react
} // namespace facebook
