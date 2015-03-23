/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPushNotificationManager.h"

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

NSString *const RKRemoteNotificationReceived = @"RemoteNotificationReceived";
NSString *const RKOpenURLNotification = @"RKOpenURLNotification";

@implementation RCTPushNotificationManager
{
  NSDictionary *_initialNotification;
}

@synthesize bridge = _bridge;

- (instancetype)init
{
  return [self initWithInitialNotification:nil];
}

- (instancetype)initWithInitialNotification:(NSDictionary *)initialNotification
{
  if ((self = [super init])) {
    _initialNotification = [initialNotification copy];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleRemoteNotificationReceived:)
                                                 name:RKRemoteNotificationReceived
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleOpenURLNotification:)
                                                 name:RKOpenURLNotification
                                               object:nil];
  }
  return self;
}

- (void)handleRemoteNotificationReceived:(NSNotification *)notification
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"remoteNotificationReceived"
                                              body:[notification userInfo]];
}

- (void)handleOpenURLNotification:(NSNotification *)notification
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"openURL"
                                              body:[notification userInfo]];
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"initialNotification": _initialNotification ?: [NSNull null]
  };
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end
