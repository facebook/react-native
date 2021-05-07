/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Conv.h>
#include <folly/dynamic.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/attributedstring/primitives.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/graphics/Geometry.h>
#include <react/renderer/graphics/conversions.h>
#include <cmath>

#ifdef ANDROID
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

#include <glog/logging.h>

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

  LOG(ERROR) << "Unsupported EllipsizeMode value";
  react_native_assert(false);

  // Sane default in case of parsing errors
  return "tail";
}

inline void fromRawValue(const RawValue &value, EllipsizeMode &result) {
  react_native_assert(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "clip") {
      result = EllipsizeMode::Clip;
    } else if (string == "head") {
      result = EllipsizeMode::Head;
    } else if (string == "tail") {
      result = EllipsizeMode::Tail;
    } else if (string == "middle") {
      result = EllipsizeMode::Middle;
    } else {
      // sane default
      LOG(ERROR) << "Unsupported EllipsizeMode value: " << string;
      react_native_assert(false);
      result = EllipsizeMode::Tail;
    }
    return;
  }

  LOG(ERROR) << "Unsupported EllipsizeMode type";
  react_native_assert(false);

  // Sane default in case of parsing errors
  result = EllipsizeMode::Tail;
}

inline std::string toString(const TextBreakStrategy &textBreakStrategy) {
  switch (textBreakStrategy) {
    case TextBreakStrategy::Simple:
      return "simple";
    case TextBreakStrategy::HighQuality:
      return "highQuality";
    case TextBreakStrategy::Balanced:
      return "balanced";
  }

  LOG(ERROR) << "Unsupported TextBreakStrategy value";
  react_native_assert(false);
  return "simple";
}

inline void fromRawValue(const RawValue &value, TextBreakStrategy &result) {
  react_native_assert(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "simple") {
      result = TextBreakStrategy::Simple;
    } else if (string == "highQuality") {
      result = TextBreakStrategy::HighQuality;
    } else if (string == "balanced") {
      result = TextBreakStrategy::Balanced;
    } else {
      // sane default
      LOG(ERROR) << "Unsupported TextBreakStrategy value: " << string;
      react_native_assert(false);
      result = TextBreakStrategy::Simple;
    }
    return;
  }

  LOG(ERROR) << "Unsupported TextBreakStrategy type";
  react_native_assert(false);
  result = TextBreakStrategy::Simple;
}

inline void fromRawValue(const RawValue &value, FontWeight &result) {
  react_native_assert(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "normal") {
      result = FontWeight::Regular;
    } else if (string == "regular") {
      result = FontWeight::Regular;
    } else if (string == "bold") {
      result = FontWeight::Bold;
    } else if (string == "100") {
      result = FontWeight::Weight100;
    } else if (string == "200") {
      result = FontWeight::Weight200;
    } else if (string == "300") {
      result = FontWeight::Weight300;
    } else if (string == "400") {
      result = FontWeight::Weight400;
    } else if (string == "500") {
      result = FontWeight::Weight500;
    } else if (string == "600") {
      result = FontWeight::Weight600;
    } else if (string == "700") {
      result = FontWeight::Weight700;
    } else if (string == "800") {
      result = FontWeight::Weight800;
    } else if (string == "900") {
      result = FontWeight::Weight900;
    } else {
      LOG(ERROR) << "Unsupported FontWeight value: " << string;
      react_native_assert(false);
      // sane default for prod
      result = FontWeight::Regular;
    }
    return;
  }

  LOG(ERROR) << "Unsupported FontWeight type";
  react_native_assert(false);
  result = FontWeight::Regular;
}

inline std::string toString(const FontWeight &fontWeight) {
  return folly::to<std::string>((int)fontWeight);
}

inline void fromRawValue(const RawValue &value, FontStyle &result) {
  react_native_assert(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "normal") {
      result = FontStyle::Normal;
    } else if (string == "italic") {
      result = FontStyle::Italic;
    } else if (string == "oblique") {
      result = FontStyle::Oblique;
    } else {
      LOG(ERROR) << "Unsupported FontStyle value: " << string;
      react_native_assert(false);
      // sane default for prod
      result = FontStyle::Normal;
    }
    return;
  }

  LOG(ERROR) << "Unsupported FontStyle type";
  react_native_assert(false);
  // sane default for prod
  result = FontStyle::Normal;
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

  LOG(ERROR) << "Unsupported FontStyle value";
  react_native_assert(false);
  // sane default for prod
  return "normal";
}

inline void fromRawValue(const RawValue &value, FontVariant &result) {
  react_native_assert(value.hasType<std::vector<std::string>>());
  result = FontVariant::Default;
  if (value.hasType<std::vector<std::string>>()) {
    auto items = std::vector<std::string>{value};
    for (const auto &item : items) {
      if (item == "small-caps") {
        result = (FontVariant)((int)result | (int)FontVariant::SmallCaps);
      } else if (item == "oldstyle-nums") {
        result = (FontVariant)((int)result | (int)FontVariant::OldstyleNums);
      } else if (item == "lining-nums") {
        result = (FontVariant)((int)result | (int)FontVariant::LiningNums);
      } else if (item == "tabular-nums") {
        result = (FontVariant)((int)result | (int)FontVariant::TabularNums);
      } else if (item == "proportional-nums") {
        result =
            (FontVariant)((int)result | (int)FontVariant::ProportionalNums);
      } else {
        LOG(ERROR) << "Unsupported FontVariant value: " << item;
        react_native_assert(false);
      }
      continue;
    }
  } else {
    LOG(ERROR) << "Unsupported FontVariant type";
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
  react_native_assert(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "auto") {
      result = TextAlignment::Natural;
    } else if (string == "left") {
      result = TextAlignment::Left;
    } else if (string == "center") {
      result = TextAlignment::Center;
    } else if (string == "right") {
      result = TextAlignment::Right;
    } else if (string == "justify") {
      result = TextAlignment::Justified;
    } else {
      LOG(ERROR) << "Unsupported TextAlignment value: " << string;
      react_native_assert(false);
      // sane default for prod
      result = TextAlignment::Natural;
    }
    return;
  }

  LOG(ERROR) << "Unsupported TextAlignment type";
  // sane default for prod
  result = TextAlignment::Natural;
}

inline std::string toString(const TextAlignment &textAlignment) {
  switch (textAlignment) {
    case TextAlignment::Natural:
      return "auto";
    case TextAlignment::Left:
      return "left";
    case TextAlignment::Center:
      return "center";
    case TextAlignment::Right:
      return "right";
    case TextAlignment::Justified:
      return "justified";
  }

  LOG(ERROR) << "Unsupported TextAlignment value";
  // sane default for prod
  return "auto";
}

inline void fromRawValue(const RawValue &value, WritingDirection &result) {
  react_native_assert(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "natural" || string == "auto") {
      result = WritingDirection::Natural;
    } else if (string == "ltr") {
      result = WritingDirection::LeftToRight;
    } else if (string == "rtl") {
      result = WritingDirection::RightToLeft;
    } else {
      LOG(ERROR) << "Unsupported WritingDirection value: " << string;
      react_native_assert(false);
      // sane default for prod
      result = WritingDirection::Natural;
    }
    return;
  }

  LOG(ERROR) << "Unsupported WritingDirection type";
  // sane default for prod
  result = WritingDirection::Natural;
}

inline std::string toString(const WritingDirection &writingDirection) {
  switch (writingDirection) {
    case WritingDirection::Natural:
      return "auto";
    case WritingDirection::LeftToRight:
      return "ltr";
    case WritingDirection::RightToLeft:
      return "rtl";
  }

  LOG(ERROR) << "Unsupported WritingDirection value";
  // sane default for prod
  return "auto";
}

inline void fromRawValue(
    const RawValue &value,
    TextDecorationLineType &result) {
  react_native_assert(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "none") {
      result = TextDecorationLineType::None;
    } else if (string == "underline") {
      result = TextDecorationLineType::Underline;
    } else if (string == "strikethrough" || string == "line-through") {
      // TODO: remove "line-through" after deprecation
      result = TextDecorationLineType::Strikethrough;
    } else if (
        string == "underline-strikethrough" ||
        string == "underline line-through") {
      // TODO: remove "underline line-through" after "line-through" deprecation
      result = TextDecorationLineType::UnderlineStrikethrough;
    } else {
      LOG(ERROR) << "Unsupported TextDecorationLineType value: " << string;
      react_native_assert(false);
      // sane default for prod
      result = TextDecorationLineType::None;
    }
    return;
  }

  LOG(ERROR) << "Unsupported TextDecorationLineType type";
  // sane default for prod
  result = TextDecorationLineType::None;
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

  LOG(ERROR) << "Unsupported TextDecorationLineType value";
  react_native_assert(false);
  // sane default for prod
  return "none";
}

inline void fromRawValue(
    const RawValue &value,
    TextDecorationLineStyle &result) {
  react_native_assert(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "single") {
      result = TextDecorationLineStyle::Single;
    } else if (string == "thick") {
      result = TextDecorationLineStyle::Thick;
    } else if (string == "double") {
      result = TextDecorationLineStyle::Double;
    } else {
      LOG(ERROR) << "Unsupported TextDecorationLineStyle value: " << string;
      react_native_assert(false);
      // sane default for prod
      result = TextDecorationLineStyle::Single;
    }
    return;
  }

  LOG(ERROR) << "Unsupported TextDecorationLineStyle type";
  // sane default for prod
  result = TextDecorationLineStyle::Single;
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

  LOG(ERROR) << "Unsupported TextDecorationLineStyle value";
  react_native_assert(false);
  // sane default for prod
  return "single";
}

inline void fromRawValue(
    const RawValue &value,
    TextDecorationLinePattern &result) {
  react_native_assert(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "solid") {
      result = TextDecorationLinePattern::Solid;
    } else if (string == "dot") {
      result = TextDecorationLinePattern::Dot;
    } else if (string == "dash") {
      result = TextDecorationLinePattern::Dash;
    } else if (string == "dash-dot") {
      result = TextDecorationLinePattern::DashDot;
    } else if (string == "dash-dot-dot") {
      result = TextDecorationLinePattern::DashDotDot;
    } else {
      LOG(ERROR) << "Unsupported TextDecorationLinePattern value: " << string;
      react_native_assert(false);
      // sane default for prod
      result = TextDecorationLinePattern::Solid;
    }
    return;
  }

  LOG(ERROR) << "Unsupported TextDecorationLineStyle type";
  // sane default for prod
  result = TextDecorationLinePattern::Solid;
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

  LOG(ERROR) << "Unsupported TextDecorationLinePattern value";
  react_native_assert(false);
  // sane default for prod
  return "solid";
}

inline std::string toString(const AccessibilityRole &accessibilityRole) {
  switch (accessibilityRole) {
    case AccessibilityRole::None:
      return "none";
    case AccessibilityRole::Button:
      return "button";
    case AccessibilityRole::Link:
      return "link";
    case AccessibilityRole::Search:
      return "search";
    case AccessibilityRole::Image:
      return "image";
    case AccessibilityRole::Imagebutton:
      return "imagebutton";
    case AccessibilityRole::Keyboardkey:
      return "keyboardkey";
    case AccessibilityRole::Text:
      return "text";
    case AccessibilityRole::Adjustable:
      return "adjustable";
    case AccessibilityRole::Summary:
      return "summary";
    case AccessibilityRole::Header:
      return "header";
    case AccessibilityRole::Alert:
      return "alert";
    case AccessibilityRole::Checkbox:
      return "checkbox";
    case AccessibilityRole::Combobox:
      return "combobox";
    case AccessibilityRole::Menu:
      return "menu";
    case AccessibilityRole::Menubar:
      return "menubar";
    case AccessibilityRole::Menuitem:
      return "menuitem";
    case AccessibilityRole::Progressbar:
      return "progressbar";
    case AccessibilityRole::Radio:
      return "radio";
    case AccessibilityRole::Radiogroup:
      return "radiogroup";
    case AccessibilityRole::Scrollbar:
      return "scrollbar";
    case AccessibilityRole::Spinbutton:
      return "spinbutton";
    case AccessibilityRole::Switch:
      return "switch";
    case AccessibilityRole::Tab:
      return "tab";
    case AccessibilityRole::Tablist:
      return "tablist";
    case AccessibilityRole::Timer:
      return "timer";
    case AccessibilityRole::Toolbar:
      return "toolbar";
  }

  LOG(ERROR) << "Unsupported AccessibilityRole value";
  react_native_assert(false);
  // sane default for prod
  return "none";
}

inline void fromRawValue(const RawValue &value, AccessibilityRole &result) {
  react_native_assert(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "none") {
      result = AccessibilityRole::None;
    } else if (string == "button") {
      result = AccessibilityRole::Button;
    } else if (string == "link") {
      result = AccessibilityRole::Link;
    } else if (string == "search") {
      result = AccessibilityRole::Search;
    } else if (string == "image") {
      result = AccessibilityRole::Image;
    } else if (string == "imagebutton") {
      result = AccessibilityRole::Imagebutton;
    } else if (string == "keyboardkey") {
      result = AccessibilityRole::Keyboardkey;
    } else if (string == "text") {
      result = AccessibilityRole::Text;
    } else if (string == "adjustable") {
      result = AccessibilityRole::Adjustable;
    } else if (string == "summary") {
      result = AccessibilityRole::Summary;
    } else if (string == "header") {
      result = AccessibilityRole::Header;
    } else if (string == "alert") {
      result = AccessibilityRole::Alert;
    } else if (string == "checkbox") {
      result = AccessibilityRole::Checkbox;
    } else if (string == "combobox") {
      result = AccessibilityRole::Combobox;
    } else if (string == "menu") {
      result = AccessibilityRole::Menu;
    } else if (string == "menubar") {
      result = AccessibilityRole::Menubar;
    } else if (string == "menuitem") {
      result = AccessibilityRole::Menuitem;
    } else if (string == "progressbar") {
      result = AccessibilityRole::Progressbar;
    } else if (string == "radio") {
      result = AccessibilityRole::Radio;
    } else if (string == "radiogroup") {
      result = AccessibilityRole::Radiogroup;
    } else if (string == "scrollbar") {
      result = AccessibilityRole::Scrollbar;
    } else if (string == "spinbutton") {
      result = AccessibilityRole::Spinbutton;
    } else if (string == "switch") {
      result = AccessibilityRole::Switch;
    } else if (string == "tab") {
      result = AccessibilityRole::Tab;
    } else if (string == "tablist") {
      result = AccessibilityRole::Tablist;
    } else if (string == "timer") {
      result = AccessibilityRole::Timer;
    } else if (string == "toolbar") {
      result = AccessibilityRole::Toolbar;
    } else {
      LOG(ERROR) << "Unsupported AccessibilityRole value: " << string;
      react_native_assert(false);
      // sane default for prod
      result = AccessibilityRole::None;
    }
    return;
  }

  LOG(ERROR) << "Unsupported AccessibilityRole type";
  react_native_assert(false);
  // sane default for prod
  result = AccessibilityRole::None;
}

inline ParagraphAttributes convertRawProp(
    RawProps const &rawProps,
    ParagraphAttributes const &sourceParagraphAttributes,
    ParagraphAttributes const &defaultParagraphAttributes) {
  auto paragraphAttributes = ParagraphAttributes{};

  paragraphAttributes.maximumNumberOfLines = convertRawProp(
      rawProps,
      "numberOfLines",
      sourceParagraphAttributes.maximumNumberOfLines,
      defaultParagraphAttributes.maximumNumberOfLines);
  paragraphAttributes.ellipsizeMode = convertRawProp(
      rawProps,
      "ellipsizeMode",
      sourceParagraphAttributes.ellipsizeMode,
      defaultParagraphAttributes.ellipsizeMode);
  paragraphAttributes.textBreakStrategy = convertRawProp(
      rawProps,
      "textBreakStrategy",
      sourceParagraphAttributes.textBreakStrategy,
      defaultParagraphAttributes.textBreakStrategy);
  paragraphAttributes.adjustsFontSizeToFit = convertRawProp(
      rawProps,
      "adjustsFontSizeToFit",
      sourceParagraphAttributes.adjustsFontSizeToFit,
      defaultParagraphAttributes.adjustsFontSizeToFit);
  paragraphAttributes.minimumFontSize = convertRawProp(
      rawProps,
      "minimumFontSize",
      sourceParagraphAttributes.minimumFontSize,
      defaultParagraphAttributes.minimumFontSize);
  paragraphAttributes.maximumFontSize = convertRawProp(
      rawProps,
      "maximumFontSize",
      sourceParagraphAttributes.maximumFontSize,
      defaultParagraphAttributes.maximumFontSize);
  paragraphAttributes.includeFontPadding = convertRawProp(
      rawProps,
      "includeFontPadding",
      sourceParagraphAttributes.includeFontPadding,
      defaultParagraphAttributes.includeFontPadding);

  return paragraphAttributes;
}

inline void fromRawValue(
    RawValue const &value,
    AttributedString::Range &result) {
  auto map = (better::map<std::string, int>)value;

  auto start = map.find("start");
  if (start != map.end()) {
    result.location = start->second;
  }
  auto end = map.find("end");
  if (end != map.end()) {
    result.length = start->second - result.location;
  }
}

inline std::string toString(AttributedString::Range const &range) {
  return "{location: " + folly::to<std::string>(range.location) +
      ", length: " + folly::to<std::string>(range.length) + "}";
}

#ifdef ANDROID

inline folly::dynamic toDynamic(
    const ParagraphAttributes &paragraphAttributes) {
  auto values = folly::dynamic::object();
  values("maximumNumberOfLines", paragraphAttributes.maximumNumberOfLines);
  values("ellipsizeMode", toString(paragraphAttributes.ellipsizeMode));
  values("textBreakStrategy", toString(paragraphAttributes.textBreakStrategy));
  values("adjustsFontSizeToFit", paragraphAttributes.adjustsFontSizeToFit);
  values("includeFontPadding", paragraphAttributes.includeFontPadding);

  return values;
}

inline folly::dynamic toDynamic(const FontVariant &fontVariant) {
  auto result = folly::dynamic::array();
  if ((int)fontVariant & (int)FontVariant::SmallCaps) {
    result.push_back("small-caps");
  }
  if ((int)fontVariant & (int)FontVariant::OldstyleNums) {
    result.push_back("oldstyle-nums");
  }
  if ((int)fontVariant & (int)FontVariant::LiningNums) {
    result.push_back("lining-nums");
  }
  if ((int)fontVariant & (int)FontVariant::TabularNums) {
    result.push_back("tabular-nums");
  }
  if ((int)fontVariant & (int)FontVariant::ProportionalNums) {
    result.push_back("proportional-nums");
  }

  return result;
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
    _textAttributes("fontVariant", toDynamic(*textAttributes.fontVariant));
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
  if (textAttributes.accessibilityRole.has_value()) {
    _textAttributes(
        "accessibilityRole", toString(*textAttributes.accessibilityRole));
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
    if (fragment.isAttachment()) {
      dynamicFragment["isAttachment"] = true;
      dynamicFragment["width"] =
          fragment.parentShadowView.layoutMetrics.frame.size.width;
      dynamicFragment["height"] =
          fragment.parentShadowView.layoutMetrics.frame.size.height;
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

inline folly::dynamic toDynamic(AttributedString::Range const &range) {
  folly::dynamic dynamicValue = folly::dynamic::object();
  dynamicValue["location"] = range.location;
  dynamicValue["length"] = range.length;
  return dynamicValue;
}

// constants for AttributedString serialization
constexpr static Key AS_KEY_HASH = 0;
constexpr static Key AS_KEY_STRING = 1;
constexpr static Key AS_KEY_FRAGMENTS = 2;
constexpr static Key AS_KEY_CACHE_ID = 3;

// constants for Fragment serialization
constexpr static Key FR_KEY_STRING = 0;
constexpr static Key FR_KEY_REACT_TAG = 1;
constexpr static Key FR_KEY_IS_ATTACHMENT = 2;
constexpr static Key FR_KEY_WIDTH = 3;
constexpr static Key FR_KEY_HEIGHT = 4;
constexpr static Key FR_KEY_TEXT_ATTRIBUTES = 5;

// constants for Text Attributes serialization
constexpr static Key TA_KEY_FOREGROUND_COLOR = 0;
constexpr static Key TA_KEY_BACKGROUND_COLOR = 1;
constexpr static Key TA_KEY_OPACITY = 2;
constexpr static Key TA_KEY_FONT_FAMILY = 3;
constexpr static Key TA_KEY_FONT_SIZE = 4;
constexpr static Key TA_KEY_FONT_SIZE_MULTIPLIER = 5;
constexpr static Key TA_KEY_FONT_WEIGHT = 6;
constexpr static Key TA_KEY_FONT_STYLE = 7;
constexpr static Key TA_KEY_FONT_VARIANT = 8;
constexpr static Key TA_KEY_ALLOW_FONT_SCALING = 9;
constexpr static Key TA_KEY_LETTER_SPACING = 10;
constexpr static Key TA_KEY_LINE_HEIGHT = 11;
constexpr static Key TA_KEY_ALIGNMENT = 12;
constexpr static Key TA_KEY_BEST_WRITING_DIRECTION = 13;
constexpr static Key TA_KEY_TEXT_DECORATION_COLOR = 14;
constexpr static Key TA_KEY_TEXT_DECORATION_LINE = 15;
constexpr static Key TA_KEY_TEXT_DECORATION_LINE_STYLE = 16;
constexpr static Key TA_KEY_TEXT_DECORATION_LINE_PATTERN = 17;
constexpr static Key TA_KEY_TEXT_SHADOW_RAIDUS = 18;
constexpr static Key TA_KEY_TEXT_SHADOW_COLOR = 19;
constexpr static Key TA_KEY_IS_HIGHLIGHTED = 20;
constexpr static Key TA_KEY_LAYOUT_DIRECTION = 21;
constexpr static Key TA_KEY_ACCESSIBILITY_ROLE = 22;

// constants for ParagraphAttributes serialization
constexpr static Key PA_KEY_MAX_NUMBER_OF_LINES = 0;
constexpr static Key PA_KEY_ELLIPSIZE_MODE = 1;
constexpr static Key PA_KEY_TEXT_BREAK_STRATEGY = 2;
constexpr static Key PA_KEY_ADJUST_FONT_SIZE_TO_FIT = 3;
constexpr static Key PA_KEY_INCLUDE_FONT_PADDING = 4;

inline MapBuffer toMapBuffer(const ParagraphAttributes &paragraphAttributes) {
  auto builder = MapBufferBuilder();
  builder.putInt(
      PA_KEY_MAX_NUMBER_OF_LINES, paragraphAttributes.maximumNumberOfLines);
  builder.putString(
      PA_KEY_ELLIPSIZE_MODE, toString(paragraphAttributes.ellipsizeMode));
  builder.putString(
      PA_KEY_TEXT_BREAK_STRATEGY,
      toString(paragraphAttributes.textBreakStrategy));
  builder.putBool(
      PA_KEY_ADJUST_FONT_SIZE_TO_FIT, paragraphAttributes.adjustsFontSizeToFit);
  builder.putBool(
      PA_KEY_INCLUDE_FONT_PADDING, paragraphAttributes.includeFontPadding);

  return builder.build();
}

inline MapBuffer toMapBuffer(const FontVariant &fontVariant) {
  auto builder = MapBufferBuilder();
  int index = 0;
  if ((int)fontVariant & (int)FontVariant::SmallCaps) {
    builder.putString(index++, "small-caps");
  }
  if ((int)fontVariant & (int)FontVariant::OldstyleNums) {
    builder.putString(index++, "oldstyle-nums");
  }
  if ((int)fontVariant & (int)FontVariant::LiningNums) {
    builder.putString(index++, "lining-nums");
  }
  if ((int)fontVariant & (int)FontVariant::TabularNums) {
    builder.putString(index++, "tabular-nums");
  }
  if ((int)fontVariant & (int)FontVariant::ProportionalNums) {
    builder.putString(index++, "proportional-nums");
  }

  return builder.build();
}

inline MapBuffer toMapBuffer(const TextAttributes &textAttributes) {
  auto builder = MapBufferBuilder();
  if (textAttributes.foregroundColor) {
    builder.putInt(
        TA_KEY_FOREGROUND_COLOR, toMapBuffer(textAttributes.foregroundColor));
  }
  if (textAttributes.backgroundColor) {
    builder.putInt(
        TA_KEY_BACKGROUND_COLOR, toMapBuffer(textAttributes.backgroundColor));
  }
  if (!std::isnan(textAttributes.opacity)) {
    builder.putDouble(TA_KEY_OPACITY, textAttributes.opacity);
  }
  if (!textAttributes.fontFamily.empty()) {
    builder.putString(TA_KEY_FONT_FAMILY, textAttributes.fontFamily);
  }
  if (!std::isnan(textAttributes.fontSize)) {
    builder.putDouble(TA_KEY_FONT_SIZE, textAttributes.fontSize);
  }
  if (!std::isnan(textAttributes.fontSizeMultiplier)) {
    builder.putDouble(
        TA_KEY_FONT_SIZE_MULTIPLIER, textAttributes.fontSizeMultiplier);
  }
  if (textAttributes.fontWeight.has_value()) {
    builder.putString(TA_KEY_FONT_WEIGHT, toString(*textAttributes.fontWeight));
  }
  if (textAttributes.fontStyle.has_value()) {
    builder.putString(TA_KEY_FONT_STYLE, toString(*textAttributes.fontStyle));
  }
  if (textAttributes.fontVariant.has_value()) {
    auto fontVariantMap = toMapBuffer(*textAttributes.fontVariant);
    builder.putMapBuffer(TA_KEY_FONT_VARIANT, fontVariantMap);
  }
  if (textAttributes.allowFontScaling.has_value()) {
    builder.putBool(
        TA_KEY_ALLOW_FONT_SCALING, *textAttributes.allowFontScaling);
  }
  if (!std::isnan(textAttributes.letterSpacing)) {
    builder.putDouble(TA_KEY_LETTER_SPACING, textAttributes.letterSpacing);
  }
  if (!std::isnan(textAttributes.lineHeight)) {
    builder.putDouble(TA_KEY_LINE_HEIGHT, textAttributes.lineHeight);
  }
  if (textAttributes.alignment.has_value()) {
    builder.putString(TA_KEY_ALIGNMENT, toString(*textAttributes.alignment));
  }
  if (textAttributes.baseWritingDirection.has_value()) {
    builder.putString(
        TA_KEY_BEST_WRITING_DIRECTION,
        toString(*textAttributes.baseWritingDirection));
  }
  // Decoration
  if (textAttributes.textDecorationColor) {
    builder.putInt(
        TA_KEY_TEXT_DECORATION_COLOR,
        toMapBuffer(textAttributes.textDecorationColor));
  }
  if (textAttributes.textDecorationLineType.has_value()) {
    builder.putString(
        TA_KEY_TEXT_DECORATION_LINE,
        toString(*textAttributes.textDecorationLineType));
  }
  if (textAttributes.textDecorationLineStyle.has_value()) {
    builder.putString(
        TA_KEY_TEXT_DECORATION_LINE_STYLE,
        toString(*textAttributes.textDecorationLineStyle));
  }
  if (textAttributes.textDecorationLinePattern.has_value()) {
    builder.putString(
        TA_KEY_TEXT_DECORATION_LINE_PATTERN,
        toString(*textAttributes.textDecorationLinePattern));
  }
  // Shadow
  if (!std::isnan(textAttributes.textShadowRadius)) {
    builder.putDouble(
        TA_KEY_TEXT_SHADOW_RAIDUS, textAttributes.textShadowRadius);
  }
  if (textAttributes.textShadowColor) {
    builder.putInt(
        TA_KEY_TEXT_SHADOW_COLOR, toMapBuffer(textAttributes.textShadowColor));
  }
  // Special
  if (textAttributes.isHighlighted.has_value()) {
    builder.putBool(TA_KEY_IS_HIGHLIGHTED, *textAttributes.isHighlighted);
  }
  if (textAttributes.layoutDirection.has_value()) {
    builder.putString(
        TA_KEY_LAYOUT_DIRECTION, toString(*textAttributes.layoutDirection));
  }
  if (textAttributes.accessibilityRole.has_value()) {
    builder.putString(
        TA_KEY_ACCESSIBILITY_ROLE, toString(*textAttributes.accessibilityRole));
  }
  return builder.build();
}

inline MapBuffer toMapBuffer(const AttributedString &attributedString) {
  auto fragmentsBuilder = MapBufferBuilder();

  int index = 0;
  for (auto fragment : attributedString.getFragments()) {
    auto dynamicFragmentBuilder = MapBufferBuilder();
    dynamicFragmentBuilder.putString(FR_KEY_STRING, fragment.string);
    if (fragment.parentShadowView.componentHandle) {
      dynamicFragmentBuilder.putInt(
          FR_KEY_REACT_TAG, fragment.parentShadowView.tag);
    }
    if (fragment.isAttachment()) {
      dynamicFragmentBuilder.putBool(FR_KEY_IS_ATTACHMENT, true);
      dynamicFragmentBuilder.putDouble(
          FR_KEY_WIDTH,
          fragment.parentShadowView.layoutMetrics.frame.size.width);
      dynamicFragmentBuilder.putDouble(
          FR_KEY_HEIGHT,
          fragment.parentShadowView.layoutMetrics.frame.size.height);
    }
    auto textAttributesMap = toMapBuffer(fragment.textAttributes);
    dynamicFragmentBuilder.putMapBuffer(
        FR_KEY_TEXT_ATTRIBUTES, textAttributesMap);
    auto dynamicFragmentMap = dynamicFragmentBuilder.build();
    fragmentsBuilder.putMapBuffer(index++, dynamicFragmentMap);
  }

  auto builder = MapBufferBuilder();
  builder.putInt(
      AS_KEY_HASH,
      std::hash<facebook::react::AttributedString>{}(attributedString));
  builder.putString(AS_KEY_STRING, attributedString.getString());
  auto fragmentsMap = fragmentsBuilder.build();
  builder.putMapBuffer(AS_KEY_FRAGMENTS, fragmentsMap);
  return builder.build();
}

#endif

} // namespace react
} // namespace facebook
