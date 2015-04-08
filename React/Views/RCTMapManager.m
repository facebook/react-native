/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTMapManager.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "RCTMap.h"
#import "UIView+React.h"

@implementation RCTConvert(CoreLocation)

+ (CLLocationCoordinate2D)CLLocationCoordinate2D:(id)json
{
  json = [self NSDictionary:json];
  return (CLLocationCoordinate2D){
    [self double:json[@"latitude"]],
    [self double:json[@"longitude"]]
  };
}

@end

@implementation RCTConvert(MapKit)

+ (MKCoordinateSpan)MKCoordinateSpan:(id)json
{
  json = [self NSDictionary:json];
  return (MKCoordinateSpan){
    [self double:json[@"latitudeDelta"]],
    [self double:json[@"longitudeDelta"]]
  };
}

+ (MKCoordinateRegion)MKCoordinateRegion:(id)json
{
  return (MKCoordinateRegion){
    [self CLLocationCoordinate2D:json],
    [self MKCoordinateSpan:json]
  };
}

@end

@interface RCTMapManager() <MKMapViewDelegate>

@end

@implementation RCTMapManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  RCTMap *map = [[RCTMap alloc] init];
  map.delegate = self;
  return map;
}

RCT_EXPORT_VIEW_PROPERTY(showsUserLocation, BOOL)
RCT_EXPORT_VIEW_PROPERTY(zoomEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(rotateEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(pitchEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(maxDelta, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(minDelta, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(legalLabelInsets, UIEdgeInsets)
RCT_EXPORT_VIEW_PROPERTY(region, MKCoordinateRegion)

#pragma mark MKMapViewDelegate

- (void)mapView:(RCTMap *)mapView didUpdateUserLocation:(MKUserLocation *)location
{
  if (mapView.followUserLocation) {
    MKCoordinateRegion region;
    region.span.latitudeDelta = RCTMapDefaultSpan;
    region.span.longitudeDelta = RCTMapDefaultSpan;
    region.center = location.coordinate;
    [mapView setRegion:region animated:YES];

    // Move to user location only for the first time it loads up.
    mapView.followUserLocation = NO;
  }
}

- (void)mapView:(RCTMap *)mapView regionWillChangeAnimated:(BOOL)animated
{
  [self _regionChanged:mapView];

  mapView.regionChangeObserveTimer = [NSTimer timerWithTimeInterval:RCTMapRegionChangeObserveInterval
                                                             target:self
                                                           selector:@selector(_onTick:)
                                                           userInfo:@{ @"mapView": mapView }
                                                            repeats:YES];
  [[NSRunLoop mainRunLoop] addTimer:mapView.regionChangeObserveTimer forMode:NSRunLoopCommonModes];
}

- (void)mapView:(RCTMap *)mapView regionDidChangeAnimated:(BOOL)animated
{
  [mapView.regionChangeObserveTimer invalidate];
  mapView.regionChangeObserveTimer = nil;

  [self _regionChanged:mapView];
  [self _emitRegionChangeEvent:mapView continuous:NO];
}

#pragma mark Private

- (void)_onTick:(NSTimer *)timer
{
  [self _regionChanged:timer.userInfo[@"mapView"]];
}

- (void)_regionChanged:(RCTMap *)mapView
{
  BOOL needZoom = NO;
  CGFloat newLongitudeDelta = 0.0f;
  MKCoordinateRegion region = mapView.region;
  // On iOS 7, it's possible that we observe invalid locations during initialization of the map.
  // Filter those out.
  if (!CLLocationCoordinate2DIsValid(region.center)) {
    return;
  }
  // Calculation on float is not 100% accurate. If user zoom to max/min and then move, it's likely the map will auto zoom to max/min from time to time.
  // So let's try to make map zoom back to 99% max or 101% min so that there are some buffer that moving the map won't constantly hitting the max/min bound.
  if (mapView.maxDelta > FLT_EPSILON && region.span.longitudeDelta > mapView.maxDelta) {
    needZoom = YES;
    newLongitudeDelta = mapView.maxDelta * (1 - RCTMapZoomBoundBuffer);
  } else if (mapView.minDelta > FLT_EPSILON && region.span.longitudeDelta < mapView.minDelta) {
    needZoom = YES;
    newLongitudeDelta = mapView.minDelta * (1 + RCTMapZoomBoundBuffer);
  }
  if (needZoom) {
    region.span.latitudeDelta = region.span.latitudeDelta / region.span.longitudeDelta * newLongitudeDelta;
    region.span.longitudeDelta = newLongitudeDelta;
    mapView.region = region;
  }

  // Continously observe region changes
  [self _emitRegionChangeEvent:mapView continuous:YES];
}

- (void)_emitRegionChangeEvent:(RCTMap *)mapView continuous:(BOOL)continuous
{
  MKCoordinateRegion region = mapView.region;
  if (!CLLocationCoordinate2DIsValid(region.center)) {
    return;
  }

#define FLUSH_NAN(value) (isnan(value) ? 0 : value)

  NSDictionary *event = @{
    @"target": [mapView reactTag],
    @"continuous": @(continuous),
    @"region": @{
      @"latitude": @(FLUSH_NAN(region.center.latitude)),
      @"longitude": @(FLUSH_NAN(region.center.longitude)),
      @"latitudeDelta": @(FLUSH_NAN(region.span.latitudeDelta)),
      @"longitudeDelta": @(FLUSH_NAN(region.span.longitudeDelta)),
    }
  };
  [self.bridge.eventDispatcher sendInputEventWithName:@"topChange" body:event];
}

@end
