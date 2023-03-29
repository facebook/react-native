/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>

RCT_EXTERN NSString *const EXTRAPOLATE_TYPE_IDENTITY;
RCT_EXTERN NSString *const EXTRAPOLATE_TYPE_CLAMP;
RCT_EXTERN NSString *const EXTRAPOLATE_TYPE_EXTEND;

RCT_EXTERN NSUInteger RCTFindIndexOfNearestValue(CGFloat value, NSArray<NSNumber *> *range);

RCT_EXTERN CGFloat RCTInterpolateValue(
    CGFloat value,
    CGFloat inputMin,
    CGFloat inputMax,
    CGFloat outputMin,
    CGFloat outputMax,
    NSString *extrapolateLeft,
    NSString *extrapolateRight);

RCT_EXTERN CGFloat RCTInterpolateValueInRange(
    CGFloat value,
    NSArray<NSNumber *> *inputRange,
    NSArray<NSNumber *> *outputRange,
    NSString *extrapolateLeft,
    NSString *extrapolateRight);

RCT_EXTERN int32_t
RCTInterpolateColorInRange(CGFloat value, NSArray<NSNumber *> *inputRange, NSArray<UIColor *> *outputRange);

// Represents a color as a int32_t. RGB components are assumed to be in [0-255] range and alpha in [0-1] range
RCT_EXTERN int32_t RCTColorFromComponents(CGFloat red, CGFloat green, CGFloat blue, CGFloat alpha);

/**
 * Coefficient to slow down animations, respects the ios
 * simulator `Slow Animations (⌘T)` option.
 */
RCT_EXTERN CGFloat RCTAnimationDragCoefficient(void);
