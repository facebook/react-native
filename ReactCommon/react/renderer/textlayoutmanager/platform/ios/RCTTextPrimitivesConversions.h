/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

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

inline static UIColor *RCTUIColorFromSharedColor(const facebook::react::SharedColor &sharedColor)
{
  if (!sharedColor) {
    return nil;
  }

  if (*facebook::react::clearColor() == *sharedColor) {
    return [UIColor clearColor];
  }

  if (*facebook::react::blackColor() == *sharedColor) {
    return [UIColor blackColor];
  }

  if (*facebook::react::whiteColor() == *sharedColor) {
    return [UIColor whiteColor];
  }

  auto components = facebook::react::colorComponentsFromColor(sharedColor);
  return [UIColor colorWithRed:components.red green:components.green blue:components.blue alpha:components.alpha];
}
