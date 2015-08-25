/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTNetInfo.h"

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

static NSString *const RCTReachabilityStateUnknown = @"unknown";
static NSString *const RCTReachabilityStateNone = @"none";
static NSString *const RCTReachabilityStateWifi = @"wifi";
static NSString *const RCTReachabilityStateCell = @"cell";

@implementation RCTNetInfo
{
  SCNetworkReachabilityRef _reachability;
  NSString *_status;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

static void RCTReachabilityCallback(__unused SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *info)
{
  RCTNetInfo *self = (__bridge id)info;
  NSString *status = RCTReachabilityStateUnknown;
  if ((flags & kSCNetworkReachabilityFlagsReachable) == 0 ||
      (flags & kSCNetworkReachabilityFlagsConnectionRequired) != 0) {
    status = RCTReachabilityStateNone;
  }

#if TARGET_OS_IPHONE

  else if ((flags & kSCNetworkReachabilityFlagsIsWWAN) != 0) {
    status = RCTReachabilityStateCell;
  }

#endif

  else {
    status = RCTReachabilityStateWifi;
  }

  if (![status isEqualToString:self->_status]) {
    self->_status = status;
    [self->_bridge.eventDispatcher sendDeviceEventWithName:@"networkDidChange"
                                                      body:@{@"network_info": status}];
  }
}

#pragma mark - Lifecycle

- (instancetype)initWithHost:(NSString *)host
{
  RCTAssertParam(host);
  RCTAssert(![host hasPrefix:@"http"], @"Host value should just contain the domain, not the URL scheme.");

  if ((self = [super init])) {
    _status = RCTReachabilityStateUnknown;
    _reachability = SCNetworkReachabilityCreateWithName(kCFAllocatorDefault, host.UTF8String);
    SCNetworkReachabilityContext context = { 0, ( __bridge void *)self, NULL, NULL, NULL };
    SCNetworkReachabilitySetCallback(_reachability, RCTReachabilityCallback, &context);
    SCNetworkReachabilityScheduleWithRunLoop(_reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
  }
  return self;
}

- (instancetype)init
{
  return [self initWithHost:@"apple.com"];
}

- (void)dealloc
{
  SCNetworkReachabilityUnscheduleFromRunLoop(_reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
  CFRelease(_reachability);
}

#pragma mark - Public API

// TODO: remove error callback - not needed except by Subscribable interface
RCT_EXPORT_METHOD(getCurrentReachability:(RCTResponseSenderBlock)getSuccess
                  withErrorCallback:(__unused RCTResponseSenderBlock)getError)
{
  getSuccess(@[@{@"network_info": _status}]);
}

@end
