/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#include <react/renderer/graphics/RCTPlatformColorUtils.h>
#include <react/renderer/textlayoutmanager/RCTFontProperties.h>
#include <react/renderer/textlayoutmanager/RCTFontUtils.h>

inline static NSTextAlignment RCTNSTextAlignmentFromTextAlignment(facebook::react::TextAlignment textAlignment)
{
  switch (textAlignment) {
    case facebook::react::TextAlignment::Natural:
      return NSTextAlignmentNatural;
    case facebook::react::TextAlignment::Left:
      return NSTextAlignmentLeft;
    case facebook::react::TextAlignment::Right:
      return NSTextAlignmentRight;
    case facebook::react::TextAlignment::Center:
      return NSTextAlignmentCenter;
    case facebook::react::TextAlignment::Justified:
      return NSTextAlignmentJustified;
  }
}

inline static NSWritingDirection RCTNSWritingDirectionFromWritingDirection(
    facebook::react::WritingDirection writingDirection)
{
  switch (writingDirection) {
    case facebook::react::WritingDirection::Natural:
      return NSWritingDirectionNatural;
    case facebook::react::WritingDirection::LeftToRight:
      return NSWritingDirectionLeftToRight;
    case facebook::react::WritingDirection::RightToLeft:
      return NSWritingDirectionRightToLeft;
  }
}

inline static NSLineBreakStrategy RCTNSLineBreakStrategyFromLineBreakStrategy(
    facebook::react::LineBreakStrategy lineBreakStrategy)
{
  switch (lineBreakStrategy) {
    case facebook::react::LineBreakStrategy::None:
      return NSLineBreakStrategyNone;
    case facebook::react::LineBreakStrategy::PushOut:
      return NSLineBreakStrategyPushOut;
    case facebook::react::LineBreakStrategy::HangulWordPriority:
      if (@available(iOS 14.0, *)) {
        return NSLineBreakStrategyHangulWordPriority;
      } else {
        return NSLineBreakStrategyNone;
      }
    case facebook::react::LineBreakStrategy::Standard:
      if (@available(iOS 14.0, *)) {
        return NSLineBreakStrategyStandard;
      } else {
        return NSLineBreakStrategyNone;
      }
  }
}

inline static NSLineBreakMode RCTNSLineBreakModeFromLineBreakMode(facebook::react::LineBreakMode lineBreakMode)
{
  switch (lineBreakMode) {
    case facebook::react::LineBreakMode::Word:
      return NSLineBreakByWordWrapping;
    case facebook::react::LineBreakMode::Char:
      return NSLineBreakByCharWrapping;
    case facebook::react::LineBreakMode::Clip:
      return NSLineBreakByClipping;
    case facebook::react::LineBreakMode::Head:
      return NSLineBreakByTruncatingHead;
    case facebook::react::LineBreakMode::Middle:
      return NSLineBreakByTruncatingMiddle;
    case facebook::react::LineBreakMode::Tail:
      return NSLineBreakByTruncatingTail;
  }
}

inline static RCTFontStyle RCTFontStyleFromFontStyle(facebook::react::FontStyle fontStyle)
{
  switch (fontStyle) {
    case facebook::react::FontStyle::Normal:
      return RCTFontStyleNormal;
    case facebook::react::FontStyle::Italic:
      return RCTFontStyleItalic;
    case facebook::react::FontStyle::Oblique:
      return RCTFontStyleOblique;
  }
}

inline static RCTFontVariant RCTFontVariantFromFontVariant(facebook::react::FontVariant fontVariant)
{
  return (RCTFontVariant)fontVariant;
}

inline static NSUnderlineStyle RCTNSUnderlineStyleFromTextDecorationStyle(
    facebook::react::TextDecorationStyle textDecorationStyle)
{
  switch (textDecorationStyle) {
    case facebook::react::TextDecorationStyle::Solid:
      return NSUnderlineStyleSingle;
    case facebook::react::TextDecorationStyle::Double:
      return NSUnderlineStyleDouble;
    case facebook::react::TextDecorationStyle::Dashed:
      return NSUnderlinePatternDash | NSUnderlineStyleSingle;
    case facebook::react::TextDecorationStyle::Dotted:
      return NSUnderlinePatternDot | NSUnderlineStyleSingle;
  }
}

// TODO: this file has some duplicates method, we can remove it
inline static UIColor *_Nullable RCTUIColorFromSharedColor(const facebook::react::SharedColor &sharedColor)
{
  return RCTPlatformColorFromColor(*sharedColor);
}
