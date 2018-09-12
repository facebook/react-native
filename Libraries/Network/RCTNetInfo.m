/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTNetInfo.h"

#if !TARGET_OS_TV
  #import <CoreTelephony/CTTelephonyNetworkInfo.h>
#endif
#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTEventDispatcher.h>

// Based on the ConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const RCTConnectionTypeUnknown = @"unknown";
static NSString *const RCTConnectionTypeNone = @"none";
static NSString *const RCTConnectionTypeWifi = @"wifi";
static NSString *const RCTConnectionTypeCellular = @"cellular";

// Based on the EffectiveConnectionType enum described in the W3C Network Information API spec
// (https://wicg.github.io/netinfo/).
static NSString *const RCTEffectiveConnectionTypeUnknown = @"unknown";
static NSString *const RCTEffectiveConnectionType2g = @"2g";
static NSString *const RCTEffectiveConnectionType3g = @"3g";
static NSString *const RCTEffectiveConnectionType4g = @"4g";

// The RCTReachabilityState* values are deprecated.
static NSString *const RCTReachabilityStateUnknown = @"unknown";
static NSString *const RCTReachabilityStateNone = @"none";
static NSString *const RCTReachabilityStateWifi = @"wifi";
static NSString *const RCTReachabilityStateCell = @"cell";

@implementation RCTNetInfo
{
  SCNetworkReachabilityRef _firstTimeReachability;
  SCNetworkReachabilityRef _reachability;
  NSString *_connectionType;
  NSString *_effectiveConnectionType;
  NSString *_statusDeprecated;
  NSString *_host;
  BOOL _isObserving;
  RCTPromiseResolveBlock _resolve;
}

RCT_EXPORT_MODULE()

static void RCTReachabilityCallback(__unused SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *info)
{
  RCTNetInfo *self = (__bridge id)info;
  BOOL didSetReachabilityFlags = [self setReachabilityStatus:flags];
  if (self->_firstTimeReachability && self->_resolve) {
    SCNetworkReachabilityUnscheduleFromRunLoop(self->_firstTimeReachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    CFRelease(self->_firstTimeReachability);
    self->_resolve(@{@"connectionType": self->_connectionType ?: RCTConnectionTypeUnknown,
                     @"effectiveConnectionType": self->_effectiveConnectionType ?: RCTEffectiveConnectionTypeUnknown,
                     @"network_info": self->_statusDeprecated ?: RCTReachabilityStateUnknown});
    self->_firstTimeReachability = nil;
    self->_resolve = nil;
  }

  if (didSetReachabilityFlags && self->_isObserving) {
    [self sendEventWithName:@"networkStatusDidChange" body:@{@"connectionType": self->_connectionType,
                                                             @"effectiveConnectionType": self->_effectiveConnectionType,
                                                             @"network_info": self->_statusDeprecated}];
  }
}

#pragma mark - Lifecycle

- (instancetype)initWithHost:(NSString *)host
{
  RCTAssertParam(host);
  RCTAssert(![host hasPrefix:@"http"], @"Host value should just contain the domain, not the URL scheme.");

  if ((self = [self init])) {
    _host = [host copy];
  }
  return self;
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"networkStatusDidChange"];
}

- (void)startObserving
{
  _isObserving = YES;
  _connectionType = RCTConnectionTypeUnknown;
  _effectiveConnectionType = RCTEffectiveConnectionTypeUnknown;
  _statusDeprecated = RCTReachabilityStateUnknown;
  _reachability = [self getReachabilityRef];
}

- (void)stopObserving
{
  _isObserving = NO;
  if (_reachability) {
    SCNetworkReachabilityUnscheduleFromRunLoop(_reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    CFRelease(_reachability);
  }
}

- (SCNetworkReachabilityRef)getReachabilityRef
{
  SCNetworkReachabilityRef reachability = SCNetworkReachabilityCreateWithName(kCFAllocatorDefault, _host.UTF8String ?: "apple.com");
  SCNetworkReachabilityContext context = { 0, ( __bridge void *)self, NULL, NULL, NULL };
  SCNetworkReachabilitySetCallback(reachability, RCTReachabilityCallback, &context);
  SCNetworkReachabilityScheduleWithRunLoop(reachability, CFRunLoopGetMain(), kCFRunLoopCommonModes);
    
  return reachability;
}

- (BOOL)setReachabilityStatus:(SCNetworkReachabilityFlags)flags
{
  NSString *connectionType = RCTConnectionTypeUnknown;
  NSString *effectiveConnectionType = RCTEffectiveConnectionTypeUnknown;
  NSString *status = RCTReachabilityStateUnknown;
  if ((flags & kSCNetworkReachabilityFlagsReachable) == 0 ||
      (flags & kSCNetworkReachabilityFlagsConnectionRequired) != 0) {
    connectionType = RCTConnectionTypeNone;
    status = RCTReachabilityStateNone;
  }
  
#if !TARGET_OS_TV
  
  else if ((flags & kSCNetworkReachabilityFlagsIsWWAN) != 0) {
    connectionType = RCTConnectionTypeCellular;
    status = RCTReachabilityStateCell;
    
    CTTelephonyNetworkInfo *netinfo = [[CTTelephonyNetworkInfo alloc] init];
    if (netinfo) {
      if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyGPRS] ||
          [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyEdge] ||
          [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMA1x]) {
        effectiveConnectionType = RCTEffectiveConnectionType2g;
      } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyWCDMA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSDPA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyHSUPA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORev0] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevA] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyCDMAEVDORevB] ||
                 [netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyeHRPD]) {
        effectiveConnectionType = RCTEffectiveConnectionType3g;
      } else if ([netinfo.currentRadioAccessTechnology isEqualToString:CTRadioAccessTechnologyLTE]) {
        effectiveConnectionType = RCTEffectiveConnectionType4g;
      }
    }
  }
  
#endif
  
  else {
    connectionType = RCTConnectionTypeWifi;
    status = RCTReachabilityStateWifi;
  }
  
  if (![connectionType isEqualToString:self->_connectionType] ||
      ![effectiveConnectionType isEqualToString:self->_effectiveConnectionType] ||
      ![status isEqualToString:self->_statusDeprecated]) {
    self->_connectionType = connectionType;
    self->_effectiveConnectionType = effectiveConnectionType;
    self->_statusDeprecated = status;
    return YES;
  }
  
  return NO;
}

#pragma mark - Public API

RCT_EXPORT_METHOD(getCurrentConnectivity:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
  _firstTimeReachability = [self getReachabilityRef];
  _resolve = resolve;
}

@end
