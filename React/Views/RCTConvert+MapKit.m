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
#import "RCTMapAnnotation.h"
#import "RCTMapOverlay.h"

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

RCT_ENUM_CONVERTER(MKMapType, (@{
  @"standard": @(MKMapTypeStandard),
  @"satellite": @(MKMapTypeSatellite),
  @"hybrid": @(MKMapTypeHybrid),
}), MKMapTypeStandard, integerValue)

+ (RCTMapAnnotation *)RCTMapAnnotation:(id)json
{
  json = [self NSDictionary:json];
  RCTMapAnnotation *annotation = [RCTMapAnnotation new];
  annotation.coordinate = [self CLLocationCoordinate2D:json];
  annotation.title = [RCTConvert NSString:json[@"title"]];
  annotation.subtitle = [RCTConvert NSString:json[@"subtitle"]];
  annotation.identifier = [RCTConvert NSString:json[@"id"]];
  annotation.hasLeftCallout = [RCTConvert BOOL:json[@"hasLeftCallout"]];
  annotation.hasRightCallout = [RCTConvert BOOL:json[@"hasRightCallout"]];
  annotation.animateDrop = [RCTConvert BOOL:json[@"animateDrop"]];
  annotation.tintColor = [RCTConvert UIColor:json[@"tintColor"]];
  annotation.image = [RCTConvert UIImage:json[@"image"]];
  if (annotation.tintColor && annotation.image) {
    annotation.image = [annotation.image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
  }
  return annotation;
}

RCT_ARRAY_CONVERTER(RCTMapAnnotation)

+ (RCTMapOverlay *)RCTMapOverlay:(id)json
{
  json = [self NSDictionary:json];
  NSArray<NSDictionary *> *locations = [RCTConvert NSDictionaryArray:json[@"coordinates"]];
  CLLocationCoordinate2D coordinates[locations.count];
  NSUInteger index = 0;
  for (NSDictionary *location in locations) {
    coordinates[index++] = [RCTConvert CLLocationCoordinate2D:location];
  }

  RCTMapOverlay *overlay = [RCTMapOverlay polylineWithCoordinates:coordinates
                                                            count:locations.count];

  overlay.strokeColor = [RCTConvert UIColor:json[@"strokeColor"]];
  overlay.identifier = [RCTConvert NSString:json[@"id"]];
  overlay.lineWidth = [RCTConvert CGFloat:json[@"lineWidth"] ?: @1];
  return overlay;
}

RCT_ARRAY_CONVERTER(RCTMapOverlay)

@end
