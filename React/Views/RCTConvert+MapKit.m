//
//  RCTConvert+MapKit.m
//  React
//
//  Created by Nick Lockwood on 12/04/2015.
//  Copyright (c) 2015 Facebook. All rights reserved.
//

#import "RCTConvert+MapKit.h"

#import "RCTConvert+CoreLocation.h"

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
  MKShape *shape = [[MKPointAnnotation alloc] init];
  shape.coordinate = [self CLLocationCoordinate2D:json];
  shape.title = [RCTConvert NSString:json[@"title"]];
  shape.subtitle = [RCTConvert NSString:json[@"subtitle"]];
  return shape;
}

RCT_ARRAY_CONVERTER(MKShape)

@end
