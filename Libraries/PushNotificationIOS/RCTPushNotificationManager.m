/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPushNotificationManager.h"

#import "RCTBridge.h"
#import "RCTEventDispatcher.h"

NSString *const RCTRemoteNotificationReceived = @"RemoteNotificationReceived";

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
                                                 name:RCTRemoteNotificationReceived
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
  if ([application respondsToSelector:@selector(registerForRemoteNotifications)]) {
    [application registerForRemoteNotifications];
  }
}

+ (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationReceived
                                                      object:self
                                                    userInfo:notification];
}

- (void)handleRemoteNotificationReceived:(NSNotification *)notification
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"remoteNotificationReceived"
                                              body:[notification userInfo]];
}

/**
 * Update the application icon badge number on the home screen
 */
+ (void)setApplicationIconBadgeNumber:(NSInteger)number
{
  RCT_EXPORT();

  [UIApplication sharedApplication].applicationIconBadgeNumber = number;
}

/**
 * Get the current application icon badge number on the home screen
 */
+ (void)getApplicationIconBadgeNumber:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  callback(@[
    @([UIApplication sharedApplication].applicationIconBadgeNumber)
  ]);
}

+ (void)requestPermissions
{
  RCT_EXPORT();

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

  // if we are targeting iOS 7, *and* the new UIUserNotificationSettings
  // class is not available, then register using the old mechanism
  if (![UIUserNotificationSettings class]) {
    [[UIApplication sharedApplication] registerForRemoteNotificationTypes:
     UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert];
    return;
  }

#endif

  UIUserNotificationType types = UIUserNotificationTypeSound | UIUserNotificationTypeBadge | UIUserNotificationTypeAlert;
  UIUserNotificationSettings *notificationSettings = [UIUserNotificationSettings settingsForTypes:types categories:nil];
  [[UIApplication sharedApplication] registerUserNotificationSettings:notificationSettings];

}

+ (void)checkPermissions:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  NSMutableDictionary *permissions = [[NSMutableDictionary alloc] init];

  UIUserNotificationType types = [[[UIApplication sharedApplication] currentUserNotificationSettings] types];
  permissions[@"alert"] = @((BOOL)(types & UIUserNotificationTypeAlert));
  permissions[@"badge"] = @((BOOL)(types & UIUserNotificationTypeBadge));
  permissions[@"sound"] = @((BOOL)(types & UIUserNotificationTypeSound));

  callback(@[permissions]);
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"initialNotification": _initialNotification ?: [NSNull null]
  };
}

@end
