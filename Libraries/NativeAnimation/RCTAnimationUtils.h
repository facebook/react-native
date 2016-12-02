/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <CoreGraphics/CoreGraphics.h>
#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>

static NSString *const EXTRAPOLATE_TYPE_IDENTITY = @"identity";
static NSString *const EXTRAPOLATE_TYPE_CLAMP = @"clamp";
static NSString *const EXTRAPOLATE_TYPE_EXTEND = @"extend";

RCT_EXTERN CGFloat RCTInterpolateValue(CGFloat value,
                                       CGFloat inputMin,
                                       CGFloat inputMax,
                                       CGFloat outputMin,
                                       CGFloat outputMax,
                                       NSString *extrapolateLeft,
                                       NSString *extrapolateRight);

RCT_EXTERN CGFloat RCTRadiansToDegrees(CGFloat radians);
RCT_EXTERN CGFloat RCTDegreesToRadians(CGFloat degrees);
