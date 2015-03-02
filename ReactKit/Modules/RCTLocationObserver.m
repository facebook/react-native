// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTLocationObserver.h"

#import <CoreLocation/CLLocationManager.h>
#import <CoreLocation/CLLocationManagerDelegate.h>

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"
#import "RCTLog.h"

// TODO (#5906496): Shouldn't these be configurable?
const CLLocationAccuracy RCTLocationAccuracy = 500.0; // meters

@interface RCTPendingLocationRequest : NSObject

@property (nonatomic, copy) RCTResponseSenderBlock successBlock;
@property (nonatomic, copy) RCTResponseSenderBlock errorBlock;

@end

@implementation RCTPendingLocationRequest @end

@interface RCTLocationObserver () <CLLocationManagerDelegate>

@end

@implementation RCTLocationObserver
{
  CLLocationManager *_locationManager;
  NSDictionary *_lastLocationEvent;
  NSMutableDictionary *_pendingRequests;
}

@synthesize bridge = _bridge;

#pragma mark - Lifecycle

- (instancetype)init
{
  if ((self = [super init])) {
    _pendingRequests = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)dealloc
{
  [_locationManager stopUpdatingLocation];
}

#pragma mark - Public API

- (void)startObserving
{
  RCT_EXPORT();

  dispatch_async(dispatch_get_main_queue(), ^{

    // Create the location manager if this object does not
    // already have one, and it must be created and accessed
    // on the main thread
    if (nil == _locationManager) {
      _locationManager = [[CLLocationManager alloc] init];
    }

    _locationManager.delegate = self;
    _locationManager.desiredAccuracy = RCTLocationAccuracy;

    // Set a movement threshold for new events.
    _locationManager.distanceFilter = RCTLocationAccuracy; // meters

    if([_locationManager respondsToSelector:@selector(requestWhenInUseAuthorization)]) {
      [_locationManager requestWhenInUseAuthorization];
    }

    [_locationManager startUpdatingLocation];

  });
}

- (void)stopObserving
{
  RCT_EXPORT();

  dispatch_async(dispatch_get_main_queue(), ^{
    [_locationManager stopUpdatingLocation];
    _lastLocationEvent = nil;
  });
}

#pragma mark - CLLocationManagerDelegate

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray *)locations
{
  CLLocation *loc = [locations lastObject];
  NSDictionary *event = @{
    @"coords": @{
      @"latitude": @(loc.coordinate.latitude),
      @"longitude": @(loc.coordinate.longitude),
      @"altitude": @(loc.altitude),
      @"accuracy": @(RCTLocationAccuracy),
      @"altitudeAccuracy": @(RCTLocationAccuracy),
      @"heading": @(loc.course),
      @"speed": @(loc.speed),
    },
    @"timestamp": @(CACurrentMediaTime())
  };
  [_bridge.eventDispatcher sendDeviceEventWithName:@"geoLocationDidChange" body:event];
  NSArray *pendingRequestsCopy;

  // TODO (#5906496): is this locking neccessary? If so, use something better than @synchronize
  @synchronized(self) {

    pendingRequestsCopy = [_pendingRequests allValues];
    [_pendingRequests removeAllObjects];

    _lastLocationEvent = event;
  }

  for (RCTPendingLocationRequest *request in pendingRequestsCopy) {
    if (request.successBlock) {
      request.successBlock(@[event]);
    }
  }
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error
{
  NSArray *pendingRequestsCopy;

  // TODO (#5906496): is this locking neccessary? If so, use something better than @synchronize
  @synchronized(self) {
    pendingRequestsCopy = [_pendingRequests allValues];
    [_pendingRequests removeAllObjects];
  }

  NSString *errorMsg = @"User denied location service or location service not available.";
  for (RCTPendingLocationRequest *request in pendingRequestsCopy) {
    if (request.errorBlock) {
      request.errorBlock(@[errorMsg]);
    }
  }
}

- (void)getCurrentPosition:(RCTResponseSenderBlock)geoSuccess withErrorCallback:(RCTResponseSenderBlock)geoError
{
  RCT_EXPORT();

  NSDictionary *lastLocationCopy;
  // TODO (#5906496): is this locking neccessary? If so, use something better than @synchronize
  @synchronized(self) {
    if (![CLLocationManager locationServicesEnabled] || [CLLocationManager authorizationStatus] == kCLAuthorizationStatusDenied) {
      if (geoError) {
        NSString *errorMsg = @"User denied location service or location service not available.";
        geoError(@[errorMsg]);
        return;
      }
    }

    // If a request for the current position comes in before the OS has informed us, we wait for the first
    // OS event and then call our callbacks.  This obviates the need for handling of the otherwise
    // common failure case of requesting the geolocation until it succeeds, assuming we would have
    // instead returned an error if it wasn't yet available.
    if (!_lastLocationEvent) {
      NSInteger requestID = [_pendingRequests count];
      RCTPendingLocationRequest *request = [[RCTPendingLocationRequest alloc] init];
      request.successBlock = geoSuccess;
      request.errorBlock = geoError;
      _pendingRequests[@(requestID)] = request;
      return;
    } else {
      lastLocationCopy = [_lastLocationEvent copy];
    }
  }
  if (geoSuccess) {
    geoSuccess(@[lastLocationCopy]);
  }
}

@end
