/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <MapKit/MapKit.h>

#import <React/RCTConvert.h>

@class RCTMapAnnotation;
@class RCTMapOverlay;

@interface RCTConvert (MapKit)

+ (MKCoordinateSpan)MKCoordinateSpan:(id)json;
+ (MKCoordinateRegion)MKCoordinateRegion:(id)json;
+ (MKMapType)MKMapType:(id)json;

+ (RCTMapAnnotation *)RCTMapAnnotation:(id)json;
+ (RCTMapOverlay *)RCTMapOverlay:(id)json;

+ (NSArray<RCTMapAnnotation *> *)RCTMapAnnotationArray:(id)json;
+ (NSArray<RCTMapOverlay *> *)RCTMapOverlayArray:(id)json;

@end
