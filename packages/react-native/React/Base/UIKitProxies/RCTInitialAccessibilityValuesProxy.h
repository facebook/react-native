/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTInitialAccessibilityValuesProxy : NSObject

+ (instancetype)sharedInstance;

@property (readonly, nonatomic) BOOL isBoldTextEnabled;
@property (readonly, nonatomic) BOOL isGrayscaleEnabled;
@property (readonly, nonatomic) BOOL isInvertColorsEnabled;
@property (readonly, nonatomic) BOOL isReduceMotionEnabled;
@property (readonly, nonatomic) BOOL isDarkerSystemColorsEnabled;
@property (readonly, nonatomic) BOOL prefersCrossFadeTransitions;
@property (readonly, nonatomic) BOOL isReduceTransparencyEnabled;
@property (readonly, nonatomic) BOOL isVoiceOverEnabled;
@property (readonly, nonatomic) UIContentSizeCategory preferredContentSizeCategory;

- (void)recordAccessibilityValues;

@end

NS_ASSUME_NONNULL_END
