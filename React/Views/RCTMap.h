/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

#import "RCTConvert+MapKit.h"
#import "RCTComponent.h"

RCT_EXTERN const CLLocationDegrees RCTMapDefaultSpan;
RCT_EXTERN const NSTimeInterval RCTMapRegionChangeObserveInterval;
RCT_EXTERN const CGFloat RCTMapZoomBoundBuffer;

@interface RCTMap: MKMapView

@property (nonatomic, assign) BOOL followUserLocation;
@property (nonatomic, assign) BOOL hasStartedRendering;
@property (nonatomic, assign) BOOL showsAnnotationCallouts;
@property (nonatomic, assign) CGFloat minDelta;
@property (nonatomic, assign) CGFloat maxDelta;
@property (nonatomic, assign) UIEdgeInsets legalLabelInsets;
@property (nonatomic, strong) NSTimer *regionChangeObserveTimer;
@property (nonatomic, copy) NSArray<NSString *> *annotationIDs;
@property (nonatomic, copy) NSArray<NSString *> *overlayIDs;

@property (nonatomic, copy) RCTBubblingEventBlock onChange;
@property (nonatomic, copy) RCTBubblingEventBlock onPress;
@property (nonatomic, copy) RCTBubblingEventBlock onAnnotationDragStateChange;
@property (nonatomic, copy) RCTBubblingEventBlock onAnnotationFocus;
@property (nonatomic, copy) RCTBubblingEventBlock onAnnotationBlur;

- (void)setAnnotations:(NSArray<RCTMapAnnotation *> *)annotations;
- (void)setOverlays:(NSArray<RCTMapOverlay *> *)overlays;

@end
