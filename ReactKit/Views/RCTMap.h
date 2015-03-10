// Copyright 2004-present Facebook. All Rights Reserved.

#import <MapKit/MapKit.h>
#import <UIKit/UIKit.h>

extern const CLLocationDegrees RCTMapDefaultSpan;
extern const NSTimeInterval RCTMapRegionChangeObserveInterval;
extern const CGFloat RCTMapZoomBoundBuffer;

@class RCTEventDispatcher;

@interface RCTMap: MKMapView

@property (nonatomic, assign) BOOL followUserLocation;
@property (nonatomic, copy) NSDictionary *JSONRegion;
@property (nonatomic, assign) CGFloat minDelta;
@property (nonatomic, assign) CGFloat maxDelta;
@property (nonatomic, assign) UIEdgeInsets legalLabelInsets;
@property (nonatomic, strong) NSTimer *regionChangeObserveTimer;

@end

#define FLUSH_NAN(value) \
  (isnan(value) ? 0 : value)
