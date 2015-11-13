/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTLocationObserver.h"

#import <CoreLocation/CLError.h>
#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"

typedef NS_ENUM(NSInteger, RCTPositionErrorCode) {
  RCTPositionErrorDenied = 1,
  RCTPositionErrorUnavailable,
  RCTPositionErrorTimeout,
};

#define RCT_DEFAULT_LOCATION_ACCURACY kCLLocationAccuracyHundredMeters

typedef struct {
  double timeout;
  double maximumAge;
  double accuracy;
} RCTLocationOptions;

@implementation RCTConvert (RCTLocationOptions)

+ (RCTLocationOptions)RCTLocationOptions:(id)json
{
  NSDictionary *options = [RCTConvert NSDictionary:json];
  return (RCTLocationOptions){
    .timeout = [RCTConvert NSTimeInterval:options[@"timeout"]] ?: INFINITY,
    .maximumAge = [RCTConvert NSTimeInterval:options[@"maximumAge"]] ?: INFINITY,
    .accuracy = [RCTConvert BOOL:options[@"enableHighAccuracy"]] ? kCLLocationAccuracyBest : RCT_DEFAULT_LOCATION_ACCURACY
  };
}

@end

static NSDictionary *RCTPositionError(RCTPositionErrorCode code, NSString *msg /* nil for default */)
{
  if (!msg) {
    switch (code) {
      case RCTPositionErrorDenied:
        msg = @"User denied access to location services.";
        break;
      case RCTPositionErrorUnavailable:
        msg = @"Unable to retrieve location.";
        break;
      case RCTPositionErrorTimeout:
        msg = @"The location request timed out.";
        break;
    }
  }

  return @{
    @"code": @(code),
    @"message": msg,
    @"PERMISSION_DENIED": @(RCTPositionErrorDenied),
    @"POSITION_UNAVAILABLE": @(RCTPositionErrorUnavailable),
    @"TIMEOUT": @(RCTPositionErrorTimeout)
  };
}

@interface RCTLocationRequest : NSObject

@property (nonatomic, copy) RCTResponseSenderBlock successBlock;
@property (nonatomic, copy) RCTResponseSenderBlock errorBlock;
@property (nonatomic, assign) RCTLocationOptions options;
@property (nonatomic, strong) NSTimer *timeoutTimer;

@end

@implementation RCTLocationRequest

- (void)dealloc
{
  if (_timeoutTimer.valid) {
    [_timeoutTimer invalidate];
  }
}

@end

@interface RCTLocationObserver () <CLLocationManagerDelegate>

@end

@implementation RCTLocationObserver
{
  CLLocationManager *_locationManager;
  NSDictionary *_lastLocationEvent;
  NSMutableArray<RCTLocationRequest *> *_pendingRequests;
  BOOL _observingLocation;
  RCTLocationOptions _observerOptions;
}

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

#pragma mark - Lifecycle

- (instancetype)init
{
  if ((self = [super init])) {

    _locationManager = [CLLocationManager new];
    _locationManager.distanceFilter = RCT_DEFAULT_LOCATION_ACCURACY;
    _locationManager.delegate = self;

    _pendingRequests = [NSMutableArray new];
  }
  return self;
}

- (void)dealloc
{
  [_locationManager stopUpdatingLocation];
  _locationManager.delegate = nil;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

#pragma mark - Private API

- (void)beginLocationUpdates
{
  // Request location access permission
  if ([_locationManager respondsToSelector:@selector(requestWhenInUseAuthorization)]) {
    [_locationManager requestWhenInUseAuthorization];
  }

  // Start observing location
  [_locationManager startUpdatingLocation];
}

#pragma mark - Timeout handler

- (void)timeout:(NSTimer *)timer
{
  RCTLocationRequest *request = timer.userInfo;
  NSString *message = [NSString stringWithFormat: @"Unable to fetch location within %zds.", (NSInteger)(timer.timeInterval * 1000.0)];
  request.errorBlock(@[RCTPositionError(RCTPositionErrorTimeout, message)]);
  [_pendingRequests removeObject:request];

  // Stop updating if no pending requests
  if (_pendingRequests.count == 0 && !_observingLocation) {
    [_locationManager stopUpdatingLocation];
  }
}

#pragma mark - Public API

RCT_EXPORT_METHOD(startObserving:(RCTLocationOptions)options)
{
  [self checkLocationConfig];

  // Select best options
  _observerOptions = options;
  for (RCTLocationRequest *request in _pendingRequests) {
    _observerOptions.accuracy = MIN(_observerOptions.accuracy, request.options.accuracy);
  }

  _locationManager.desiredAccuracy = _observerOptions.accuracy;
  [self beginLocationUpdates];
  _observingLocation = YES;
}

RCT_EXPORT_METHOD(stopObserving)
{
  // Stop observing
  _observingLocation = NO;

  // Stop updating if no pending requests
  if (_pendingRequests.count == 0) {
    [_locationManager stopUpdatingLocation];
  }
}

RCT_EXPORT_METHOD(getCurrentPosition:(RCTLocationOptions)options
                  withSuccessCallback:(RCTResponseSenderBlock)successBlock
                  errorCallback:(RCTResponseSenderBlock)errorBlock)
{
  [self checkLocationConfig];

  if (!successBlock) {
    RCTLogError(@"%@.getCurrentPosition called with nil success parameter.", [self class]);
    return;
  }

  if (![CLLocationManager locationServicesEnabled]) {
    if (errorBlock) {
      errorBlock(@[
        RCTPositionError(RCTPositionErrorUnavailable, @"Location services disabled.")
      ]);
      return;
    }
  }

  if ([CLLocationManager authorizationStatus] == kCLAuthorizationStatusDenied) {
    if (errorBlock) {
      errorBlock(@[
        RCTPositionError(RCTPositionErrorDenied, nil)
      ]);
      return;
    }
  }

  // Check if previous recorded location exists and is good enough
  if (_lastLocationEvent &&
      CFAbsoluteTimeGetCurrent() - [RCTConvert NSTimeInterval:_lastLocationEvent[@"timestamp"]] < options.maximumAge &&
      [_lastLocationEvent[@"coords"][@"accuracy"] doubleValue] >= options.accuracy) {

    // Call success block with most recent known location
    successBlock(@[_lastLocationEvent]);
    return;
  }

  // Create request
  RCTLocationRequest *request = [RCTLocationRequest new];
  request.successBlock = successBlock;
  request.errorBlock = errorBlock ?: ^(NSArray *args){};
  request.options = options;
  request.timeoutTimer = [NSTimer scheduledTimerWithTimeInterval:options.timeout
                                                          target:self
                                                        selector:@selector(timeout:)
                                                        userInfo:request
                                                         repeats:NO];
  [_pendingRequests addObject:request];

  // Configure location manager and begin updating location
  _locationManager.desiredAccuracy = MIN(_locationManager.desiredAccuracy, options.accuracy);
  [self beginLocationUpdates];
}

#pragma mark - CLLocationManagerDelegate

- (void)locationManager:(CLLocationManager *)manager
     didUpdateLocations:(NSArray<CLLocation *> *)locations
{
  // Create event
  CLLocation *location = locations.lastObject;
  _lastLocationEvent = @{
    @"coords": @{
      @"latitude": @(location.coordinate.latitude),
      @"longitude": @(location.coordinate.longitude),
      @"altitude": @(location.altitude),
      @"accuracy": @(location.horizontalAccuracy),
      @"altitudeAccuracy": @(location.verticalAccuracy),
      @"heading": @(location.course),
      @"speed": @(location.speed),
    },
    @"timestamp": @(CFAbsoluteTimeGetCurrent() * 1000.0) // in ms
  };

  // Send event
  if (_observingLocation) {
    [_bridge.eventDispatcher sendDeviceEventWithName:@"geolocationDidChange"
                                                body:_lastLocationEvent];
  }

  // Fire all queued callbacks
  for (RCTLocationRequest *request in _pendingRequests) {
    request.successBlock(@[_lastLocationEvent]);
    [request.timeoutTimer invalidate];
  }
  [_pendingRequests removeAllObjects];

  // Stop updating if not not observing
  if (!_observingLocation) {
    [_locationManager stopUpdatingLocation];
  }

  // Reset location accuracy if desiredAccuracy is changed.
  // Otherwise update accuracy will force triggering didUpdateLocations, watchPosition would keeping receiving location updates, even there's no location changes.
  if (ABS(_locationManager.desiredAccuracy - RCT_DEFAULT_LOCATION_ACCURACY) > 0.000001) {
    _locationManager.desiredAccuracy = RCT_DEFAULT_LOCATION_ACCURACY;
  }
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
  // Check error type
  NSDictionary *jsError = nil;
  switch (error.code) {
    case kCLErrorDenied:
      jsError = RCTPositionError(RCTPositionErrorDenied, nil);
      break;
    case kCLErrorNetwork:
      jsError = RCTPositionError(RCTPositionErrorUnavailable, @"Unable to retrieve location due to a network failure");
      break;
    case kCLErrorLocationUnknown:
    default:
      jsError = RCTPositionError(RCTPositionErrorUnavailable, nil);
      break;
  }

  // Send event
  if (_observingLocation) {
    [_bridge.eventDispatcher sendDeviceEventWithName:@"geolocationError"
                                                body:jsError];
  }

  // Fire all queued error callbacks
  for (RCTLocationRequest *request in _pendingRequests) {
    request.errorBlock(@[jsError]);
    [request.timeoutTimer invalidate];
  }
  [_pendingRequests removeAllObjects];

  // Reset location accuracy if desiredAccuracy is changed.
  // Otherwise update accuracy will force triggering didUpdateLocations, watchPosition would keeping receiving location updates, even there's no location changes.
  if (ABS(_locationManager.desiredAccuracy - RCT_DEFAULT_LOCATION_ACCURACY) > 0.000001) {
    _locationManager.desiredAccuracy = RCT_DEFAULT_LOCATION_ACCURACY;
  }
}

- (void)checkLocationConfig
{
  if (![[NSBundle mainBundle] objectForInfoDictionaryKey:@"NSLocationWhenInUseUsageDescription"]) {
    RCTLogError(@"NSLocationWhenInUseUsageDescription key must be present in Info.plist to use geolocation.");
  }
}

@end
