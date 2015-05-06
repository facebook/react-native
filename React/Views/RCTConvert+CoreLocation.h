//
//  RCTConvert+CoreLocation.h
//  React
//
//  Created by Nick Lockwood on 12/04/2015.
//  Copyright (c) 2015 Facebook. All rights reserved.
//

#import <CoreLocation/CoreLocation.h>

#import "RCTConvert.h"

@interface RCTConvert (CoreLocation)

+ (CLLocationDegrees)CLLocationDegrees:(id)json;
+ (CLLocationDistance)CLLocationDistance:(id)json;
+ (CLLocationCoordinate2D)CLLocationCoordinate2D:(id)json;

@end
