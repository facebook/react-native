/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTConvert.h>

typedef NS_ENUM(NSInteger, RCTDynamicTypeRamp) {
  RCTDynamicTypeRampUndefined,
  RCTDynamicTypeRampCaption2,
  RCTDynamicTypeRampCaption1,
  RCTDynamicTypeRampFootnote,
  RCTDynamicTypeRampSubheadline,
  RCTDynamicTypeRampCallout,
  RCTDynamicTypeRampBody,
  RCTDynamicTypeRampHeadline,
  RCTDynamicTypeRampTitle3,
  RCTDynamicTypeRampTitle2,
  RCTDynamicTypeRampTitle1,
  RCTDynamicTypeRampLargeTitle
};

@interface RCTConvert (DynamicTypeRamp)

+ (RCTDynamicTypeRamp)RCTDynamicTypeRamp:(nullable id)json;

@end

/// Generates a `UIFontMetrics` instance representing a particular Dynamic Type ramp.
UIFontMetrics *_Nonnull RCTUIFontMetricsForDynamicTypeRamp(RCTDynamicTypeRamp dynamicTypeRamp);
/// The "reference" size for a particular font scale ramp, equal to a text element's size under default text size
/// settings.
CGFloat RCTBaseSizeForDynamicTypeRamp(RCTDynamicTypeRamp dynamicTypeRamp);
