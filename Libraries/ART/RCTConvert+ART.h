/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <QuartzCore/QuartzCore.h>

#import <React/RCTConvert.h>

#import "ARTBrush.h"
#import "ARTCGFloatArray.h"
#import "ARTTextFrame.h"

@interface RCTConvert (ART)

+ (CGPathRef)CGPath:(id)json CF_RETURNS_NOT_RETAINED;
+ (CTTextAlignment)CTTextAlignment:(id)json;
+ (ARTTextFrame)ARTTextFrame:(id)json;
+ (ARTCGFloatArray)ARTCGFloatArray:(id)json;
+ (ARTBrush *)ARTBrush:(id)json;

+ (CGPoint)CGPoint:(id)json offset:(NSUInteger)offset;
+ (CGRect)CGRect:(id)json offset:(NSUInteger)offset;
+ (CGColorRef)CGColor:(id)json offset:(NSUInteger)offset CF_RETURNS_NOT_RETAINED;
+ (CGGradientRef)CGGradient:(id)json offset:(NSUInteger)offset CF_RETURNS_NOT_RETAINED;

@end
