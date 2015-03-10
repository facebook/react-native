// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTMap.h"

#import "RCTEventDispatcher.h"
#import "RCTLog.h"
#import "RCTUtils.h"

const CLLocationDegrees RCTMapDefaultSpan = 0.005;
const NSTimeInterval RCTMapRegionChangeObserveInterval = 0.1;
const CGFloat RCTMapZoomBoundBuffer = 0.01;

@interface RCTMap()

@property (nonatomic, strong) UIView *legalLabel;
@property (nonatomic, strong) CLLocationManager *locationManager;

@end

@implementation RCTMap

- (instancetype)init
{
  self = [super init];
  if (self) {
    // Find Apple link label
    for (UIView *subview in self.subviews) {
      if ([NSStringFromClass(subview.class) isEqualToString:@"MKAttributionLabel"]) {
        // This check is super hacky, but the whole premise of moving around Apple's internal subviews is super hacky
        _legalLabel = subview;
        break;
      }
    }
  }
  return self;
}

- (void)dealloc
{
  [self.regionChangeObserveTimer invalidate];
}

- (void)layoutSubviews
{
  [super layoutSubviews];

  // Force resize subviews - only the layer is resized by default
  CGRect mapFrame = self.frame;
  self.frame = CGRectZero;
  self.frame = mapFrame;

  if (_legalLabel) {
    dispatch_async(dispatch_get_main_queue(), ^{
      CGRect frame = _legalLabel.frame;
      if (_legalLabelInsets.left) {
        frame.origin.x = _legalLabelInsets.left;
      } else if (_legalLabelInsets.right) {
        frame.origin.x = mapFrame.size.width - _legalLabelInsets.right - frame.size.width;
      }
      if (_legalLabelInsets.top) {
        frame.origin.y = _legalLabelInsets.top;
      } else if (_legalLabelInsets.bottom) {
        frame.origin.y = mapFrame.size.height - _legalLabelInsets.bottom - frame.size.height;
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
    [super setShowsUserLocation:showsUserLocation];

    // If it needs to show user location, force map view centered
    // on user's current location on user location updates
    self.followUserLocation = showsUserLocation;
  }
}

- (void)setJSONRegion:(NSDictionary *)region
{
  if (region) {
    MKCoordinateRegion coordinateRegion = self.region;
    if ([region[@"latitude"] isKindOfClass:[NSNumber class]]) {
      coordinateRegion.center.latitude = [region[@"latitude"] doubleValue];
    } else {
      RCTLogError(@"region must include numeric latitude, got: %@", region);
      return;
    }
    if ([region[@"longitude"] isKindOfClass:[NSNumber class]]) {
      coordinateRegion.center.longitude = [region[@"longitude"] doubleValue];
    } else {
      RCTLogError(@"region must include numeric longitude, got: %@", region);
      return;
    }
    if ([region[@"latitudeDelta"] isKindOfClass:[NSNumber class]]) {
      coordinateRegion.span.latitudeDelta = [region[@"latitudeDelta"] doubleValue];
    }
    if ([region[@"longitudeDelta"] isKindOfClass:[NSNumber class]]) {
      coordinateRegion.span.longitudeDelta = [region[@"longitudeDelta"] doubleValue];
    }

    [self setRegion:coordinateRegion animated:YES];
  }
}

- (NSDictionary *)JSONRegion
{
  MKCoordinateRegion region = self.region;
  if (!CLLocationCoordinate2DIsValid(region.center)) {
    return nil;
  }
  return @{
    @"latitude": @(FLUSH_NAN(region.center.latitude)),
    @"longitude": @(FLUSH_NAN(region.center.longitude)),
    @"latitudeDelta": @(FLUSH_NAN(region.span.latitudeDelta)),
    @"longitudeDelta": @(FLUSH_NAN(region.span.longitudeDelta)),
  };
}

@end
