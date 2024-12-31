/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Conv.h>
#include <folly/dynamic.h>
#include <react/debug/react_native_expect.h>
#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/attributedstring/TextAttributes.h>
#include <react/renderer/attributedstring/conversions.h>
#include <react/renderer/attributedstring/primitives.h>
#include <react/renderer/components/view/accessibilityPropsConversions.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <cmath>
#include <unordered_map>

#ifdef ANDROID
#include <react/renderer/mapbuffer/MapBuffer.h>
#include <react/renderer/mapbuffer/MapBufferBuilder.h>
#endif

#include <glog/logging.h>

namespace facebook::react {

inline std::string toString(const DynamicTypeRamp& dynamicTypeRamp) {
  switch (dynamicTypeRamp) {
    case DynamicTypeRamp::Caption2:
      return "caption2";
    case DynamicTypeRamp::Caption1:
      return "caption1";
    case DynamicTypeRamp::Footnote:
      return "footnote";
    case DynamicTypeRamp::Subheadline:
      return "subheadline";
    case DynamicTypeRamp::Callout:
      return "callout";
    case DynamicTypeRamp::Body:
      return "body";
    case DynamicTypeRamp::Headline:
      return "headline";
    case DynamicTypeRamp::Title3:
      return "title3";
    case DynamicTypeRamp::Title2:
      return "title2";
    case DynamicTypeRamp::Title1:
      return "title1";
    case DynamicTypeRamp::LargeTitle:
      return "largeTitle";
  }

  LOG(ERROR) << "Unsupported DynamicTypeRamp value";
  react_native_expect(false);

  // Sane default in case of parsing errors
  return "body";
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    DynamicTypeRamp& result) {
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "caption2") {
      result = DynamicTypeRamp::Caption2;
    } else if (string == "caption1") {
      result = DynamicTypeRamp::Caption1;
    } else if (string == "footnote") {
      result = DynamicTypeRamp::Footnote;
    } else if (string == "subheadline") {
      result = DynamicTypeRamp::Subheadline;
    } else if (string == "callout") {
      result = DynamicTypeRamp::Callout;
    } else if (string == "body") {
      result = DynamicTypeRamp::Body;
    } else if (string == "headline") {
      result = DynamicTypeRamp::Headline;
    } else if (string == "title3") {
      result = DynamicTypeRamp::Title3;
    } else if (string == "title2") {
      result = DynamicTypeRamp::Title2;
    } else if (string == "title1") {
      result = DynamicTypeRamp::Title1;
    } else if (string == "largeTitle") {
      result = DynamicTypeRamp::LargeTitle;
    } else {
      // sane default
      LOG(ERROR) << "Unsupported DynamicTypeRamp value: " << string;
      react_native_expect(false);
      result = DynamicTypeRamp::Body;
    }
    return;
  }

  LOG(ERROR) << "Unsupported DynamicTypeRamp type";
  react_native_expect(false);

  // Sane default in case of parsing errors
  result = DynamicTypeRamp::Body;
}

inline std::string toString(const EllipsizeMode& ellipsisMode) {
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
  react_native_expect(false);

  // Sane default in case of parsing errors
  return "tail";
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    EllipsizeMode& result) {
  react_native_expect(value.hasType<std::string>());
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
      react_native_expect(false);
      result = EllipsizeMode::Tail;
    }
    return;
  }

  LOG(ERROR) << "Unsupported EllipsizeMode type";
  react_native_expect(false);

  // Sane default in case of parsing errors
  result = EllipsizeMode::Tail;
}

inline std::string toString(const TextBreakStrategy& textBreakStrategy) {
  switch (textBreakStrategy) {
    case TextBreakStrategy::Simple:
      return "simple";
    case TextBreakStrategy::HighQuality:
      return "highQuality";
    case TextBreakStrategy::Balanced:
      return "balanced";
  }

  LOG(ERROR) << "Unsupported TextBreakStrategy value";
  react_native_expect(false);
  return "highQuality";
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    TextBreakStrategy& result) {
  react_native_expect(value.hasType<std::string>());
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
      react_native_expect(false);
      result = TextBreakStrategy::HighQuality;
    }
    return;
  }

  LOG(ERROR) << "Unsupported TextBreakStrategy type";
  react_native_expect(false);
  result = TextBreakStrategy::HighQuality;
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    FontWeight& result) {
  react_native_expect(value.hasType<std::string>());
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
      react_native_expect(false);
      // sane default for prod
      result = FontWeight::Regular;
    }
    return;
  }

  LOG(ERROR) << "Unsupported FontWeight type";
  react_native_expect(false);
  result = FontWeight::Regular;
}

inline std::string toString(const FontWeight& fontWeight) {
  return folly::to<std::string>((int)fontWeight);
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    FontStyle& result) {
  react_native_expect(value.hasType<std::string>());
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
      react_native_expect(false);
      // sane default for prod
      result = FontStyle::Normal;
    }
    return;
  }

  LOG(ERROR) << "Unsupported FontStyle type";
  react_native_expect(false);
  // sane default for prod
  result = FontStyle::Normal;
}

inline std::string toString(const FontStyle& fontStyle) {
  switch (fontStyle) {
    case FontStyle::Normal:
      return "normal";
    case FontStyle::Italic:
      return "italic";
    case FontStyle::Oblique:
      return "oblique";
  }

  LOG(ERROR) << "Unsupported FontStyle value";
  react_native_expect(false);
  // sane default for prod
  return "normal";
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    FontVariant& result) {
  result = FontVariant::Default;
  react_native_expect(value.hasType<std::vector<std::string>>());
  if (value.hasType<std::vector<std::string>>()) {
    auto items = std::vector<std::string>{value};
    for (const auto& item : items) {
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
        react_native_expect(false);
      }
      continue;
    }
  } else {
    LOG(ERROR) << "Unsupported FontVariant type";
  }
}

inline std::string toString(const FontVariant& fontVariant) {
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

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    TextTransform& result) {
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "none") {
      result = TextTransform::None;
    } else if (string == "uppercase") {
      result = TextTransform::Uppercase;
    } else if (string == "lowercase") {
      result = TextTransform::Lowercase;
    } else if (string == "capitalize") {
      result = TextTransform::Capitalize;
    } else if (string == "unset") {
      result = TextTransform::Unset;
    } else {
      LOG(ERROR) << "Unsupported TextTransform value: " << string;
      react_native_expect(false);
      // sane default for prod
      result = TextTransform::None;
    }
    return;
  }

  LOG(ERROR) << "Unsupported TextTransform type";
  react_native_expect(false);
  // sane default for prod
  result = TextTransform::None;
}

inline std::string toString(const TextTransform& textTransform) {
  switch (textTransform) {
    case TextTransform::None:
      return "none";
    case TextTransform::Uppercase:
      return "uppercase";
    case TextTransform::Lowercase:
      return "lowercase";
    case TextTransform::Capitalize:
      return "capitalize";
    case TextTransform::Unset:
      return "unset";
  }

  LOG(ERROR) << "Unsupported TextTransform value";
  react_native_expect(false);
  // sane default for prod
  return "none";
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    TextAlignment& result) {
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "auto" || string == "start") {
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
      // sane default for prod
      result = TextAlignment::Natural;
    }
    return;
  }

  LOG(ERROR) << "Unsupported TextAlignment type";
  // sane default for prod
  result = TextAlignment::Natural;
}

inline std::string toString(const TextAlignment& textAlignment) {
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

inline void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    TextAlignmentVertical& result) {
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "auto") {
      result = TextAlignmentVertical::Auto;
    } else if (string == "top") {
      result = TextAlignmentVertical::Top;
    } else if (string == "bottom") {
      result = TextAlignmentVertical::Bottom;
    } else if (string == "center") {
      result = TextAlignmentVertical::Center;
    } else {
      LOG(ERROR) << "Unsupported TextAlignment value: " << string;
      react_native_expect(false);
      // sane default for prod
      result = TextAlignmentVertical::Auto;
    }
    return;
  }

  LOG(ERROR) << "Unsupported TextAlignmentVertical type";
  // sane default for prod
  result = TextAlignmentVertical::Auto;
}

inline std::string toString(const TextAlignmentVertical& textAlignment) {
  switch (textAlignment) {
    case TextAlignmentVertical::Auto:
      return "auto";
    case TextAlignmentVertical::Top:
      return "top";
    case TextAlignmentVertical::Bottom:
      return "bottom";
    case TextAlignmentVertical::Center:
      return "center";
  }

  LOG(ERROR) << "Unsupported TextAlignmentVertical value";
  // sane default for prod
  return "auto";
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    WritingDirection& result) {
  react_native_expect(value.hasType<std::string>());
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
      react_native_expect(false);
      // sane default for prod
      result = WritingDirection::Natural;
    }
    return;
  }

  LOG(ERROR) << "Unsupported WritingDirection type";
  // sane default for prod
  result = WritingDirection::Natural;
}

inline std::string toString(const WritingDirection& writingDirection) {
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
    const PropsParserContext& context,
    const RawValue& value,
    LineBreakStrategy& result) {
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "none") {
      result = LineBreakStrategy::None;
    } else if (string == "push-out") {
      result = LineBreakStrategy::PushOut;
    } else if (string == "hangul-word") {
      result = LineBreakStrategy::HangulWordPriority;
    } else if (string == "standard") {
      result = LineBreakStrategy::Standard;
    } else {
      LOG(ERROR) << "Unsupported LineBreakStrategy value: " << string;
      react_native_expect(false);
      // sane default for prod
      result = LineBreakStrategy::None;
    }
    return;
  }

  LOG(ERROR) << "Unsupported LineBreakStrategy type";
  // sane default for prod
  result = LineBreakStrategy::None;
}

inline std::string toString(const LineBreakStrategy& lineBreakStrategy) {
  switch (lineBreakStrategy) {
    case LineBreakStrategy::None:
      return "none";
    case LineBreakStrategy::PushOut:
      return "push-out";
    case LineBreakStrategy::HangulWordPriority:
      return "hangul-word";
    case LineBreakStrategy::Standard:
      return "standard";
  }

  LOG(ERROR) << "Unsupported LineBreakStrategy value";
  // sane default for prod
  return "none";
}

inline void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    LineBreakMode& result) {
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "wordWrapping") {
      result = LineBreakMode::Word;
    } else if (string == "char") {
      result = LineBreakMode::Char;
    } else if (string == "clip") {
      result = LineBreakMode::Clip;
    } else if (string == "head") {
      result = LineBreakMode::Head;
    } else if (string == "middle") {
      result = LineBreakMode::Middle;
    } else if (string == "tail") {
      result = LineBreakMode::Tail;
    } else {
      LOG(ERROR) << "Unsupported LineBreakStrategy value: " << string;
      react_native_expect(false);
      // sane default for prod
      result = LineBreakMode::Word;
    }
    return;
  }

  LOG(ERROR) << "Unsupported LineBreakStrategy type";
  // sane default for prod
  result = LineBreakMode::Word;
}

inline std::string toString(const LineBreakMode& lineBreakMode) {
  switch (lineBreakMode) {
    case LineBreakMode::Word:
      return "wordWrapping";
    case LineBreakMode::Char:
      return "char";
    case LineBreakMode::Clip:
      return "clip";
    case LineBreakMode::Head:
      return "head";
    case LineBreakMode::Middle:
      return "middle";
    case LineBreakMode::Tail:
      return "tail";
  }

  LOG(ERROR) << "Unsupported LineBreakStrategy value";
  // sane default for prod
  return "wordWrapping";
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    TextDecorationLineType& result) {
  react_native_expect(value.hasType<std::string>());
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
      react_native_expect(false);
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
    const TextDecorationLineType& textDecorationLineType) {
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
  react_native_expect(false);
  // sane default for prod
  return "none";
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    TextDecorationStyle& result) {
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "solid") {
      result = TextDecorationStyle::Solid;
    } else if (string == "double") {
      result = TextDecorationStyle::Double;
    } else if (string == "dotted") {
      result = TextDecorationStyle::Dotted;
    } else if (string == "dashed") {
      result = TextDecorationStyle::Dashed;
    } else {
      LOG(ERROR) << "Unsupported TextDecorationStyle value: " << string;
      react_native_expect(false);
      // sane default for prod
      result = TextDecorationStyle::Solid;
    }
    return;
  }

  LOG(ERROR) << "Unsupported TextDecorationStyle type";
  // sane default for prod
  result = TextDecorationStyle::Solid;
}

inline std::string toString(const TextDecorationStyle& textDecorationStyle) {
  switch (textDecorationStyle) {
    case TextDecorationStyle::Solid:
      return "solid";
    case TextDecorationStyle::Double:
      return "double";
    case TextDecorationStyle::Dotted:
      return "dotted";
    case TextDecorationStyle::Dashed:
      return "dashed";
  }

  LOG(ERROR) << "Unsupported TextDecorationStyle value";
  react_native_expect(false);
  // sane default for prod
  return "solid";
}

inline std::string toString(const HyphenationFrequency& hyphenationFrequency) {
  switch (hyphenationFrequency) {
    case HyphenationFrequency::None:
      return "none";
    case HyphenationFrequency::Normal:
      return "normal";
    case HyphenationFrequency::Full:
      return "full";
  }

  LOG(ERROR) << "Unsupported HyphenationFrequency value";
  react_native_expect(false);
  return "none";
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    HyphenationFrequency& result) {
  react_native_expect(value.hasType<std::string>());
  if (value.hasType<std::string>()) {
    auto string = (std::string)value;
    if (string == "none") {
      result = HyphenationFrequency::None;
    } else if (string == "normal") {
      result = HyphenationFrequency::Normal;
    } else if (string == "full") {
      result = HyphenationFrequency::Full;
    } else {
      // sane default
      LOG(ERROR) << "Unsupported HyphenationFrequency value: " << string;
      react_native_expect(false);
      result = HyphenationFrequency::None;
    }
    return;
  }

  LOG(ERROR) << "Unsupported HyphenationFrequency type";
  react_native_expect(false);
  result = HyphenationFrequency::None;
}

inline ParagraphAttributes convertRawProp(
    const PropsParserContext& context,
    const RawProps& rawProps,
    const ParagraphAttributes& sourceParagraphAttributes,
    const ParagraphAttributes& defaultParagraphAttributes) {
  auto paragraphAttributes = ParagraphAttributes{};

  paragraphAttributes.maximumNumberOfLines = convertRawProp(
      context,
      rawProps,
      "numberOfLines",
      sourceParagraphAttributes.maximumNumberOfLines,
      defaultParagraphAttributes.maximumNumberOfLines);
  paragraphAttributes.ellipsizeMode = convertRawProp(
      context,
      rawProps,
      "ellipsizeMode",
      sourceParagraphAttributes.ellipsizeMode,
      defaultParagraphAttributes.ellipsizeMode);
  paragraphAttributes.textBreakStrategy = convertRawProp(
      context,
      rawProps,
      "textBreakStrategy",
      sourceParagraphAttributes.textBreakStrategy,
      defaultParagraphAttributes.textBreakStrategy);
  paragraphAttributes.adjustsFontSizeToFit = convertRawProp(
      context,
      rawProps,
      "adjustsFontSizeToFit",
      sourceParagraphAttributes.adjustsFontSizeToFit,
      defaultParagraphAttributes.adjustsFontSizeToFit);
  paragraphAttributes.minimumFontSize = convertRawProp(
      context,
      rawProps,
      "minimumFontSize",
      sourceParagraphAttributes.minimumFontSize,
      defaultParagraphAttributes.minimumFontSize);
  paragraphAttributes.maximumFontSize = convertRawProp(
      context,
      rawProps,
      "maximumFontSize",
      sourceParagraphAttributes.maximumFontSize,
      defaultParagraphAttributes.maximumFontSize);
  paragraphAttributes.includeFontPadding = convertRawProp(
      context,
      rawProps,
      "includeFontPadding",
      sourceParagraphAttributes.includeFontPadding,
      defaultParagraphAttributes.includeFontPadding);
  paragraphAttributes.android_hyphenationFrequency = convertRawProp(
      context,
      rawProps,
      "android_hyphenationFrequency",
      sourceParagraphAttributes.android_hyphenationFrequency,
      defaultParagraphAttributes.android_hyphenationFrequency);

  return paragraphAttributes;
}

inline void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    AttributedString::Range& result) {
  auto map = (std::unordered_map<std::string, int>)value;

  auto start = map.find("start");
  if (start != map.end()) {
    result.location = start->second;
  }
  auto end = map.find("end");
  if (end != map.end()) {
    result.length = start->second - result.location;
  }
}

inline std::string toString(const AttributedString::Range& range) {
  return "{location: " + folly::to<std::string>(range.location) +
      ", length: " + folly::to<std::string>(range.length) + "}";
}

#ifdef ANDROID

// constants for AttributedString serialization
constexpr static MapBuffer::Key AS_KEY_HASH = 0;
constexpr static MapBuffer::Key AS_KEY_STRING = 1;
constexpr static MapBuffer::Key AS_KEY_FRAGMENTS = 2;
constexpr static MapBuffer::Key AS_KEY_CACHE_ID = 3;
constexpr static MapBuffer::Key AS_KEY_BASE_ATTRIBUTES = 4;

// constants for Fragment serialization
constexpr static MapBuffer::Key FR_KEY_STRING = 0;
constexpr static MapBuffer::Key FR_KEY_REACT_TAG = 1;
constexpr static MapBuffer::Key FR_KEY_IS_ATTACHMENT = 2;
constexpr static MapBuffer::Key FR_KEY_WIDTH = 3;
constexpr static MapBuffer::Key FR_KEY_HEIGHT = 4;
constexpr static MapBuffer::Key FR_KEY_TEXT_ATTRIBUTES = 5;

// constants for Text Attributes serialization
constexpr static MapBuffer::Key TA_KEY_FOREGROUND_COLOR = 0;
constexpr static MapBuffer::Key TA_KEY_BACKGROUND_COLOR = 1;
constexpr static MapBuffer::Key TA_KEY_OPACITY = 2;
constexpr static MapBuffer::Key TA_KEY_FONT_FAMILY = 3;
constexpr static MapBuffer::Key TA_KEY_FONT_SIZE = 4;
constexpr static MapBuffer::Key TA_KEY_FONT_SIZE_MULTIPLIER = 5;
constexpr static MapBuffer::Key TA_KEY_FONT_WEIGHT = 6;
constexpr static MapBuffer::Key TA_KEY_FONT_STYLE = 7;
constexpr static MapBuffer::Key TA_KEY_FONT_VARIANT = 8;
constexpr static MapBuffer::Key TA_KEY_ALLOW_FONT_SCALING = 9;
constexpr static MapBuffer::Key TA_KEY_LETTER_SPACING = 10;
constexpr static MapBuffer::Key TA_KEY_LINE_HEIGHT = 11;
constexpr static MapBuffer::Key TA_KEY_ALIGNMENT = 12;
constexpr static MapBuffer::Key TA_KEY_BEST_WRITING_DIRECTION = 13;
constexpr static MapBuffer::Key TA_KEY_TEXT_DECORATION_COLOR = 14;
constexpr static MapBuffer::Key TA_KEY_TEXT_DECORATION_LINE = 15;
constexpr static MapBuffer::Key TA_KEY_TEXT_DECORATION_STYLE = 16;
constexpr static MapBuffer::Key TA_KEY_TEXT_SHADOW_RADIUS = 18;
constexpr static MapBuffer::Key TA_KEY_TEXT_SHADOW_COLOR = 19;
constexpr static MapBuffer::Key TA_KEY_TEXT_SHADOW_OFFSET_DX = 20;
constexpr static MapBuffer::Key TA_KEY_TEXT_SHADOW_OFFSET_DY = 21;
constexpr static MapBuffer::Key TA_KEY_IS_HIGHLIGHTED = 22;
constexpr static MapBuffer::Key TA_KEY_LAYOUT_DIRECTION = 23;
constexpr static MapBuffer::Key TA_KEY_ACCESSIBILITY_ROLE = 24;
constexpr static MapBuffer::Key TA_KEY_LINE_BREAK_STRATEGY = 25;
constexpr static MapBuffer::Key TA_KEY_ROLE = 26;
constexpr static MapBuffer::Key TA_KEY_TEXT_TRANSFORM = 27;
constexpr static MapBuffer::Key TA_KEY_ALIGNMENT_VERTICAL = 28;

// constants for ParagraphAttributes serialization
constexpr static MapBuffer::Key PA_KEY_MAX_NUMBER_OF_LINES = 0;
constexpr static MapBuffer::Key PA_KEY_ELLIPSIZE_MODE = 1;
constexpr static MapBuffer::Key PA_KEY_TEXT_BREAK_STRATEGY = 2;
constexpr static MapBuffer::Key PA_KEY_ADJUST_FONT_SIZE_TO_FIT = 3;
constexpr static MapBuffer::Key PA_KEY_INCLUDE_FONT_PADDING = 4;
constexpr static MapBuffer::Key PA_KEY_HYPHENATION_FREQUENCY = 5;
constexpr static MapBuffer::Key PA_KEY_MINIMUM_FONT_SIZE = 6;
constexpr static MapBuffer::Key PA_KEY_MAXIMUM_FONT_SIZE = 7;

inline MapBuffer toMapBuffer(const ParagraphAttributes& paragraphAttributes) {
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
  builder.putString(
      PA_KEY_HYPHENATION_FREQUENCY,
      toString(paragraphAttributes.android_hyphenationFrequency));
  builder.putDouble(
      PA_KEY_MINIMUM_FONT_SIZE, paragraphAttributes.minimumFontSize);
  builder.putDouble(
      PA_KEY_MAXIMUM_FONT_SIZE, paragraphAttributes.maximumFontSize);

  return builder.build();
}

inline MapBuffer toMapBuffer(const FontVariant& fontVariant) {
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

inline MapBuffer toMapBuffer(const TextAttributes& textAttributes) {
  auto builder = MapBufferBuilder();
  if (textAttributes.foregroundColor) {
    builder.putInt(
        TA_KEY_FOREGROUND_COLOR, toAndroidRepr(textAttributes.foregroundColor));
  }
  if (textAttributes.backgroundColor) {
    builder.putInt(
        TA_KEY_BACKGROUND_COLOR, toAndroidRepr(textAttributes.backgroundColor));
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
  if (textAttributes.lineBreakStrategy.has_value()) {
    builder.putString(
        TA_KEY_LINE_BREAK_STRATEGY,
        toString(*textAttributes.lineBreakStrategy));
  }
  if (textAttributes.textTransform.has_value()) {
    builder.putString(
        TA_KEY_TEXT_TRANSFORM, toString(*textAttributes.textTransform));
  }

  // Decoration
  if (textAttributes.textDecorationColor) {
    builder.putInt(
        TA_KEY_TEXT_DECORATION_COLOR,
        toAndroidRepr(textAttributes.textDecorationColor));
  }
  if (textAttributes.textDecorationLineType.has_value()) {
    builder.putString(
        TA_KEY_TEXT_DECORATION_LINE,
        toString(*textAttributes.textDecorationLineType));
  }
  if (textAttributes.textDecorationStyle.has_value()) {
    builder.putString(
        TA_KEY_TEXT_DECORATION_STYLE,
        toString(*textAttributes.textDecorationStyle));
  }

  // Shadow
  if (!std::isnan(textAttributes.textShadowRadius)) {
    builder.putDouble(
        TA_KEY_TEXT_SHADOW_RADIUS, textAttributes.textShadowRadius);
  }
  if (textAttributes.textShadowColor) {
    builder.putInt(
        TA_KEY_TEXT_SHADOW_COLOR,
        toAndroidRepr(textAttributes.textShadowColor));
  }
  if (textAttributes.textShadowOffset) {
    builder.putDouble(
        TA_KEY_TEXT_SHADOW_OFFSET_DX, textAttributes.textShadowOffset->width);
    builder.putDouble(
        TA_KEY_TEXT_SHADOW_OFFSET_DY, textAttributes.textShadowOffset->height);
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
  if (textAttributes.role.has_value()) {
    builder.putInt(TA_KEY_ROLE, static_cast<int32_t>(*textAttributes.role));
  }
  if (textAttributes.textAlignVertical.has_value()) {
    builder.putString(
        TA_KEY_ALIGNMENT_VERTICAL, toString(*textAttributes.textAlignVertical));
  }
  return builder.build();
}

inline MapBuffer toMapBuffer(const AttributedString::Fragment& fragment) {
  auto builder = MapBufferBuilder();

  builder.putString(FR_KEY_STRING, fragment.string);
  if (fragment.parentShadowView.componentHandle) {
    builder.putInt(FR_KEY_REACT_TAG, fragment.parentShadowView.tag);
  }
  if (fragment.isAttachment()) {
    builder.putBool(FR_KEY_IS_ATTACHMENT, true);
    builder.putDouble(
        FR_KEY_WIDTH, fragment.parentShadowView.layoutMetrics.frame.size.width);
    builder.putDouble(
        FR_KEY_HEIGHT,
        fragment.parentShadowView.layoutMetrics.frame.size.height);
  }
  auto textAttributesMap = toMapBuffer(fragment.textAttributes);
  builder.putMapBuffer(FR_KEY_TEXT_ATTRIBUTES, textAttributesMap);

  return builder.build();
}

inline MapBuffer toMapBuffer(const AttributedString& attributedString) {
  auto fragmentsBuilder = MapBufferBuilder();

  int index = 0;
  for (auto fragment : attributedString.getFragments()) {
    fragmentsBuilder.putMapBuffer(index++, toMapBuffer(fragment));
  }

  auto builder = MapBufferBuilder();
  size_t hash =
      std::hash<facebook::react::AttributedString>{}(attributedString);
  // TODO: This truncates half the hash
  builder.putInt(AS_KEY_HASH, static_cast<int>(hash));
  builder.putString(AS_KEY_STRING, attributedString.getString());
  builder.putMapBuffer(
      AS_KEY_BASE_ATTRIBUTES,
      toMapBuffer(attributedString.getBaseTextAttributes()));
  auto fragmentsMap = fragmentsBuilder.build();
  builder.putMapBuffer(AS_KEY_FRAGMENTS, fragmentsMap);
  return builder.build();
}

#endif

} // namespace facebook::react
