/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTLinkingManager.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

NSString *const RCTOpenURLNotification = @"RCTOpenURLNotification";

@implementation RCTLinkingManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleOpenURLNotification:)
                                                 name:RCTOpenURLNotification
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
  NSDictionary *payload = @{@"url": [url absoluteString]};
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTOpenURLNotification
                                                      object:self
                                                    userInfo:payload];
  return YES;
}

- (void)handleOpenURLNotification:(NSNotification *)notification
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"openURL"
                                              body:[notification userInfo]];
}

RCT_EXPORT_METHOD(openURL:(NSURL *)url)
{
  [[UIApplication sharedApplication] openURL:url];
}

RCT_EXPORT_METHOD(canOpenURL:(NSURL *)url
                  callback:(RCTResponseSenderBlock)callback)
{
  BOOL supported = [[UIApplication sharedApplication] canOpenURL:url];
  callback(@[@(supported)]);
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"initialURL": [[_bridge.launchOptions objectForKey:UIApplicationLaunchOptionsURLKey] absoluteString] ?: [NSNull null]
  };
}

@end
