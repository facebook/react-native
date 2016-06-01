/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAnimationGeometry.h"

double RemapValue(double value, double low1, double high1, double low2, double high2 ) {
  return low2 + (value - low1) * (high2 - low2) / (high1 - low1);
}

CGFloat RadiansToDegrees(CGFloat radians) {
  return ( ( radians ) * ( 180.0 / M_PI ) );
}

CGFloat DegreesToRadians(CGFloat degrees) {
  return  ( ( degrees ) / 180.0 * M_PI );
}
