/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTFontAttributesDelegate.h"

@class RCTAccessibilityManager;

@interface RCTFontAttributes : NSObject

@property (nonatomic, weak) id<RCTFontAttributesDelegate> delegate;

@property (readonly, nonatomic, strong) UIFont *font;

@property (nonatomic, assign) BOOL allowFontScaling;
@property (nonatomic, copy) NSString *fontFamily;
@property (nonatomic, strong) NSNumber *fontSize;
@property (nonatomic, assign) CGFloat fontSizeMultiplier;
@property (nonatomic, copy) NSString *fontStyle;
@property (nonatomic, copy) NSString *fontWeight;

- (instancetype)initWithAccessibilityManager:(RCTAccessibilityManager *)accessibilityManager;

@end
