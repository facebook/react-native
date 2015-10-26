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
#import "RCTConvert.h"
#import "RCTEventDispatcher.h"
#import "RCTUtils.h"

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

#define UIUserNotificationTypeAlert UIRemoteNotificationTypeAlert
#define UIUserNotificationTypeBadge UIRemoteNotificationTypeBadge
#define UIUserNotificationTypeSound UIRemoteNotificationTypeSound
#define UIUserNotificationTypeNone  UIRemoteNotificationTypeNone
#define UIUserNotificationType      UIRemoteNotificationType

#endif

NSString *const RCTRemoteNotificationReceived = @"RemoteNotificationReceived";
NSString *const RCTRemoteNotificationsRegistered = @"RemoteNotificationsRegistered";
NSString *const RCTLocalNotificationReceived = @"LocalNotificationReceived";

@implementation RCTConvert (UILocalNotification)

+ (UILocalNotification *)UILocalNotification:(id)json
{
  NSDictionary *details = [self NSDictionary:json];
  UILocalNotification *notification = [UILocalNotification new];
  notification.fireDate = [RCTConvert NSDate:details[@"fireDate"]] ?: [NSDate date];
  notification.alertBody = [RCTConvert NSString:details[@"alertBody"]] ?: nil;
  notification.soundName = [RCTConvert NSString:details[@"soundName"]] ?: nil;
  notification.applicationIconBadgeNumber
  = [RCTConvert NSInteger:details[@"badgeCount"]] ?: nil;
  notification.userInfo = [RCTConvert NSDictionary:details[@"userInfo"]] ?: nil;
  if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 8.0) {
    notification.category = [RCTConvert NSString:details[@"category"]] ?: nil;
  }
  return notification;
}

@end

@implementation RCTPushNotificationManager
{
  NSDictionary *_initialNotification;
}

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleRemoteNotificationReceived:)
                                                 name:RCTRemoteNotificationReceived
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleRemoteNotificationsRegistered:)
                                                 name:RCTRemoteNotificationsRegistered
                                               object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(handleLocalNotificationReceived:)
                                                 name:RCTLocalNotificationReceived
                                               object:nil];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;

  if (bridge.launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey]) {
    _initialNotification =
      [bridge.launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey] copy];
  } else if (bridge.launchOptions[UIApplicationLaunchOptionsLocalNotificationKey]) {
    UILocalNotification *localNotification =
      [bridge.launchOptions[UIApplicationLaunchOptionsLocalNotificationKey] copy];

    _initialNotification = [RCTPushNotificationManager extractLocalNotificationData:localNotification withActionIdentifier:nil];
  }
}

+ (void)application:(__unused UIApplication *)application didRegisterUserNotificationSettings:(__unused UIUserNotificationSettings *)notificationSettings
{
  if ([application respondsToSelector:@selector(registerForRemoteNotifications)]) {
    [application registerForRemoteNotifications];
  }
}

+ (void)application:(__unused UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  NSMutableString *hexString = [NSMutableString string];
  NSUInteger deviceTokenLength = deviceToken.length;
  const unsigned char *bytes = deviceToken.bytes;
  for (NSUInteger i = 0; i < deviceTokenLength; i++) {
    [hexString appendFormat:@"%02x", bytes[i]];
  }
  NSDictionary *userInfo = @{
    @"deviceToken" : [hexString copy]
  };
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationsRegistered
                                                      object:self
                                                    userInfo:userInfo];
}

+ (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)inputUserInfo
{

  NSMutableDictionary *userInfo = [NSMutableDictionary dictionaryWithDictionary:inputUserInfo];
  if (application.applicationState == UIApplicationStateActive)
  {
    // Indicate that this was sent while the application was in the background
    [userInfo setObject: @"active" forKey: @"applicationState"];
  }
  else
  {
    // Indicate that this was sent while the application was in the background
    [userInfo setObject: @"background" forKey: @"applicationState"];
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationReceived
                                                      object:self
                                                    userInfo:userInfo];
}

- (void)handleRemoteNotificationReceived:(NSNotification *)notification
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"remoteNotificationReceived"
                                              body:notification.userInfo];
}

- (void)handleRemoteNotificationsRegistered:(NSNotification *)notification
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"remoteNotificationsRegistered"
                                              body:notification.userInfo];
}

+ (NSDictionary*)extractLocalNotificationData:(UILocalNotification *)localNotification withActionIdentifier:(nullable NSString *)identifier {
  NSDictionary *baseNotificationData = @{
    @"aps": @{
      @"alert": localNotification.alertBody,
      @"sound": localNotification.soundName?: @"",
      @"badge": @(localNotification.applicationIconBadgeNumber)
 ?: @0
    },
    @"userInfo": localNotification.userInfo
  };

  NSMutableDictionary *notificationData = [NSMutableDictionary dictionaryWithDictionary:baseNotificationData];

  if (localNotification.fireDate) {
    [notificationData setObject:[NSString stringWithFormat:@"%d",(int)[localNotification.fireDate timeIntervalSince1970]]
                         forKey: @"fireDate"];
  }

  if (identifier) {
    [notificationData setObject:identifier forKey:@"actionIdentifier"];
  }

  return notificationData;
}

+ (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)localNotification withActionIdentifier:(nullable NSString *)identifier {
  NSDictionary *baseNotificationData = [RCTPushNotificationManager extractLocalNotificationData:localNotification withActionIdentifier:identifier];
  NSMutableDictionary *notificationData = [NSMutableDictionary dictionaryWithDictionary:baseNotificationData];

  if (application.applicationState == UIApplicationStateActive)
  {
    // Indicate that this was sent while the application was in the background
    [notificationData setObject: @"active" forKey: @"applicationState"];
  }
  else
  {
    // Indicate that this was sent while the application was in the background
    [notificationData setObject: @"background" forKey: @"applicationState"];
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTLocalNotificationReceived
                                                      object:self
                                                    userInfo:notificationData];
}

/* note(brentvatne): */
/* Could rewrite this as pop as well, just would need to clear the _initialNotification value */
RCT_EXPORT_METHOD(getInitialNotification:(RCTResponseSenderBlock)callback)
{
  callback(@[
     RCTNullIfNil(_initialNotification)
   ]);
}


- (void)handleLocalNotificationReceived:(NSNotification *)notification
{
  /* TODO(brentvatne): */
  /* Need to check if it has an action associated with it and only set as initialNotification
   * in that case. Revisit later, time constrained at moment and is harmless */
  _initialNotification = [notification userInfo];
  [_bridge.eventDispatcher sendDeviceEventWithName:@"localNotificationReceived"
                                              body:[notification userInfo]];
}

/**
 * Update the application icon badge number on the home screen
 */
RCT_EXPORT_METHOD(setApplicationIconBadgeNumber:(NSInteger)number)
{
  RCTSharedApplication().applicationIconBadgeNumber = number;
}

/**
 * Get the current application icon badge number on the home screen
 */
RCT_EXPORT_METHOD(getApplicationIconBadgeNumber:(RCTResponseSenderBlock)callback)
{
  callback(@[
    @(RCTSharedApplication().applicationIconBadgeNumber)
  ]);
}

RCT_EXPORT_METHOD(requestPermissions:(NSDictionary *)permissions)
{
  if (RCTRunningInAppExtension()) {
    return;
  }

  UIUserNotificationType types = UIUserNotificationTypeNone;
  if (permissions) {
    if ([permissions[@"alert"] boolValue]) {
      types |= UIUserNotificationTypeAlert;
    }
    if ([permissions[@"badge"] boolValue]) {
      types |= UIUserNotificationTypeBadge;
    }
    if ([permissions[@"sound"] boolValue]) {
      types |= UIUserNotificationTypeSound;
    }
  } else {
    types = UIUserNotificationTypeAlert | UIUserNotificationTypeBadge | UIUserNotificationTypeSound;
  }

  // This code will work in iOS 8.0 xcode 6.0 or later:
  if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 8.0)
  {
    id notificationSettings = [UIUserNotificationSettings settingsForTypes:types categories:nil];
    [[UIApplication sharedApplication] registerUserNotificationSettings:notificationSettings];
    [[UIApplication sharedApplication] registerForRemoteNotifications];
  }
  // This code will work in iOS 7.0 and below:
  else
  {
    [[UIApplication sharedApplication] registerForRemoteNotificationTypes:types];
  }
}

RCT_EXPORT_METHOD(abandonPermissions)
{
  [RCTSharedApplication() unregisterForRemoteNotifications];
}

RCT_EXPORT_METHOD(checkPermissions:(RCTResponseSenderBlock)callback)
{
  if (RCTRunningInAppExtension()) {
    NSDictionary *permissions = @{@"alert": @(NO), @"badge": @(NO), @"sound": @(NO)};
    callback(@[permissions]);
    return;
  }

  NSUInteger types = 0;
  if ([UIApplication instancesRespondToSelector:@selector(currentUserNotificationSettings)]) {
    types = [RCTSharedApplication() currentUserNotificationSettings].types;
  } else {

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

    types = [RCTSharedApplication() enabledRemoteNotificationTypes];

#endif

  }

  NSMutableDictionary *permissions = [NSMutableDictionary new];
  permissions[@"alert"] = @((types & UIUserNotificationTypeAlert) > 0);
  permissions[@"badge"] = @((types & UIUserNotificationTypeBadge) > 0);
  permissions[@"sound"] = @((types & UIUserNotificationTypeSound) > 0);

  callback(@[permissions]);
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"initialNotification": RCTNullIfNil(_initialNotification),
  };
}

RCT_EXPORT_METHOD(presentLocalNotification:(UILocalNotification *)notification)
{
  [RCTSharedApplication() presentLocalNotificationNow:notification];
}

RCT_EXPORT_METHOD(scheduleLocalNotification:(UILocalNotification *)notification)
{
  [RCTSharedApplication() scheduleLocalNotification:notification];
}

RCT_EXPORT_METHOD(cancelAllLocalNotifications)
{
  [RCTSharedApplication() cancelAllLocalNotifications];
}

RCT_EXPORT_METHOD(registerNotificationActionsForCategory:(NSDictionary*)actionsForCategory)
{
  if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 8.0 && actionsForCategory) {
    UIMutableUserNotificationAction *action1;
    action1 = [[UIMutableUserNotificationAction alloc] init];
    [action1 setActivationMode:UIUserNotificationActivationModeBackground];
    [action1 setTitle:actionsForCategory[@"firstActionTitle"]];
    [action1 setIdentifier:actionsForCategory[@"firstActionId"]];
    [action1 setDestructive:NO];
    [action1 setAuthenticationRequired:YES];

    UIMutableUserNotificationAction *action2;
    action2 = [[UIMutableUserNotificationAction alloc] init];
    [action2 setActivationMode:UIUserNotificationActivationModeBackground];
    [action2 setTitle:actionsForCategory[@"secondActionTitle"]];
    [action2 setIdentifier:actionsForCategory[@"secondActionId"]];
    [action2 setDestructive:NO];
    [action2 setAuthenticationRequired:YES];

    UIMutableUserNotificationCategory *actionCategory;
    actionCategory = [[UIMutableUserNotificationCategory alloc] init];
    [actionCategory setIdentifier:actionsForCategory[@"categoryId"]];
    [actionCategory setActions:@[action1, action2]
                    forContext:UIUserNotificationActionContextDefault];

    NSSet *categories = [NSSet setWithObject:actionCategory];

    UIUserNotificationType types = [[[UIApplication sharedApplication] currentUserNotificationSettings] types];

    UIUserNotificationSettings *settings;
    settings = [UIUserNotificationSettings settingsForTypes:types
                                                 categories:categories];

    [[UIApplication sharedApplication] registerUserNotificationSettings:settings];
    [[UIApplication sharedApplication] registerForRemoteNotifications];
  }
}

RCT_EXPORT_METHOD(cancelLocalNotifications)
{
  // Cancel all scheduled local notifications
  [[UIApplication sharedApplication] cancelAllLocalNotifications];
}

@end
