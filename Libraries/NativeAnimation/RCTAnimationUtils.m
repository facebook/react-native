/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAnimationUtils.h"

#import <React/RCTLog.h>

/**
 * Interpolates value by remapping it linearly fromMin->fromMax to toMin->toMax
 */
CGFloat RCTInterpolateValue(CGFloat value,
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

CGFloat RCTRadiansToDegrees(CGFloat radians)
{
  return radians * 180.0 / M_PI;
}

CGFloat RCTDegreesToRadians(CGFloat degrees)
{
  return degrees / 180.0 * M_PI;
}
