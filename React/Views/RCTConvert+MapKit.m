/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTConvert+MapKit.h"
#import "RCTConvert+CoreLocation.h"
#import "RCTPointAnnotation.h"

@implementation RCTConvert(MapKit)

+ (MKCoordinateSpan)MKCoordinateSpan:(id)json
{
  json = [self NSDictionary:json];
  return (MKCoordinateSpan){
    [self CLLocationDegrees:json[@"latitudeDelta"]],
    [self CLLocationDegrees:json[@"longitudeDelta"]]
  };
}

+ (MKCoordinateRegion)MKCoordinateRegion:(id)json
{
  return (MKCoordinateRegion){
    [self CLLocationCoordinate2D:json],
    [self MKCoordinateSpan:json]
  };
}

+ (MKShape *)MKShape:(id)json
{
  json = [self NSDictionary:json];

  // TODO: more shape types
  MKShape *shape = [MKPointAnnotation new];
  shape.coordinate = [self CLLocationCoordinate2D:json];
  shape.title = [RCTConvert NSString:json[@"title"]];
  shape.subtitle = [RCTConvert NSString:json[@"subtitle"]];
  return shape;
}

RCT_ARRAY_CONVERTER(MKShape)

RCT_ENUM_CONVERTER(MKMapType, (@{
  @"standard": @(MKMapTypeStandard),
  @"satellite": @(MKMapTypeSatellite),
  @"hybrid": @(MKMapTypeHybrid),
}), MKMapTypeStandard, integerValue)

+ (RCTPointAnnotation *)RCTPointAnnotation:(id)json
{
  json = [self NSDictionary:json];
  RCTPointAnnotation *shape = [RCTPointAnnotation new];
  shape.coordinate = [self CLLocationCoordinate2D:json];
  shape.title = [RCTConvert NSString:json[@"title"]];
  shape.subtitle = [RCTConvert NSString:json[@"subtitle"]];
  shape.identifier = [RCTConvert NSString:json[@"id"]];
  shape.hasLeftCallout = [RCTConvert BOOL:json[@"hasLeftCallout"]];
  shape.hasRightCallout = [RCTConvert BOOL:json[@"hasRightCallout"]];
  shape.animateDrop = [RCTConvert BOOL:json[@"animateDrop"]];
  return shape;
}

RCT_ARRAY_CONVERTER(RCTPointAnnotation)

@end
