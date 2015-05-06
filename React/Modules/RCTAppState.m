/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAppState.h"

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

static NSString *RCTCurrentAppBackgroundState()
{
  static NSDictionary *states;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    states = @{
      @(UIApplicationStateActive): @"active",
      @(UIApplicationStateBackground): @"background",
      @(UIApplicationStateInactive): @"inactive"
    };
  });

  return states[@([[UIApplication sharedApplication] applicationState])] ?: @"unknown";
}

@implementation RCTAppState
{
  NSString *_lastKnownState;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

#pragma mark - Lifecycle

- (instancetype)init
{
  if ((self = [super init])) {

    _lastKnownState = RCTCurrentAppBackgroundState();

    for (NSString *name in @[UIApplicationDidBecomeActiveNotification,
                             UIApplicationDidEnterBackgroundNotification,
                             UIApplicationDidFinishLaunchingNotification]) {

      [[NSNotificationCenter defaultCenter] addObserver:self
                                               selector:@selector(handleAppStateDidChange)
                                                   name:name
                                                 object:nil];
    }
  }
  return self;
}


- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - App Notification Methods

- (void)handleAppStateDidChange
{
  NSString *newState = RCTCurrentAppBackgroundState();
  if (![newState isEqualToString:_lastKnownState]) {
    _lastKnownState = newState;
    [_bridge.eventDispatcher sendDeviceEventWithName:@"appStateDidChange"
                                                body:@{@"app_state": _lastKnownState}];
  }
}

#pragma mark - Public API

/**
 * Get the current background/foreground state of the app
 */
RCT_EXPORT_METHOD(getCurrentAppState:(RCTResponseSenderBlock)callback
                  error:(__unused RCTResponseSenderBlock)error)
{
  callback(@[@{@"app_state": _lastKnownState}]);
}

@end
