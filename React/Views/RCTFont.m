/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTFont.h"

typedef CGFloat RCTFontWeight;
static RCTFontWeight weightOfFont(UIFont *font)
{
  static NSDictionary *nameToWeight;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    nameToWeight = @{
       @"normal": @(UIFontWeightRegular),
       @"bold": @(UIFontWeightBold),
       @"ultralight": @(UIFontWeightUltraLight),
       @"thin": @(UIFontWeightThin),
       @"light": @(UIFontWeightLight),
       @"regular": @(UIFontWeightRegular),
       @"medium": @(UIFontWeightMedium),
       @"semibold": @(UIFontWeightSemibold),
       @"bold": @(UIFontWeightBold),
       @"heavy": @(UIFontWeightHeavy),
       @"black": @(UIFontWeightBlack),
    };
  });

  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  RCTFontWeight weight = [traits[UIFontWeightTrait] doubleValue];
  if (weight == 0.0) {
    for (NSString *name in nameToWeight) {
      if ([font.fontName.lowercaseString hasSuffix:name]) {
        return [nameToWeight[name] doubleValue];
      }
    }
  }
  return weight;
}

static BOOL isItalicFont(UIFont *font)
{
  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  UIFontDescriptorSymbolicTraits symbolicTraits = [traits[UIFontSymbolicTrait] unsignedIntValue];
  return (symbolicTraits & UIFontDescriptorTraitItalic) != 0;
}

static BOOL isCondensedFont(UIFont *font)
{
  NSDictionary *traits = [font.fontDescriptor objectForKey:UIFontDescriptorTraitsAttribute];
  UIFontDescriptorSymbolicTraits symbolicTraits = [traits[UIFontSymbolicTrait] unsignedIntValue];
  return (symbolicTraits & UIFontDescriptorTraitCondensed) != 0;
}

@implementation RCTConvert (RCTFont)

+ (UIFont *)UIFont:(id)json
{
  json = [self NSDictionary:json];
  return [RCTFont updateFont:nil
                  withFamily:json[@"fontFamily"]
                        size:json[@"fontSize"]
                      weight:json[@"fontWeight"]
                       style:json[@"fontStyle"]
             scaleMultiplier:1];
}

RCT_ENUM_CONVERTER(RCTFontWeight, (@{
                                     @"normal": @(UIFontWeightRegular),
                                     @"bold": @(UIFontWeightBold),
                                     @"100": @(UIFontWeightUltraLight),
                                     @"200": @(UIFontWeightThin),
                                     @"300": @(UIFontWeightLight),
                                     @"400": @(UIFontWeightRegular),
                                     @"500": @(UIFontWeightMedium),
                                     @"600": @(UIFontWeightSemibold),
                                     @"700": @(UIFontWeightBold),
                                     @"800": @(UIFontWeightHeavy),
                                     @"900": @(UIFontWeightBlack),
                                     }), UIFontWeightRegular, doubleValue)

typedef BOOL RCTFontStyle;
RCT_ENUM_CONVERTER(RCTFontStyle, (@{
                                    @"normal": @NO,
                                    @"italic": @YES,
                                    @"oblique": @YES,
                                    }), NO, boolValue)

@end

@implementation RCTFont

+ (UIFont *)updateFont:(UIFont *)font
            withFamily:(id)family
                  size:(id)size
                weight:(id)weight
                 style:(id)style
       scaleMultiplier:(CGFloat)scaleMultiplier
{
  // Defaults
  static NSString *defaultFontFamily;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    defaultFontFamily = [UIFont systemFontOfSize:14].familyName;
  });
  const RCTFontWeight defaultFontWeight = UIFontWeightRegular;
  const CGFloat defaultFontSize = 14;

  // Initialize properties to defaults
  CGFloat fontSize = defaultFontSize;
  RCTFontWeight fontWeight = defaultFontWeight;
  NSString *familyName = defaultFontFamily;
  BOOL isItalic = NO;
  BOOL isCondensed = NO;

  if (font) {
    familyName = font.familyName ?: defaultFontFamily;
    fontSize = font.pointSize ?: defaultFontSize;
    fontWeight = weightOfFont(font);
    isItalic = isItalicFont(font);
    isCondensed = isCondensedFont(font);
  }

  // Get font attributes
  fontSize = [RCTConvert CGFloat:size] ?: fontSize;
  if (scaleMultiplier > 0.0 && scaleMultiplier != 1.0) {
    fontSize = round(fontSize * scaleMultiplier);
  }
  familyName = [RCTConvert NSString:family] ?: familyName;
  isItalic = style ? [RCTConvert RCTFontStyle:style] : isItalic;
  fontWeight = weight ? [RCTConvert RCTFontWeight:weight] : fontWeight;

  // Handle system font as special case. This ensures that we preserve
  // the specific metrics of the standard system font as closely as possible.
  if ([familyName isEqual:defaultFontFamily] || [familyName isEqualToString:@"System"]) {
    if ([UIFont respondsToSelector:@selector(systemFontOfSize:weight:)]) {
      font = [UIFont systemFontOfSize:fontSize weight:fontWeight];
      if (isItalic || isCondensed) {
        UIFontDescriptor *fontDescriptor = [font fontDescriptor];
        UIFontDescriptorSymbolicTraits symbolicTraits = fontDescriptor.symbolicTraits;
        if (isItalic) {
          symbolicTraits |= UIFontDescriptorTraitItalic;
        }
        if (isCondensed) {
          symbolicTraits |= UIFontDescriptorTraitCondensed;
        }
        fontDescriptor = [fontDescriptor fontDescriptorWithSymbolicTraits:symbolicTraits];
        font = [UIFont fontWithDescriptor:fontDescriptor size:fontSize];
      }
      return font;
    }
  }

  // Gracefully handle being given a font name rather than font family, for
  // example: "Helvetica Light Oblique" rather than just "Helvetica".
  if ([UIFont fontNamesForFamilyName:familyName].count == 0) {
    font = [UIFont fontWithName:familyName size:fontSize];
    if (font) {
      // It's actually a font name, not a font family name,
      // but we'll do what was meant, not what was said.
      familyName = font.familyName;
      fontWeight = weight ? fontWeight : weightOfFont(font);
      isItalic = style ? isItalic : isItalicFont(font);
      isCondensed = isCondensedFont(font);
    } else {
      // Not a valid font or family
      RCTLogError(@"Unrecognized font family '%@'", familyName);
      if ([UIFont respondsToSelector:@selector(systemFontOfSize:weight:)]) {
        font = [UIFont systemFontOfSize:fontSize weight:fontWeight];
      } else if (fontWeight > UIFontWeightRegular) {
        font = [UIFont boldSystemFontOfSize:fontSize];
      } else {
        font = [UIFont systemFontOfSize:fontSize];
      }
    }
  }

  // Get the closest font that matches the given weight for the fontFamily
  UIFont *bestMatch = font;
  CGFloat closestWeight = INFINITY;
  for (NSString *name in [UIFont fontNamesForFamilyName:familyName]) {
    UIFont *match = [UIFont fontWithName:name size:fontSize];
    if (isItalic == isItalicFont(match) &&
        isCondensed == isCondensedFont(match)) {
      CGFloat testWeight = weightOfFont(match);
      if (ABS(testWeight - fontWeight) < ABS(closestWeight - fontWeight)) {
        bestMatch = match;
        closestWeight = testWeight;
      }
    }
  }

  return bestMatch;
}

+ (UIFont *)updateFont:(UIFont *)font withFamily:(id)json
{
  return [self updateFont:font withFamily:json size:nil weight:nil style:nil scaleMultiplier:1];
}

+ (UIFont *)updateFont:(UIFont *)font withSize:(id)json
{
  return [self updateFont:font withFamily:nil size:json weight:nil style:nil scaleMultiplier:1];
}

+ (UIFont *)updateFont:(UIFont *)font withWeight:(id)json
{
  return [self updateFont:font withFamily:nil size:nil weight:json style:nil scaleMultiplier:1];
}

+ (UIFont *)updateFont:(UIFont *)font withStyle:(id)json
{
  return [self updateFont:font withFamily:nil size:nil weight:nil style:json scaleMultiplier:1];
}

@end
