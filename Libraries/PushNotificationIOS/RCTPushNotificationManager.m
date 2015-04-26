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
NSString *const RCTRemoteNotificationRegistered = @"RemoteNotificationRegistered";
NSString *const RCTRemoteNotificationRegisteredError = @"RemoteNotificationRegisteredError";

@implementation RCTPushNotificationManager
{
  NSDictionary *_initialNotification;
}

RCT_EXPORT_MODULE()

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
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleRemoteNotificationRegistred:)
                                                 name:RCTRemoteNotificationRegistered
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleRemoteNotificationRegistredError:)
                                                 name:RCTRemoteNotificationRegisteredError
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

+ (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  NSDictionary *payload = @{@"deviceToken": deviceToken};
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationRegistered
                                                      object:self
                                                    userInfo:payload];
}

+ (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationRegisteredError
                                                      object:self
                                                      userInfo:error.userInfo];

}

- (void)handleRemoteNotificationReceived:(NSNotification *)notification
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"remoteNotificationReceived"
                                              body:[notification userInfo]];
}

- (void) handleRemoteNotificationRegistred:(NSNotification *) notification {
  NSDictionary *userInfo = notification.userInfo;
  NSData *deviceToken = [userInfo objectForKey:@"deviceToken"];
  NSString *deviceTokenStr = [[[[deviceToken description]
                                stringByReplacingOccurrencesOfString: @"<" withString: @""]
                               stringByReplacingOccurrencesOfString: @">" withString: @""]
                              stringByReplacingOccurrencesOfString: @" " withString: @""];
  [self.bridge.eventDispatcher sendDeviceEventWithName:@"remoteNotificationRegistered"
                                                  body:deviceTokenStr];
}

- (void) handleRemoteNotificationRegistredError:(NSNotification *) notification {
  NSDictionary *userInfo = notification.userInfo;
  NSString *error = [userInfo objectForKey:@"NSLocalizedDescription"];
  [self.bridge.eventDispatcher sendDeviceEventWithName:@"remoteNotificationRegisteredError"
                                                  body:error];
}

/**
 * Update the application icon badge number on the home screen
 */
RCT_EXPORT_METHOD(setApplicationIconBadgeNumber:(NSInteger)number)
{
  [UIApplication sharedApplication].applicationIconBadgeNumber = number;
}

/**
 * Get the current application icon badge number on the home screen
 */
RCT_EXPORT_METHOD(getApplicationIconBadgeNumber:(RCTResponseSenderBlock)callback)
{
  callback(@[
    @([UIApplication sharedApplication].applicationIconBadgeNumber)
  ]);
}

RCT_EXPORT_METHOD(requestPermissions)
{
  Class _UIUserNotificationSettings;
  if ((_UIUserNotificationSettings = NSClassFromString(@"UIUserNotificationSettings"))) {
    UIUserNotificationType types = UIUserNotificationTypeSound | UIUserNotificationTypeBadge | UIUserNotificationTypeAlert;
    UIUserNotificationSettings *notificationSettings = [_UIUserNotificationSettings settingsForTypes:types categories:nil];
    [[UIApplication sharedApplication] registerUserNotificationSettings:notificationSettings];
  } else {

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

    [[UIApplication sharedApplication] registerForRemoteNotificationTypes:
     UIUserNotificationTypeBadge | UIUserNotificationTypeSound | UIUserNotificationTypeAlert];

#endif

  }
}

RCT_EXPORT_METHOD(checkPermissions:(RCTResponseSenderBlock)callback)
{

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

#define UIUserNotificationTypeAlert UIRemoteNotificationTypeAlert
#define UIUserNotificationTypeBadge UIRemoteNotificationTypeBadge
#define UIUserNotificationTypeSound UIRemoteNotificationTypeSound

#endif

  NSUInteger types = 0;
  if ([UIApplication instancesRespondToSelector:@selector(currentUserNotificationSettings)]) {
    types = [[[UIApplication sharedApplication] currentUserNotificationSettings] types];
  } else {

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

    types = [[UIApplication sharedApplication] enabledRemoteNotificationTypes];

#endif

  }

  NSMutableDictionary *permissions = [[NSMutableDictionary alloc] init];
  permissions[@"alert"] = @((types & UIUserNotificationTypeAlert) > 0);
  permissions[@"badge"] = @((types & UIUserNotificationTypeBadge) > 0);
  permissions[@"sound"] = @((types & UIUserNotificationTypeSound) > 0);

  callback(@[permissions]);
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"initialNotification": _initialNotification ?: [NSNull null]
  };
}

@end
