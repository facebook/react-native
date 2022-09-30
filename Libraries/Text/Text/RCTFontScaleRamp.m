/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTFontScaleRamp.h>

@implementation RCTConvert (FontScaleRamp)

RCT_ENUM_CONVERTER(RCTFontScaleRamp, (@{
  @"caption2": @(RCTFontScaleRampCaption2),
  @"caption1": @(RCTFontScaleRampCaption1),
  @"footnote": @(RCTFontScaleRampFootnote),
  @"subhead": @(RCTFontScaleRampSubhead),
  @"callout": @(RCTFontScaleRampCallout),
  @"body": @(RCTFontScaleRampBody),
  @"headline": @(RCTFontScaleRampHeadline),
  @"title3": @(RCTFontScaleRampTitle3),
  @"title2": @(RCTFontScaleRampTitle2),
  @"title1": @(RCTFontScaleRampTitle1),
  @"largeTitle": @(RCTFontScaleRampLargeTitle),
}), RCTFontScaleRampUndefined, integerValue)

@end

#if !TARGET_OS_OSX // [TODO(macOS GH#774)
UIFontMetrics *RCTUIFontMetricsForFontScaleRamp(RCTFontScaleRamp fontScaleRamp) {
  static NSDictionary<NSNumber *, UIFontTextStyle> *mapping;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    mapping = @{
      @(RCTFontScaleRampCaption2): UIFontTextStyleCaption2,
      @(RCTFontScaleRampCaption1): UIFontTextStyleCaption1,
      @(RCTFontScaleRampFootnote): UIFontTextStyleFootnote,
      @(RCTFontScaleRampSubhead): UIFontTextStyleSubheadline,
      @(RCTFontScaleRampCallout): UIFontTextStyleCallout,
      @(RCTFontScaleRampBody): UIFontTextStyleBody,
      @(RCTFontScaleRampHeadline): UIFontTextStyleHeadline,
      @(RCTFontScaleRampTitle3): UIFontTextStyleTitle3,
      @(RCTFontScaleRampTitle2): UIFontTextStyleTitle2,
      @(RCTFontScaleRampTitle1): UIFontTextStyleTitle1,
      @(RCTFontScaleRampLargeTitle): UIFontTextStyleLargeTitle,
    };
  });

  id textStyle = mapping[@(fontScaleRamp)] ?: UIFontTextStyleBody; // Default to body if we don't recognize the specified ramp
  return [UIFontMetrics metricsForTextStyle:textStyle];
}

CGFloat RCTUIBaseSizeForFontScaleRamp(RCTFontScaleRamp fontScaleRamp) {
  static NSDictionary<NSNumber *, NSNumber *> *mapping;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // Values taken from https://developer.apple.com/design/human-interface-guidelines/foundations/typography/
    mapping = @{
      @(RCTFontScaleRampCaption2): @11,
      @(RCTFontScaleRampCaption1): @12,
      @(RCTFontScaleRampFootnote): @13,
      @(RCTFontScaleRampSubhead): @15,
      @(RCTFontScaleRampCallout): @16,
      @(RCTFontScaleRampBody): @17,
      @(RCTFontScaleRampHeadline): @17,
      @(RCTFontScaleRampTitle3): @20,
      @(RCTFontScaleRampTitle2): @22,
      @(RCTFontScaleRampTitle1): @28,
      @(RCTFontScaleRampLargeTitle): @34,
    };
  });

  NSNumber *baseSize = mapping[@(fontScaleRamp)] ?: @17; // Default to body size if we don't recognize the specified ramp
  return CGFLOAT_IS_DOUBLE ? [baseSize doubleValue] : [baseSize floatValue];
}
#endif // ]TODO(macOS GH#774)
