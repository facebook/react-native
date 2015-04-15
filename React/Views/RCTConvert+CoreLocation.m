//
//  RCTConvert+CoreLocation.m
//  React
//
//  Created by Nick Lockwood on 12/04/2015.
//  Copyright (c) 2015 Facebook. All rights reserved.
//

#import "RCTConvert+CoreLocation.h"

@implementation RCTConvert(CoreLocation)

RCT_CONVERTER(CLLocationDegrees, CLLocationDegrees, doubleValue);
RCT_CONVERTER(CLLocationDistance, CLLocationDistance, doubleValue);

+ (CLLocationCoordinate2D)CLLocationCoordinate2D:(id)json
{
  json = [self NSDictionary:json];
  return (CLLocationCoordinate2D){
    [self CLLocationDegrees:json[@"latitude"]],
    [self CLLocationDegrees:json[@"longitude"]]
  };
}

@end
