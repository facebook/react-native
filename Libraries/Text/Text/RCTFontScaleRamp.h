/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTConvert.h>

typedef NS_ENUM(NSInteger, RCTFontScaleRamp) {
  RCTFontScaleRampUndefined,
  RCTFontScaleRampCaption2,
  RCTFontScaleRampCaption1,
  RCTFontScaleRampFootnote,
  RCTFontScaleRampSubhead,
  RCTFontScaleRampCallout,
  RCTFontScaleRampBody,
  RCTFontScaleRampHeadline,
  RCTFontScaleRampTitle3,
  RCTFontScaleRampTitle2,
  RCTFontScaleRampTitle1,
  RCTFontScaleRampLargeTitle
};

@interface RCTConvert (FontScaleRamp)

+ (RCTFontScaleRamp)RCTFontScaleRamp:(nullable id)json;

@end

#if !TARGET_OS_OSX // [TODO(macOS GH#774)
/// Generates a `UIFontMetrics` instance representing a particular font scale ramp.
UIFontMetrics * _Nonnull RCTUIFontMetricsForFontScaleRamp(RCTFontScaleRamp fontScaleRamp);
/// The "reference" size for a particular font scale ramp, equal to a text element's size under default text size settings.
CGFloat RCTUIBaseSizeForFontScaleRamp(RCTFontScaleRamp fontScaleRamp);
#endif // ]TODO(macOS GH#774)
