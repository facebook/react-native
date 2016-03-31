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
#import "RCTUtils.h"

NSString *const RCTOpenURLNotification = @"RCTOpenURLNotification";

@implementation RCTLinkingManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleOpenURLNotification:)
                                               name:RCTOpenURLNotification
                                             object:nil];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSURL *initialURL;

  if (_bridge.launchOptions[UIApplicationLaunchOptionsURLKey]) {
    initialURL = _bridge.launchOptions[UIApplicationLaunchOptionsURLKey];
  } else if (&UIApplicationLaunchOptionsUserActivityDictionaryKey &&
      _bridge.launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey]) {
    NSDictionary *userActivityDictionary = _bridge.launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey];

    if ([userActivityDictionary[UIApplicationLaunchOptionsUserActivityTypeKey] isEqual:NSUserActivityTypeBrowsingWeb]) {
      initialURL = ((NSUserActivity *)userActivityDictionary[@"UIApplicationLaunchOptionsUserActivityKey"]).webpageURL;
    }
  }

  return @{@"initialURL": RCTNullIfNil(initialURL.absoluteString)};
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
  NSDictionary<NSString *, id> *payload = @{@"url": URL.absoluteString};
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTOpenURLNotification
                                                      object:self
                                                    userInfo:payload];
  return YES;
}

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
  restorationHandler:(void (^)(NSArray *))restorationHandler
{
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
    NSDictionary *payload = @{@"url": userActivity.webpageURL.absoluteString};
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTOpenURLNotification
                                                        object:self
                                                      userInfo:payload];
  }
  return YES;
}

- (void)handleOpenURLNotification:(NSNotification *)notification
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"openURL"
                                              body:notification.userInfo];
}

RCT_EXPORT_METHOD(openURL:(NSURL *)URL
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
  BOOL opened = [RCTSharedApplication() openURL:URL];
  resolve(@(opened));
}

RCT_EXPORT_METHOD(canOpenURL:(NSURL *)URL
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
  if (RCTRunningInAppExtension()) {
    // Technically Today widgets can open urls, but supporting that would require
    // a reference to the NSExtensionContext
    resolve(@NO);
    return;
  }

  // This can be expensive, so we deliberately don't call on main thread
  BOOL canOpen = [RCTSharedApplication() canOpenURL:URL];
  resolve(@(canOpen));
}

@end
