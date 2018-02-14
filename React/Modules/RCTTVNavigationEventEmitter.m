/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTVNavigationEventEmitter.h"

NSString *const RCTTVNavigationEventNotification = @"RCTTVNavigationEventNotification";

static NSString *const TVNavigationEventName = @"onTVNavEvent";

@implementation RCTTVNavigationEventEmitter

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleTVNavigationEventNotification:)
                                                 name:RCTTVNavigationEventNotification
                                               object:nil];

  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[TVNavigationEventName];
}

- (void)handleTVNavigationEventNotification:(NSNotification *)notif
{
  [self sendEventWithName:TVNavigationEventName body:notif.object];
}

@end
