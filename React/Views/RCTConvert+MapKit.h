//
//  RCTConvert+MapKit.h
//  React
//
//  Created by Nick Lockwood on 12/04/2015.
//  Copyright (c) 2015 Facebook. All rights reserved.
//

#import <MapKit/MapKit.h>

#import "RCTConvert.h"

@interface RCTConvert (MapKit)

+ (MKCoordinateSpan)MKCoordinateSpan:(id)json;
+ (MKCoordinateRegion)MKCoordinateRegion:(id)json;
+ (MKShape *)MKShape:(id)json;

typedef NSArray MKShapeArray;
+ (MKShapeArray *)MKShapeArray:(id)json;

@end
