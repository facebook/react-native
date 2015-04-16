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
#import "RCTUtils.h"

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

    _hasStartedLoading = NO;

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

- (void)reactSetFrame:(CGRect)frame
{
  self.frame = frame;
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  if (_legalLabel) {
    dispatch_async(dispatch_get_main_queue(), ^{
      CGRect frame = _legalLabel.frame;
      if (_legalLabelInsets.left) {
        frame.origin.x = _legalLabelInsets.left;
      } else if (_legalLabelInsets.right) {
        frame.origin.x = self.frame.size.width - _legalLabelInsets.right - frame.size.width;
      }
      if (_legalLabelInsets.top) {
        frame.origin.y = _legalLabelInsets.top;
      } else if (_legalLabelInsets.bottom) {
        frame.origin.y = self.frame.size.height - _legalLabelInsets.bottom - frame.size.height;
      }
      _legalLabel.frame = frame;
    });
  }
}

#pragma mark Accessors

- (void)setShowsUserLocation:(BOOL)showsUserLocation
{
  if (self.showsUserLocation != showsUserLocation) {
    if (showsUserLocation && !_locationManager) {
      _locationManager = [[CLLocationManager alloc] init];
      if ([_locationManager respondsToSelector:@selector(requestWhenInUseAuthorization)]) {
        [_locationManager requestWhenInUseAuthorization];
      }
    }
    super.showsUserLocation = showsUserLocation;

    // If it needs to show user location, force map view centered
    // on user's current location on user location updates
    _followUserLocation = showsUserLocation;
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

- (void)setAnnotations:(MKShapeArray *)annotations
{
  [self removeAnnotations:self.annotations];
  if (annotations.count) {
    [self addAnnotations:annotations];
  }
}

@end
