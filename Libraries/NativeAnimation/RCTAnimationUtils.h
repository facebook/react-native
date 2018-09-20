/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>

static NSString *const EXTRAPOLATE_TYPE_IDENTITY = @"identity";
static NSString *const EXTRAPOLATE_TYPE_CLAMP = @"clamp";
static NSString *const EXTRAPOLATE_TYPE_EXTEND = @"extend";

RCT_EXTERN CGFloat RCTInterpolateValueInRange(CGFloat value,
                                              NSArray<NSNumber *> *inputRange,
                                              NSArray<NSNumber *> *outputRange,
                                              NSString *extrapolateLeft,
                                              NSString *extrapolateRight);

RCT_EXTERN CGFloat RCTInterpolateValue(CGFloat value,
                                       CGFloat inputMin,
                                       CGFloat inputMax,
                                       CGFloat outputMin,
                                       CGFloat outputMax,
                                       NSString *extrapolateLeft,
                                       NSString *extrapolateRight);

RCT_EXTERN CGFloat RCTRadiansToDegrees(CGFloat radians);
RCT_EXTERN CGFloat RCTDegreesToRadians(CGFloat degrees);

/**
 * Coefficient to slow down animations, respects the ios
 * simulator `Slow Animations (⌘T)` option.
 */
RCT_EXTERN CGFloat RCTAnimationDragCoefficient(void);
