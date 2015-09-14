/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <MapKit/MapKit.h>

#import "RCTPointAnnotation.h"
#import "RCTConvert.h"

@interface RCTConvert (MapKit)

+ (MKCoordinateSpan)MKCoordinateSpan:(id)json;
+ (MKCoordinateRegion)MKCoordinateRegion:(id)json;
+ (MKShape *)MKShape:(id)json;
+ (MKMapType)MKMapType:(id)json;
+ (RCTPointAnnotation *)RCTPointAnnotation:(id)json;

typedef NSArray MKShapeArray;
+ (MKShapeArray *)MKShapeArray:(id)json;

typedef NSArray RCTPointAnnotationArray;
+ (RCTPointAnnotationArray *)RCTPointAnnotationArray:(id)json;

@end
