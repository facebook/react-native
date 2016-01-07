/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <CoreLocation/CoreLocation.h>

#import "RCTConvert.h"

@interface RCTConvert (CoreLocation)

+ (CLLocationDegrees)CLLocationDegrees:(id)json;
+ (CLLocationDistance)CLLocationDistance:(id)json;
+ (CLLocationCoordinate2D)CLLocationCoordinate2D:(id)json;

@end
