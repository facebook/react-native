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
NSString *const RCTOpenURLNotification = @"RCTOpenURLNotification";

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

+ (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
#ifdef __IPHONE_8_0
  [application registerForRemoteNotifications];
#endif
}

+ (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationReceived
                                                      object:self
                                                    userInfo:notification];
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

/**
 * Update the application icon badge number on the home screen
 */
+ (void)setApplicationIconBadgeNumber:(NSInteger)number
{
  RCT_EXPORT();

  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [self requestPermissions];
  });

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

#ifdef __IPHONE_8_0
    UIUserNotificationType types = UIUserNotificationTypeSound | UIUserNotificationTypeBadge | UIUserNotificationTypeAlert;
    UIUserNotificationSettings *notificationSettings = [UIUserNotificationSettings settingsForTypes:types categories:nil];
    [[UIApplication sharedApplication] registerUserNotificationSettings:notificationSettings];
#else
    [[UIApplication sharedApplication] registerForRemoteNotificationTypes:(UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound | UIRemoteNotificationTypeAlert)];
#endif
}

+ (void)checkPermissions:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  NSMutableDictionary *permissions = [[NSMutableDictionary alloc] init];
#ifdef __IPHONE_8_0
  UIUserNotificationType types = [[[UIApplication sharedApplication] currentUserNotificationSettings] types];
  permissions[@"alert"] = @((BOOL)(types & UIUserNotificationTypeAlert));
  permissions[@"badge"] = @((BOOL)(types & UIUserNotificationTypeBadge));
  permissions[@"sound"] = @((BOOL)(types & UIUserNotificationTypeSound));
#else
  UIRemoteNotificationType types = [[UIApplication sharedApplication] enabledRemoteNotificationTypes];
  permissions[@"alert"] = @((BOOL)(types & UIRemoteNotificationTypeAlert));
  permissions[@"badge"] = @((BOOL)(types & UIRemoteNotificationTypeBadge));
  permissions[@"sound"] = @((BOOL)(types & UIRemoteNotificationTypeSound));
#endif

  callback(@[permissions]);
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"initialNotification": _initialNotification ?: [NSNull null]
  };
}

@end
