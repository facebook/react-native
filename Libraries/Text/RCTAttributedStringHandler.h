/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "RCTShadowView.h"

/**
 *  The RCTAttributedStringHandler class stores attributes that can be applied to a string.
 *  Using the attributedString function one can generate an NSAttributedString from a NSString applying those attributes.
 */
@interface RCTAttributedStringHandler : NSObject

@property (nonatomic, assign) NSWritingDirection writingDirection;
@property (nonatomic, strong) UIColor *textBackgroundColor;
@property (nonatomic, strong) UIColor *textColor;
@property (nonatomic, copy) NSString *fontFamily;
@property (nonatomic, assign) CGFloat fontSize;
@property (nonatomic, copy) NSString *fontWeight;
@property (nonatomic, copy) NSString *fontStyle;
@property (nonatomic, assign) BOOL isHighlighted;
@property (nonatomic, assign) CGFloat lineHeight;
@property (nonatomic, assign) NSTextAlignment textAlign;

@property (nonatomic, strong, readonly) NSAttributedString *cachedAttributedString;

-(instancetype)initWithShadowView:(RCTShadowView *)shadowView;

- (NSAttributedString *)attributedString:(NSString *)stringToProcess;

@end
