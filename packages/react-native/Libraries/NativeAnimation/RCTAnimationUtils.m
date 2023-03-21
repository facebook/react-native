/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTAnimationUtils.h>

#import <React/RCTLog.h>

NSString *const EXTRAPOLATE_TYPE_IDENTITY = @"identity";
NSString *const EXTRAPOLATE_TYPE_CLAMP = @"clamp";
NSString *const EXTRAPOLATE_TYPE_EXTEND = @"extend";

NSUInteger RCTFindIndexOfNearestValue(CGFloat value, NSArray<NSNumber *> *range)
{
  NSUInteger index;
  NSUInteger rangeCount = range.count;
  for (index = 1; index < rangeCount - 1; index++) {
    NSNumber *inputValue = range[index];
    if (inputValue.doubleValue >= value) {
      break;
    }
  }
  return index - 1;
}

/**
 * Interpolates value by remapping it linearly fromMin->fromMax to toMin->toMax
 */
CGFloat RCTInterpolateValue(
    CGFloat value,
    CGFloat inputMin,
    CGFloat inputMax,
    CGFloat outputMin,
    CGFloat outputMax,
    NSString *extrapolateLeft,
    NSString *extrapolateRight)
{
  if (value < inputMin) {
    if ([extrapolateLeft isEqualToString:EXTRAPOLATE_TYPE_IDENTITY]) {
      return value;
    } else if ([extrapolateLeft isEqualToString:EXTRAPOLATE_TYPE_CLAMP]) {
      value = inputMin;
    } else if ([extrapolateLeft isEqualToString:EXTRAPOLATE_TYPE_EXTEND]) {
      // noop
    } else {
      RCTLogError(@"Invalid extrapolation type %@ for left extrapolation", extrapolateLeft);
    }
  }

  if (value > inputMax) {
    if ([extrapolateRight isEqualToString:EXTRAPOLATE_TYPE_IDENTITY]) {
      return value;
    } else if ([extrapolateRight isEqualToString:EXTRAPOLATE_TYPE_CLAMP]) {
      value = inputMax;
    } else if ([extrapolateRight isEqualToString:EXTRAPOLATE_TYPE_EXTEND]) {
      // noop
    } else {
      RCTLogError(@"Invalid extrapolation type %@ for right extrapolation", extrapolateRight);
    }
  }

  return outputMin + (value - inputMin) * (outputMax - outputMin) / (inputMax - inputMin);
}

/**
 * Interpolates value by mapping it from the inputRange to the outputRange.
 */
CGFloat RCTInterpolateValueInRange(
    CGFloat value,
    NSArray<NSNumber *> *inputRange,
    NSArray<NSNumber *> *outputRange,
    NSString *extrapolateLeft,
    NSString *extrapolateRight)
{
  NSUInteger rangeIndex = RCTFindIndexOfNearestValue(value, inputRange);
  CGFloat inputMin = inputRange[rangeIndex].doubleValue;
  CGFloat inputMax = inputRange[rangeIndex + 1].doubleValue;
  CGFloat outputMin = outputRange[rangeIndex].doubleValue;
  CGFloat outputMax = outputRange[rangeIndex + 1].doubleValue;

  return RCTInterpolateValue(value, inputMin, inputMax, outputMin, outputMax, extrapolateLeft, extrapolateRight);
}

uint32_t RCTInterpolateColorInRange(CGFloat value, NSArray<NSNumber *> *inputRange, NSArray<UIColor *> *outputRange)
{
  NSUInteger rangeIndex = RCTFindIndexOfNearestValue(value, inputRange);
  CGFloat inputMin = inputRange[rangeIndex].doubleValue;
  CGFloat inputMax = inputRange[rangeIndex + 1].doubleValue;

  CGFloat redMin, greenMin, blueMin, alphaMin;
  [outputRange[rangeIndex] getRed:&redMin green:&greenMin blue:&blueMin alpha:&alphaMin];
  CGFloat redMax, greenMax, blueMax, alphaMax;
  [outputRange[rangeIndex + 1] getRed:&redMax green:&greenMax blue:&blueMax alpha:&alphaMax];

  return RCTColorFromComponents(
      0xFF * (redMin + (value - inputMin) * (redMax - redMin) / (inputMax - inputMin)),
      0xFF * (greenMin + (value - inputMin) * (greenMax - greenMin) / (inputMax - inputMin)),
      0xFF * (blueMin + (value - inputMin) * (blueMax - blueMin) / (inputMax - inputMin)),
      alphaMin + (value - inputMin) * (alphaMax - alphaMin) / (inputMax - inputMin));
}

uint32_t RCTColorFromComponents(CGFloat red, CGFloat green, CGFloat blue, CGFloat alpha)
{
  return ((uint32_t)round(alpha * 255) & 0xFF) << 24 | ((uint32_t)round(red) & 0xFF) << 16 |
      ((uint32_t)round(green) & 0xFF) << 8 | ((uint32_t)round(blue) & 0xFF);
}

#if TARGET_IPHONE_SIMULATOR
// Based on https://stackoverflow.com/a/13307674
float UIAnimationDragCoefficient(void);
#endif

CGFloat RCTAnimationDragCoefficient()
{
#if TARGET_IPHONE_SIMULATOR
  if (NSClassFromString(@"XCTest") != nil) {
    // UIAnimationDragCoefficient is 10.0 in tests for some reason, but
    // we need it to be 1.0. Fixes T34233294
    return 1.0;
  } else {
    return (CGFloat)UIAnimationDragCoefficient();
  }
#else
  return 1.0;
#endif
}
