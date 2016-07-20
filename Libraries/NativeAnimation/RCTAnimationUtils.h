/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>

#import "RCTDefines.h"

RCT_EXTERN CGFloat RCTInterpolateValue(CGFloat value,
                                       CGFloat fromMin,
                                       CGFloat fromMax,
                                       CGFloat toMin,
                                       CGFloat toMax);

RCT_EXTERN CGFloat RCTRadiansToDegrees(CGFloat radians);
RCT_EXTERN CGFloat RCTDegreesToRadians(CGFloat degrees);
