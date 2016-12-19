/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTMap.h"

#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTMapAnnotation.h"
#import "RCTMapOverlay.h"
#import "RCTUtils.h"
#import "UIView+React.h"

const CLLocationDegrees RCTMapDefaultSpan = 0.005;
const NSTimeInterval RCTMapRegionChangeObserveInterval = 0.1;
const CGFloat RCTMapZoomBoundBuffer = 0.01;

@implementation RCTMap
{
  UIView *_legalLabel;
  CLLocationManager *_locationManager;
}

- (instancetype)init
{
  if ((self = [super init])) {

    _hasStartedRendering = NO;

    // Find Apple link label
    for (UIView *subview in self.subviews) {
      if ([NSStringFromClass(subview.class) isEqualToString:@"MKAttributionLabel"]) {
        // This check is super hacky, but the whole premise of moving around
        // Apple's internal subviews is super hacky
        _legalLabel = subview;
        break;
      }
    }
  }
  return self;
}

- (void)dealloc
{
  [_regionChangeObserveTimer invalidate];
}

- (void)didUpdateReactSubviews
{
  // Do nothing, as annotation views are managed by `setAnnotations:` method
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  if (_legalLabel) {
    dispatch_async(dispatch_get_main_queue(), ^{
      CGRect frame = self->_legalLabel.frame;
      if (self->_legalLabelInsets.left) {
        frame.origin.x = self->_legalLabelInsets.left;
      } else if (self->_legalLabelInsets.right) {
        frame.origin.x = self.frame.size.width - self->_legalLabelInsets.right - frame.size.width;
      }
      if (self->_legalLabelInsets.top) {
        frame.origin.y = self->_legalLabelInsets.top;
      } else if (self->_legalLabelInsets.bottom) {
        frame.origin.y = self.frame.size.height - self->_legalLabelInsets.bottom - frame.size.height;
      }
      self->_legalLabel.frame = frame;
    });
  }
}

#pragma mark Accessors

- (void)setShowsUserLocation:(BOOL)showsUserLocation
{
  if (self.showsUserLocation != showsUserLocation) {
    if (showsUserLocation && !_locationManager) {
      _locationManager = [CLLocationManager new];
      if ([_locationManager respondsToSelector:@selector(requestWhenInUseAuthorization)]) {
        [_locationManager requestWhenInUseAuthorization];
      }
    }
    super.showsUserLocation = showsUserLocation;
  }
}

- (void)setRegion:(MKCoordinateRegion)region animated:(BOOL)animated
{
  // If location is invalid, abort
  if (!CLLocationCoordinate2DIsValid(region.center)) {
    return;
  }

  // If new span values are nil, use old values instead
  if (!region.span.latitudeDelta) {
    region.span.latitudeDelta = self.region.span.latitudeDelta;
  }
  if (!region.span.longitudeDelta) {
    region.span.longitudeDelta = self.region.span.longitudeDelta;
  }

  // Animate to new position
  [super setRegion:region animated:animated];
}

// TODO: this doesn't preserve order. Should it? If so we should change the
// algorithm. If not, it would be more efficient to use an NSSet
- (void)setAnnotations:(NSArray<RCTMapAnnotation *> *)annotations
{
  NSMutableArray<NSString *> *newAnnotationIDs = [NSMutableArray new];
  NSMutableArray<RCTMapAnnotation *> *annotationsToDelete = [NSMutableArray new];
  NSMutableArray<RCTMapAnnotation *> *annotationsToAdd = [NSMutableArray new];

  for (RCTMapAnnotation *annotation in annotations) {
    if (![annotation isKindOfClass:[RCTMapAnnotation class]]) {
      continue;
    }

    [newAnnotationIDs addObject:annotation.identifier];

    // If the current set does not contain the new annotation, mark it to add
    if (![_annotationIDs containsObject:annotation.identifier]) {
      [annotationsToAdd addObject:annotation];
    }
  }

  for (RCTMapAnnotation *annotation in self.annotations) {
    if (![annotation isKindOfClass:[RCTMapAnnotation class]]) {
      continue;
    }

    // If the new set does not contain an existing annotation, mark it to delete
    if (![newAnnotationIDs containsObject:annotation.identifier]) {
      [annotationsToDelete addObject:annotation];
    }
  }

  if (annotationsToDelete.count) {
    [self removeAnnotations:(NSArray<id<MKAnnotation>> *)annotationsToDelete];
  }

  if (annotationsToAdd.count) {
    [self addAnnotations:(NSArray<id<MKAnnotation>> *)annotationsToAdd];
  }

  self.annotationIDs = newAnnotationIDs;
}

// TODO: this doesn't preserve order. Should it? If so we should change the
// algorithm. If not, it would be more efficient to use an NSSet
- (void)setOverlays:(NSArray<RCTMapOverlay *> *)overlays
{
  NSMutableArray *newOverlayIDs = [NSMutableArray new];
  NSMutableArray *overlaysToDelete = [NSMutableArray new];
  NSMutableArray *overlaysToAdd = [NSMutableArray new];

  for (RCTMapOverlay *overlay in overlays) {
    if (![overlay isKindOfClass:[RCTMapOverlay class]]) {
      continue;
    }

    [newOverlayIDs addObject:overlay.identifier];

    // If the current set does not contain the new annotation, mark it to add
    if (![_annotationIDs containsObject:overlay.identifier]) {
      [overlaysToAdd addObject:overlay];
    }
  }

  for (RCTMapOverlay *overlay in self.overlays) {
    if (![overlay isKindOfClass:[RCTMapOverlay class]]) {
      continue;
    }

    // If the new set does not contain an existing annotation, mark it to delete
    if (![newOverlayIDs containsObject:overlay.identifier]) {
      [overlaysToDelete addObject:overlay];
    }
  }

  if (overlaysToDelete.count) {
    [self removeOverlays:(NSArray<id<MKOverlay>> *)overlaysToDelete];
  }

  if (overlaysToAdd.count) {
    [self addOverlays:(NSArray<id<MKOverlay>> *)overlaysToAdd
                level:MKOverlayLevelAboveRoads];
  }

  self.overlayIDs = newOverlayIDs;
}

- (BOOL)showsCompass {
  if ([MKMapView instancesRespondToSelector:@selector(showsCompass)]) {
    return super. showsCompass;
  }
  return NO;
}

- (void)setShowsCompass:(BOOL)showsCompass {
  if ([MKMapView instancesRespondToSelector:@selector(setShowsCompass:)]) {
    super.showsCompass = showsCompass;
  }
}

@end
