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
#import "RCTConvert+CoreLocation.h"
#import "RCTConvert+MapKit.h"
#import "RCTEventDispatcher.h"
#import "RCTMap.h"
#import "RCTUtils.h"
#import "UIView+React.h"
#import "RCTMapAnnotation.h"
#import "RCTMapOverlay.h"

#import <MapKit/MapKit.h>

static NSString *const RCTMapViewKey = @"MapView";

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_9_0

static NSString *const RCTMapPinRed = @"#ff3b30";
static NSString *const RCTMapPinGreen = @"#4cd964";
static NSString *const RCTMapPinPurple = @"#c969e0";

@implementation RCTConvert (MKPinAnnotationColor)

RCT_ENUM_CONVERTER(MKPinAnnotationColor, (@{
  RCTMapPinRed: @(MKPinAnnotationColorRed),
  RCTMapPinGreen: @(MKPinAnnotationColorGreen),
  RCTMapPinPurple: @(MKPinAnnotationColorPurple)
}), MKPinAnnotationColorRed, unsignedIntegerValue)

@end

#endif

@interface RCTMapAnnotationView : MKAnnotationView

@property (nonatomic, strong) UIView *contentView;

@end

@implementation RCTMapAnnotationView

- (void)setContentView:(UIView *)contentView
{
  [_contentView removeFromSuperview];
  _contentView = contentView;
  [self addSubview:_contentView];
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  self.bounds = (CGRect){
    CGPointZero,
    _contentView.frame.size,
  };
}

@end

@interface RCTMapManager() <MKMapViewDelegate>

@end

@implementation RCTMapManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  RCTMap *map = [RCTMap new];
  map.delegate = self;
  return map;
}

RCT_EXPORT_VIEW_PROPERTY(showsUserLocation, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showsPointsOfInterest, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showsCompass, BOOL)
RCT_EXPORT_VIEW_PROPERTY(followUserLocation, BOOL)
RCT_EXPORT_VIEW_PROPERTY(zoomEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(rotateEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(pitchEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(maxDelta, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(minDelta, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(legalLabelInsets, UIEdgeInsets)
RCT_EXPORT_VIEW_PROPERTY(mapType, MKMapType)
RCT_EXPORT_VIEW_PROPERTY(annotations, NSArray<RCTMapAnnotation *>)
RCT_EXPORT_VIEW_PROPERTY(overlays, NSArray<RCTMapOverlay *>)
RCT_EXPORT_VIEW_PROPERTY(onAnnotationDragStateChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onAnnotationFocus, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onAnnotationBlur, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)
RCT_CUSTOM_VIEW_PROPERTY(region, MKCoordinateRegion, RCTMap)
{
  if (json) {
    [view setRegion:[RCTConvert MKCoordinateRegion:json] animated:YES];
  }
}

#pragma mark MKMapViewDelegate

- (void)mapView:(RCTMap *)mapView didSelectAnnotationView:(MKAnnotationView *)view
{
  // TODO: Remove deprecated onAnnotationPress API call later.
  if (mapView.onPress && [view.annotation isKindOfClass:[RCTMapAnnotation class]]) {
    RCTMapAnnotation *annotation = (RCTMapAnnotation *)view.annotation;
    mapView.onPress(@{
      @"action": @"annotation-click",
      @"annotation": @{
        @"id": annotation.identifier,
        @"title": annotation.title ?: @"",
        @"subtitle": annotation.subtitle ?: @"",
        @"latitude": @(annotation.coordinate.latitude),
        @"longitude": @(annotation.coordinate.longitude)
      }
    });
  }

  if ([view.annotation isKindOfClass:[RCTMapAnnotation class]]) {
    RCTMapAnnotation *annotation = (RCTMapAnnotation *)view.annotation;
    if (mapView.onAnnotationFocus) {
      mapView.onAnnotationFocus(@{
        @"annotationId": annotation.identifier
      });
    }
  }
}

- (void)mapView:(RCTMap *)mapView didDeselectAnnotationView:(MKAnnotationView *)view
{
  if ([view.annotation isKindOfClass:[RCTMapAnnotation class]]) {
    RCTMapAnnotation *annotation = (RCTMapAnnotation *)view.annotation;
    if (mapView.onAnnotationBlur) {
      mapView.onAnnotationBlur(@{
        @"annotationId": annotation.identifier
      });
    }
  }
}

- (void)mapView:(RCTMap *)mapView annotationView:(MKAnnotationView *)view
                              didChangeDragState:(MKAnnotationViewDragState)newState
                                    fromOldState:(MKAnnotationViewDragState)oldState
{
  static NSArray *states;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    states = @[@"idle", @"starting", @"dragging", @"canceling", @"ending"];
  });

  if ([view.annotation isKindOfClass:[RCTMapAnnotation class]]) {
    RCTMapAnnotation *annotation = (RCTMapAnnotation *)view.annotation;
    if (mapView.onAnnotationDragStateChange) {
      mapView.onAnnotationDragStateChange(@{
        @"state": states[newState],
        @"oldState": states[oldState],
        @"annotationId": annotation.identifier,
        @"latitude": @(annotation.coordinate.latitude),
        @"longitude": @(annotation.coordinate.longitude),
      });
    }
  }
}

- (MKAnnotationView *)mapView:(RCTMap *)mapView
            viewForAnnotation:(RCTMapAnnotation *)annotation
{
  if (![annotation isKindOfClass:[RCTMapAnnotation class]]) {
    return nil;
  }

  MKAnnotationView *annotationView;
  if (annotation.viewIndex != NSNotFound &&
      annotation.viewIndex < mapView.reactSubviews.count) {

    NSString *reuseIdentifier = NSStringFromClass([RCTMapAnnotationView class]);
    annotationView = [mapView dequeueReusableAnnotationViewWithIdentifier:reuseIdentifier];
    if (!annotationView) {
      annotationView = [[RCTMapAnnotationView alloc] initWithAnnotation:annotation
                                                        reuseIdentifier:reuseIdentifier];
    }
    UIView *reactView = mapView.reactSubviews[annotation.viewIndex];
    ((RCTMapAnnotationView *)annotationView).contentView = reactView;

  } else if (annotation.image) {

    NSString *reuseIdentifier = NSStringFromClass([MKAnnotationView class]);
    annotationView =
      [mapView dequeueReusableAnnotationViewWithIdentifier:reuseIdentifier] ?:
      [[MKAnnotationView alloc] initWithAnnotation:annotation
                                   reuseIdentifier:reuseIdentifier];
    annotationView.image = annotation.image;

  } else {

    NSString *reuseIdentifier = NSStringFromClass([MKPinAnnotationView class]);
    annotationView =
      [mapView dequeueReusableAnnotationViewWithIdentifier:reuseIdentifier] ?:
      [[MKPinAnnotationView alloc] initWithAnnotation:annotation
                                      reuseIdentifier:reuseIdentifier];
    ((MKPinAnnotationView *)annotationView).animatesDrop = annotation.animateDrop;

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_9_0

    if (![annotationView respondsToSelector:@selector(pinTintColor)]) {
      NSString *hexColor = annotation.tintColor ?
        RCTColorToHexString(annotation.tintColor.CGColor) : RCTMapPinRed;
      ((MKPinAnnotationView *)annotationView).pinColor =
        [RCTConvert MKPinAnnotationColor:hexColor];
    } else

#endif

    {
      ((MKPinAnnotationView *)annotationView).pinTintColor =
        annotation.tintColor ?: [MKPinAnnotationView redPinColor];
    }
  }
  annotationView.canShowCallout = (annotation.title.length > 0);

  if (annotation.leftCalloutViewIndex != NSNotFound &&
      annotation.leftCalloutViewIndex < mapView.reactSubviews.count) {
    annotationView.leftCalloutAccessoryView =
      mapView.reactSubviews[annotation.leftCalloutViewIndex];
  } else if (annotation.hasLeftCallout) {
    annotationView.leftCalloutAccessoryView =
      [UIButton buttonWithType:UIButtonTypeDetailDisclosure];
  } else {
    annotationView.leftCalloutAccessoryView = nil;
  }

  if (annotation.rightCalloutViewIndex != NSNotFound &&
      annotation.rightCalloutViewIndex < mapView.reactSubviews.count) {
    annotationView.rightCalloutAccessoryView =
      mapView.reactSubviews[annotation.rightCalloutViewIndex];
  } else if (annotation.hasRightCallout) {
    annotationView.rightCalloutAccessoryView =
      [UIButton buttonWithType:UIButtonTypeDetailDisclosure];
  } else {
    annotationView.rightCalloutAccessoryView = nil;
  }

  //http://stackoverflow.com/questions/32581049/mapkit-ios-9-detailcalloutaccessoryview-usage
  if ([annotationView respondsToSelector:@selector(detailCalloutAccessoryView)]) {
    if (annotation.detailCalloutViewIndex != NSNotFound &&
        annotation.detailCalloutViewIndex < mapView.reactSubviews.count) {
      UIView *calloutView = mapView.reactSubviews[annotation.detailCalloutViewIndex];
      NSLayoutConstraint *widthConstraint =
        [NSLayoutConstraint constraintWithItem:calloutView
                                     attribute:NSLayoutAttributeWidth
                                     relatedBy:NSLayoutRelationEqual
                                        toItem:nil
                                     attribute:NSLayoutAttributeNotAnAttribute
                                    multiplier:1
                                      constant:calloutView.frame.size.width];
      [calloutView addConstraint:widthConstraint];
      NSLayoutConstraint *heightConstraint =
        [NSLayoutConstraint constraintWithItem:calloutView
                                     attribute:NSLayoutAttributeHeight
                                     relatedBy:NSLayoutRelationEqual
                                        toItem:nil
                                     attribute:NSLayoutAttributeNotAnAttribute
                                    multiplier:1
                                      constant:calloutView.frame.size.height];
      [calloutView addConstraint:heightConstraint];
      annotationView.detailCalloutAccessoryView = calloutView;
    } else {
      annotationView.detailCalloutAccessoryView = nil;
    }
  }

  annotationView.draggable = annotation.draggable;

  return annotationView;
}

- (MKOverlayRenderer *)mapView:(__unused MKMapView *)mapView
            rendererForOverlay:(RCTMapOverlay *)overlay
{
  if ([overlay isKindOfClass:[RCTMapOverlay class]]) {
    MKPolylineRenderer *polylineRenderer =
      [[MKPolylineRenderer alloc] initWithPolyline:overlay];
    polylineRenderer.strokeColor = overlay.strokeColor;
    polylineRenderer.lineWidth = overlay.lineWidth;
    return polylineRenderer;
  } else {
    return nil;
  }
}

- (void)mapView:(RCTMap *)mapView annotationView:(MKAnnotationView *)view
                   calloutAccessoryControlTapped:(UIControl *)control
{
  if (mapView.onPress) {

    // Pass to JS
    RCTMapAnnotation *annotation = (RCTMapAnnotation *)view.annotation;
    mapView.onPress(@{
      @"side": (control == view.leftCalloutAccessoryView) ? @"left" : @"right",
      @"action": @"callout-click",
      @"annotationId": annotation.identifier
    });
  }
}

- (void)mapView:(RCTMap *)mapView didUpdateUserLocation:(MKUserLocation *)location
{
  if (mapView.followUserLocation) {
    MKCoordinateRegion region;
    region.span.latitudeDelta = RCTMapDefaultSpan;
    region.span.longitudeDelta = RCTMapDefaultSpan;
    region.center = location.coordinate;
    [mapView setRegion:region animated:YES];
  }
}

- (void)mapView:(RCTMap *)mapView regionWillChangeAnimated:(__unused BOOL)animated
{
  [self _regionChanged:mapView];

  mapView.regionChangeObserveTimer =
    [NSTimer timerWithTimeInterval:RCTMapRegionChangeObserveInterval
                            target:self
                          selector:@selector(_onTick:)
                          userInfo:@{ RCTMapViewKey: mapView }
                           repeats:YES];

  [[NSRunLoop mainRunLoop] addTimer:mapView.regionChangeObserveTimer
                            forMode:NSRunLoopCommonModes];
}

- (void)mapView:(RCTMap *)mapView regionDidChangeAnimated:(__unused BOOL)animated
{
  [mapView.regionChangeObserveTimer invalidate];
  mapView.regionChangeObserveTimer = nil;

  [self _regionChanged:mapView];

  // Don't send region did change events until map has
  // started rendering, as these won't represent the final location
  if (mapView.hasStartedRendering) {
    [self _emitRegionChangeEvent:mapView continuous:NO];
  };
}

- (void)mapViewWillStartRenderingMap:(RCTMap *)mapView
{
  mapView.hasStartedRendering = YES;
  [self _emitRegionChangeEvent:mapView continuous:NO];
}

#pragma mark Private

- (void)_onTick:(NSTimer *)timer
{
  [self _regionChanged:timer.userInfo[RCTMapViewKey]];
}

- (void)_regionChanged:(RCTMap *)mapView
{
  BOOL needZoom = NO;
  CGFloat newLongitudeDelta = 0.0f;
  MKCoordinateRegion region = mapView.region;

  // On iOS 7, it's possible that we observe invalid locations during
  // initialization of the map. Filter those out.
  if (!CLLocationCoordinate2DIsValid(region.center)) {
    return;
  }

  // Calculation on float is not 100% accurate. If user zoom to max/min and then
  // move, it's likely the map will auto zoom to max/min from time to time.
  // So let's try to make map zoom back to 99% max or 101% min so that there is
  // some buffer, and moving the map won't constantly hit the max/min bound.
  if (mapView.maxDelta > FLT_EPSILON &&
      region.span.longitudeDelta > mapView.maxDelta) {
    needZoom = YES;
    newLongitudeDelta = mapView.maxDelta * (1 - RCTMapZoomBoundBuffer);
  } else if (mapView.minDelta > FLT_EPSILON &&
             region.span.longitudeDelta < mapView.minDelta) {
    needZoom = YES;
    newLongitudeDelta = mapView.minDelta * (1 + RCTMapZoomBoundBuffer);
  }
  if (needZoom) {
    region.span.latitudeDelta =
      region.span.latitudeDelta / region.span.longitudeDelta * newLongitudeDelta;
    region.span.longitudeDelta = newLongitudeDelta;
    mapView.region = region;
  }

  // Continously observe region changes
  [self _emitRegionChangeEvent:mapView continuous:YES];
}

- (void)_emitRegionChangeEvent:(RCTMap *)mapView continuous:(BOOL)continuous
{
  if (mapView.onChange) {
    MKCoordinateRegion region = mapView.region;
    if (!CLLocationCoordinate2DIsValid(region.center)) {
      return;
    }

    mapView.onChange(@{
      @"continuous": @(continuous),
      @"region": @{
        @"latitude": @(RCTZeroIfNaN(region.center.latitude)),
        @"longitude": @(RCTZeroIfNaN(region.center.longitude)),
        @"latitudeDelta": @(RCTZeroIfNaN(region.span.latitudeDelta)),
        @"longitudeDelta": @(RCTZeroIfNaN(region.span.longitudeDelta)),
      }
    });
  }
}

@end
