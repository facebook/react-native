/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTPushNotificationManager.h>

#if !TARGET_OS_OSX // TODO(macOS GH#774)
#import <UserNotifications/UserNotifications.h>
#endif // TODO(macOS GH#774)

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTUtils.h>

#import "RCTPushNotificationPlugins.h"

NSString *const RCTRemoteNotificationReceived = @"RemoteNotificationReceived";

static NSString *const kLocalNotificationReceived = @"LocalNotificationReceived";
static NSString *const kRemoteNotificationsRegistered = @"RemoteNotificationsRegistered";
static NSString *const kRemoteNotificationRegistrationFailed = @"RemoteNotificationRegistrationFailed";

static NSString *const kErrorUnableToRequestPermissions = @"E_UNABLE_TO_REQUEST_PERMISSIONS";

#if !TARGET_OS_UIKITFORMAC
@implementation RCTConvert (NSCalendarUnit)

RCT_ENUM_CONVERTER(NSCalendarUnit,
                   (@{
                      @"year": @(NSCalendarUnitYear),
                      @"month": @(NSCalendarUnitMonth),
                      @"week": @(NSCalendarUnitWeekOfYear),
                      @"day": @(NSCalendarUnitDay),
                      @"hour": @(NSCalendarUnitHour),
                      @"minute": @(NSCalendarUnitMinute)
                      }),
                   0,
                   integerValue)

@end

@interface RCTPushNotificationManager () <NativePushNotificationManagerIOSSpec>
@property (nonatomic, strong) NSMutableDictionary *remoteNotificationCallbacks;
@end

@implementation RCTConvert (UILocalNotification)

#if !TARGET_OS_OSX // TODO(macOS GH#774)
+ (UILocalNotification *)UILocalNotification:(id)json
{
  NSDictionary<NSString *, id> *details = [self NSDictionary:json];
  BOOL isSilent = [RCTConvert BOOL:details[@"isSilent"]];
  UILocalNotification *notification = [UILocalNotification new];
  notification.alertTitle = [RCTConvert NSString:details[@"alertTitle"]];
  notification.fireDate = [RCTConvert NSDate:details[@"fireDate"]] ?: [NSDate date];
  notification.alertBody = [RCTConvert NSString:details[@"alertBody"]];
  notification.alertAction = [RCTConvert NSString:details[@"alertAction"]];
  notification.userInfo = [RCTConvert NSDictionary:details[@"userInfo"]];
  notification.category = [RCTConvert NSString:details[@"category"]];
  notification.repeatInterval = [RCTConvert NSCalendarUnit:details[@"repeatInterval"]];
  if (details[@"applicationIconBadgeNumber"]) {
    notification.applicationIconBadgeNumber = [RCTConvert NSInteger:details[@"applicationIconBadgeNumber"]];
  }
  if (!isSilent) {
    notification.soundName = [RCTConvert NSString:details[@"soundName"]] ?: UILocalNotificationDefaultSoundName;
  }
  return notification;
}
#else // [TODO(macOS GH#774)
+ (NSUserNotification *)NSUserNotification:(id)json
{
  NSDictionary<NSString *, id> *details = [self NSDictionary:json];
  BOOL isSilent = [RCTConvert BOOL:details[@"isSilent"]];
  NSUserNotification *notification = [NSUserNotification new];
  notification.deliveryDate = [RCTConvert NSDate:details[@"fireDate"]] ?: [NSDate date];
  notification.informativeText = [RCTConvert NSString:details[@"alertBody"]];
  NSString *title = [RCTConvert NSString:details[@"alertTitle"]];
  if (title) {
    notification.title = title;
  }
  NSString *actionButtonTitle = [RCTConvert NSString:details[@"alertAction"]];
  if (actionButtonTitle) {
    notification.actionButtonTitle = actionButtonTitle;
  }
  notification.userInfo = [RCTConvert NSDictionary:details[@"userInfo"]];
  
  NSCalendarUnit calendarUnit = [RCTConvert NSCalendarUnit:details[@"repeatInterval"]];
  if (calendarUnit > 0) {
    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    [dateComponents setValue:1 forComponent:calendarUnit];
    notification.deliveryRepeatInterval = dateComponents;
  }
  if (!isSilent) {
    notification.soundName = [RCTConvert NSString:details[@"soundName"]] ?: NSUserNotificationDefaultSoundName;
  }
  
  NSString *identifier = [RCTConvert NSString:details[@"identifier"]];
  if (identifier == nil) {
    identifier = [[NSUUID UUID] UUIDString];
  }
  notification.identifier = identifier;
  return notification;
}
#endif

#if !TARGET_OS_OSX // ]TODO(macOS GH#774)
RCT_ENUM_CONVERTER(UIBackgroundFetchResult, (@{
  @"UIBackgroundFetchResultNewData": @(UIBackgroundFetchResultNewData),
  @"UIBackgroundFetchResultNoData": @(UIBackgroundFetchResultNoData),
  @"UIBackgroundFetchResultFailed": @(UIBackgroundFetchResultFailed),
}), UIBackgroundFetchResultNoData, integerValue)
#endif // TODO(macOS GH#774)

@end
#else
@interface RCTPushNotificationManager () <NativePushNotificationManagerIOS>
@end
#endif // TARGET_OS_UIKITFORMAC

@implementation RCTPushNotificationManager

#if !TARGET_OS_UIKITFORMAC && !TARGET_OS_OSX

static NSDictionary *RCTFormatLocalNotification(UILocalNotification *notification)
{
  NSMutableDictionary *formattedLocalNotification = [NSMutableDictionary dictionary];
  if (notification.fireDate) {
    NSDateFormatter *formatter = [NSDateFormatter new];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"];
    NSString *fireDateString = [formatter stringFromDate:notification.fireDate];
    formattedLocalNotification[@"fireDate"] = fireDateString;
  }
  formattedLocalNotification[@"alertAction"] = RCTNullIfNil(notification.alertAction);
  formattedLocalNotification[@"alertBody"] = RCTNullIfNil(notification.alertBody);
  formattedLocalNotification[@"applicationIconBadgeNumber"] = @(notification.applicationIconBadgeNumber);
  formattedLocalNotification[@"category"] = RCTNullIfNil(notification.category);
  formattedLocalNotification[@"soundName"] = RCTNullIfNil(notification.soundName);
  formattedLocalNotification[@"userInfo"] = RCTNullIfNil(RCTJSONClean(notification.userInfo));
  formattedLocalNotification[@"remote"] = @NO;
  return formattedLocalNotification;
}

API_AVAILABLE(ios(10.0))
static NSDictionary *RCTFormatUNNotification(UNNotification *notification)
{
  NSMutableDictionary *formattedNotification = [NSMutableDictionary dictionary];
  UNNotificationContent *content = notification.request.content;

  formattedNotification[@"identifier"] = notification.request.identifier;

  if (notification.date) {
    NSDateFormatter *formatter = [NSDateFormatter new];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"];
    NSString *dateString = [formatter stringFromDate:notification.date];
    formattedNotification[@"date"] = dateString;
  }

  formattedNotification[@"title"] = RCTNullIfNil(content.title);
  formattedNotification[@"body"] = RCTNullIfNil(content.body);
  formattedNotification[@"category"] = RCTNullIfNil(content.categoryIdentifier);
  formattedNotification[@"thread-id"] = RCTNullIfNil(content.threadIdentifier);
  formattedNotification[@"userInfo"] = RCTNullIfNil(RCTJSONClean(content.userInfo));

  return formattedNotification;
}

#endif // TARGET_OS_UIKITFORMAC
#if TARGET_OS_OSX // [TODO(macOS GH#774)

static NSDictionary *RCTFormatUserNotification(NSUserNotification *notification)
{
  NSMutableDictionary *formattedUserNotification = [NSMutableDictionary dictionary];
  if (notification.deliveryDate) {
    NSDateFormatter *formatter = [NSDateFormatter new];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"];
    NSString *fireDateString = [formatter stringFromDate:notification.deliveryDate];
    formattedUserNotification[@"fireDate"] = fireDateString;
  }
  formattedUserNotification[@"alertAction"] = RCTNullIfNil(notification.actionButtonTitle);
  formattedUserNotification[@"alertBody"] = RCTNullIfNil(notification.informativeText);
  formattedUserNotification[@"soundName"] = RCTNullIfNil(notification.soundName);
  formattedUserNotification[@"userInfo"] = RCTNullIfNil(RCTJSONClean(notification.userInfo));
  formattedUserNotification[@"remote"] = @(notification.isRemote);
  formattedUserNotification[@"identifier"] = notification.identifier;
  return formattedUserNotification;
}
#endif // ]TODO(macOS GH#774)

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

#if !TARGET_OS_UIKITFORMAC
- (void)startObserving
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleLocalNotificationReceived:)
                                               name:kLocalNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationReceived:)
                                               name:RCTRemoteNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationsRegistered:)
                                               name:kRemoteNotificationsRegistered
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationRegistrationError:)
                                               name:kRemoteNotificationRegistrationFailed
                                             object:nil];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"localNotificationReceived",
           @"remoteNotificationReceived",
           @"remoteNotificationsRegistered",
           @"remoteNotificationRegistrationError"];
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
+ (void)didRegisterUserNotificationSettings:(__unused UIUserNotificationSettings *)notificationSettings
{
}
#endif // TODO(macOS GH#774)

+ (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  NSMutableString *hexString = [NSMutableString string];
  NSUInteger deviceTokenLength = deviceToken.length;
  const unsigned char *bytes = reinterpret_cast<const unsigned char *>(deviceToken.bytes);
  for (NSUInteger i = 0; i < deviceTokenLength; i++) {
    [hexString appendFormat:@"%02x", bytes[i]];
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:kRemoteNotificationsRegistered
                                                      object:self
                                                    userInfo:@{@"deviceToken" : [hexString copy]}];
}

+ (void)didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [[NSNotificationCenter defaultCenter] postNotificationName:kRemoteNotificationRegistrationFailed
                                                      object:self
                                                    userInfo:@{@"error": error}];
}

+ (void)didReceiveRemoteNotification:(NSDictionary *)notification
{
  NSDictionary *userInfo = @{@"notification": notification};
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationReceived
                                                      object:self
                                                    userInfo:userInfo];
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
+ (void)didReceiveRemoteNotification:(NSDictionary *)notification
              fetchCompletionHandler:(RCTRemoteNotificationCallback)completionHandler
{
  NSDictionary *userInfo = @{@"notification": notification, @"completionHandler": completionHandler};
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationReceived
                                                      object:self
                                                    userInfo:userInfo];
}

+ (void)didReceiveLocalNotification:(UILocalNotification *)notification
{
  [[NSNotificationCenter defaultCenter] postNotificationName:kLocalNotificationReceived
                                                      object:self
                                                    userInfo:RCTFormatLocalNotification(notification)];
}

#else // [TODO(macOS GH#774)

+ (void)didReceiveUserNotification:(NSUserNotification *)notification
{
  NSString *notificationName = notification.isRemote ? RCTRemoteNotificationReceived : kLocalNotificationReceived;
  NSDictionary *userInfo = notification.isRemote ? @{@"notification": notification.userInfo} : RCTFormatUserNotification(notification);
  [[NSNotificationCenter defaultCenter] postNotificationName:notificationName
                                                      object:self
                                                    userInfo:userInfo];
}

#endif // ]TODO(macOS GH#774)

- (void)handleLocalNotificationReceived:(NSNotification *)notification
{
  [self sendEventWithName:@"localNotificationReceived" body:notification.userInfo];
}

- (void)handleRemoteNotificationReceived:(NSNotification *)notification
{
  NSMutableDictionary *remoteNotification = [NSMutableDictionary dictionaryWithDictionary:notification.userInfo[@"notification"]];
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  RCTRemoteNotificationCallback completionHandler = notification.userInfo[@"completionHandler"];
#endif // TODO(macOS GH#774)
  NSString *notificationId = [[NSUUID UUID] UUIDString];
  remoteNotification[@"notificationId"] = notificationId;
  remoteNotification[@"remote"] = @YES;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  if (completionHandler) {
    if (!self.remoteNotificationCallbacks) {
      // Lazy initialization
      self.remoteNotificationCallbacks = [NSMutableDictionary dictionary];
    }
    self.remoteNotificationCallbacks[notificationId] = completionHandler;
  }
#endif // TODO(macOS GH#774)

  [self sendEventWithName:@"remoteNotificationReceived" body:remoteNotification];
}

- (void)handleRemoteNotificationsRegistered:(NSNotification *)notification
{
  [self sendEventWithName:@"remoteNotificationsRegistered" body:notification.userInfo];
}

- (void)handleRemoteNotificationRegistrationError:(NSNotification *)notification
{
  NSError *error = notification.userInfo[@"error"];
  NSDictionary *errorDetails = @{
    @"message": error.localizedDescription,
    @"code": @(error.code),
    @"details": error.userInfo,
  };
  [self sendEventWithName:@"remoteNotificationRegistrationError" body:errorDetails];
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_EXPORT_METHOD(onFinishRemoteNotification:(NSString *)notificationId fetchResult:(NSString *)fetchResult) {
  UIBackgroundFetchResult result = [RCTConvert UIBackgroundFetchResult:fetchResult];
  RCTRemoteNotificationCallback completionHandler = self.remoteNotificationCallbacks[notificationId];
  if (!completionHandler) {
    RCTLogError(@"There is no completion handler with notification id: %@", notificationId);
    return;
  }
  completionHandler(result);
  [self.remoteNotificationCallbacks removeObjectForKey:notificationId];
}
#endif // TODO(macOS GH#774)

/**
 * Update the application icon badge number on the home screen
 */
RCT_EXPORT_METHOD(setApplicationIconBadgeNumber:(double)number)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  RCTSharedApplication().applicationIconBadgeNumber = number;
#else // [TODO(macOS GH#774)
  NSDockTile *tile = [NSApp dockTile];
  tile.showsApplicationBadge = number > 0;
  tile.badgeLabel = number > 0 ? [NSString stringWithFormat:@"%.0lf", number] : nil;
#endif // ]TODO(macOS GH#774)
}

/**
 * Get the current application icon badge number on the home screen
 */
RCT_EXPORT_METHOD(getApplicationIconBadgeNumber:(RCTResponseSenderBlock)callback)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  callback(@[@(RCTSharedApplication().applicationIconBadgeNumber)]);
#else // [TODO(macOS GH#774)
  callback(@[@([NSApp dockTile].badgeLabel.integerValue)]);
#endif // ]TODO(macOS GH#774)
}

RCT_EXPORT_METHOD(requestPermissions:(JS::NativePushNotificationManagerIOS::SpecRequestPermissionsPermission &)permissions
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  if (RCTRunningInAppExtension()) {
    reject(kErrorUnableToRequestPermissions, nil, RCTErrorWithMessage(@"Requesting push notifications is currently unavailable in an app extension"));
    return;
  }
#endif // TODO(macOS GH#774)

  // Add a listener to make sure that startObserving has been called
  [self addListener:@"remoteNotificationsRegistered"];

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UIUserNotificationType types = UIUserNotificationTypeNone;

  if (permissions.alert()) {
    types |= UIUserNotificationTypeAlert;
  }
  if (permissions.badge()) {
    types |= UIUserNotificationTypeBadge;
  }
  if (permissions.sound()) {
    types |= UIUserNotificationTypeSound;
  }

  [UNUserNotificationCenter.currentNotificationCenter
   requestAuthorizationWithOptions:types
   completionHandler:^(BOOL granted, NSError *_Nullable error) {
    if (error != NULL) {
      reject(@"-1", @"Error - Push authorization request failed.", error);
    } else {
      [RCTSharedApplication() registerForRemoteNotifications];
      [UNUserNotificationCenter.currentNotificationCenter getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
         resolve(RCTPromiseResolveValueForUNNotificationSettings(settings));
      }];
    }
  }];
#else // [TODO(macOS GH#774)
  NSRemoteNotificationType types = NSRemoteNotificationTypeNone;
  if (permissions.alert()) {
    types |= NSRemoteNotificationTypeAlert;
  }
  if (permissions.badge()) {
    types |= NSRemoteNotificationTypeBadge;
  }
  if (permissions.badge()) {
    types |= NSRemoteNotificationTypeSound;
  }
  [RCTSharedApplication() registerForRemoteNotificationTypes:types];
#endif // ]TODO(macOS GH#774)
}

RCT_EXPORT_METHOD(abandonPermissions)
{
  [RCTSharedApplication() unregisterForRemoteNotifications];
}

RCT_EXPORT_METHOD(checkPermissions:(RCTResponseSenderBlock)callback)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  if (RCTRunningInAppExtension()) {
    callback(@[RCTSettingsDictForUNNotificationSettings(NO, NO, NO)]);
    return;
  }
#endif // TODO(macOS GH#774)

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  [UNUserNotificationCenter.currentNotificationCenter getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
    callback(@[RCTPromiseResolveValueForUNNotificationSettings(settings)]);
  }];
#else // [TODO(macOS GH#774)
  NSRemoteNotificationType types = RCTSharedApplication().enabledRemoteNotificationTypes;
  callback(@[@{
    @"alert": @((types & NSRemoteNotificationTypeAlert) > 0),
    @"badge": @((types & NSRemoteNotificationTypeBadge) > 0),
    @"sound": @((types & NSRemoteNotificationTypeSound) > 0),
  }]);
#endif // ]TODO(macOS GH#774)
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
static inline NSDictionary *RCTPromiseResolveValueForUNNotificationSettings(UNNotificationSettings* _Nonnull settings) {
  return RCTSettingsDictForUNNotificationSettings(settings.alertSetting == UNNotificationSettingEnabled,
                                                  settings.badgeSetting == UNNotificationSettingEnabled,
                                                  settings.soundSetting == UNNotificationSettingEnabled);
}
#endif

static inline NSDictionary *RCTSettingsDictForUNNotificationSettings(BOOL alert, BOOL badge, BOOL sound) {
  return @{@"alert": @(alert), @"badge": @(badge), @"sound": @(sound)};
}

#if !TARGET_OS_OSX
RCT_EXPORT_METHOD(presentLocalNotification:(JS::NativePushNotificationManagerIOS::Notification &)notification)
{
  NSMutableDictionary *notificationDict = [NSMutableDictionary new];
  notificationDict[@"alertTitle"] = notification.alertTitle();
  notificationDict[@"alertBody"] = notification.alertBody();
  notificationDict[@"alertAction"] = notification.alertAction();
  notificationDict[@"userInfo"] = notification.userInfo();
  notificationDict[@"category"] = notification.category();
  notificationDict[@"repeatInterval"] = notification.repeatInterval();
  if (notification.fireDate()) {
    notificationDict[@"fireDate"] = @(*notification.fireDate());
  }
  if (notification.applicationIconBadgeNumber()) {
    notificationDict[@"applicationIconBadgeNumber"] = @(*notification.applicationIconBadgeNumber());
  }
  if (notification.isSilent()) {
    notificationDict[@"isSilent"] = @(*notification.isSilent());
  }
  [RCTSharedApplication() presentLocalNotificationNow:[RCTConvert UILocalNotification:notificationDict]];
}
#else // [TODO(macOS GH#774)
RCT_EXPORT_METHOD(presentLocalNotification:(NSUserNotification *)notification)
{
  [[NSUserNotificationCenter defaultUserNotificationCenter] deliverNotification:notification];
}
#endif // ]TODO(macOS GH#774)

#if !TARGET_OS_OSX // TODO(macOS GH#774)
RCT_EXPORT_METHOD(scheduleLocalNotification:(JS::NativePushNotificationManagerIOS::Notification &)notification)
{
  NSMutableDictionary *notificationDict = [NSMutableDictionary new];
  notificationDict[@"alertTitle"] = notification.alertTitle();
  notificationDict[@"alertBody"] = notification.alertBody();
  notificationDict[@"alertAction"] = notification.alertAction();
  notificationDict[@"userInfo"] = notification.userInfo();
  notificationDict[@"category"] = notification.category();
  notificationDict[@"repeatInterval"] = notification.repeatInterval();
  if (notification.fireDate()) {
    notificationDict[@"fireDate"] = @(*notification.fireDate());
  }
  if (notification.applicationIconBadgeNumber()) {
    notificationDict[@"applicationIconBadgeNumber"] = @(*notification.applicationIconBadgeNumber());
  }
  if (notification.isSilent()) {
    notificationDict[@"isSilent"] = @(*notification.isSilent());
  }
  [RCTSharedApplication() scheduleLocalNotification:[RCTConvert UILocalNotification:notificationDict]];
}
#else // [TODO(macOS GH#774)
RCT_EXPORT_METHOD(scheduleLocalNotification:(NSUserNotification *)notification)
{
  [[NSUserNotificationCenter defaultUserNotificationCenter] scheduleNotification:notification];
}
#endif // ]TODO(macOS GH#774)

RCT_EXPORT_METHOD(cancelAllLocalNotifications)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  [RCTSharedApplication() cancelAllLocalNotifications];
#else // [TODO(macOS GH#774)
  for (NSUserNotification *notif in [NSUserNotificationCenter defaultUserNotificationCenter].scheduledNotifications) {
    [[NSUserNotificationCenter defaultUserNotificationCenter] removeScheduledNotification:notif];
  }
#endif // ]TODO(macOS GH#774)
}

RCT_EXPORT_METHOD(cancelLocalNotifications:(NSDictionary<NSString *, id> *)userInfo)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  for (UILocalNotification *notification in RCTSharedApplication().scheduledLocalNotifications) {
#else // [TODO(macOS GH#774)
  for (NSUserNotification *notification in [NSUserNotificationCenter defaultUserNotificationCenter].scheduledNotifications) {
#endif // ]TODO(macOS GH#774)
    __block BOOL matchesAll = YES;
    NSDictionary<NSString *, id> *notificationInfo = notification.userInfo;
    // Note: we do this with a loop instead of just `isEqualToDictionary:`
    // because we only require that all specified userInfo values match the
    // notificationInfo values - notificationInfo may contain additional values
    // which we don't care about.
    [userInfo enumerateKeysAndObjectsUsingBlock:^(NSString *key, id obj, BOOL *stop) {
      if (![notificationInfo[key] isEqual:obj]) {
        matchesAll = NO;
        *stop = YES;
      }
    }];
#if !TARGET_OS_OSX // TODO(macOS GH#774)
    if (matchesAll) {
      [RCTSharedApplication() cancelLocalNotification:notification];
    }
#else // [TODO(macOS GH#774)
    if ([notification.identifier isEqualToString:userInfo[@"identifier"]] || matchesAll) {
      [[NSUserNotificationCenter defaultUserNotificationCenter] removeScheduledNotification:notification];
    }
#endif // ]TODO(macOS GH#774)
  }
}

RCT_EXPORT_METHOD(getInitialNotification:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  NSMutableDictionary<NSString *, id> *initialNotification =
    [self.bridge.launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey] mutableCopy];

  UILocalNotification *initialLocalNotification =
    self.bridge.launchOptions[UIApplicationLaunchOptionsLocalNotificationKey];

  if (initialNotification) {
    initialNotification[@"remote"] = @YES;
    resolve(initialNotification);
  } else if (initialLocalNotification) {
    resolve(RCTFormatLocalNotification(initialLocalNotification));
  } else {
    resolve((id)kCFNull);
  }
#else // [TODO(macOS GH#774)
  NSUserNotification *initialNotification = self.bridge.launchOptions[NSApplicationLaunchUserNotificationKey];
  if (initialNotification) {
    resolve(RCTFormatUserNotification(initialNotification));
  } else {
    resolve((id)kCFNull);
  }
#endif // ]TODO(macOS GH#774)
}

RCT_EXPORT_METHOD(getScheduledLocalNotifications:(RCTResponseSenderBlock)callback)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  NSArray<UILocalNotification *> *scheduledLocalNotifications = RCTSharedApplication().scheduledLocalNotifications;
#endif // TODO(macOS GH#774)
  NSMutableArray<NSDictionary *> *formattedScheduledLocalNotifications = [NSMutableArray new];
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  for (UILocalNotification *notification in scheduledLocalNotifications) {
    [formattedScheduledLocalNotifications addObject:RCTFormatLocalNotification(notification)];
  }
#else // [TODO(macOS GH#774)
  for (NSUserNotification *notification in [NSUserNotificationCenter defaultUserNotificationCenter].scheduledNotifications) {
    [formattedScheduledLocalNotifications addObject:RCTFormatUserNotification(notification)];
  }
#endif // ]TODO(macOS GH#774)
  callback(@[formattedScheduledLocalNotifications]);
}

RCT_EXPORT_METHOD(removeAllDeliveredNotifications)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center removeAllDeliveredNotifications];
#else // [TODO(macOS GH#774)
  [[NSUserNotificationCenter defaultUserNotificationCenter] removeAllDeliveredNotifications];
#endif // ]TODO(macOS GH#774)
}

RCT_EXPORT_METHOD(removeDeliveredNotifications:(NSArray<NSString *> *)identifiers)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center removeDeliveredNotificationsWithIdentifiers:identifiers];
#else // [TODO(macOS GH#774)
  NSArray<NSUserNotification*> *notificationsToRemove = [[NSUserNotificationCenter defaultUserNotificationCenter].deliveredNotifications filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(NSUserNotification* evaluatedObject, NSDictionary<NSString *,id> * _Nullable bindings) {
    return [identifiers containsObject:evaluatedObject.identifier];
  }]];
  for (NSUserNotification *notification in notificationsToRemove) {
    [[NSUserNotificationCenter defaultUserNotificationCenter] removeDeliveredNotification:notification];
  }
#endif // ]TODO(macOS GH#774)
}

RCT_EXPORT_METHOD(getDeliveredNotifications:(RCTResponseSenderBlock)callback)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
  [center getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> *_Nonnull notifications) {
    NSMutableArray<NSDictionary *> *formattedNotifications = [NSMutableArray new];

    for (UNNotification *notification in notifications) {
      [formattedNotifications addObject:RCTFormatUNNotification(notification)];
    }
    callback(@[formattedNotifications]);
  }];
#else // [TODO(macOS GH#774)
  NSMutableArray<NSDictionary *> *formattedNotifications = [NSMutableArray new];
  for (NSUserNotification *notification in [NSUserNotificationCenter defaultUserNotificationCenter].deliveredNotifications) {
    [formattedNotifications addObject:RCTFormatUserNotification(notification)];
  }
  callback(@[formattedNotifications]);
#endif // ]TODO(macOS GH#774)
}

#else // TARGET_OS_UIKITFORMAC

RCT_EXPORT_METHOD(onFinishRemoteNotification:(NSString *)notificationId fetchResult:(NSString *)fetchResult)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(setApplicationIconBadgeNumber:(double)number)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(getApplicationIconBadgeNumber:(RCTResponseSenderBlock)callback)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(requestPermissions:(JS::NativePushNotificationManagerIOS::SpecRequestPermissionsPermission &)permissions
                 resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(abandonPermissions)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(checkPermissions:(RCTResponseSenderBlock)callback)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(presentLocalNotification:(JS::NativePushNotificationManagerIOS::Notification &)notification)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(scheduleLocalNotification:(JS::NativePushNotificationManagerIOS::Notification &)notification)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(cancelAllLocalNotifications)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(cancelLocalNotifications:(NSDictionary<NSString *, id> *)userInfo)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(getInitialNotification:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(getScheduledLocalNotifications:(RCTResponseSenderBlock)callback)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(removeAllDeliveredNotifications)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(removeDeliveredNotifications:(NSArray<NSString *> *)identifiers)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

RCT_EXPORT_METHOD(getDeliveredNotifications:(RCTResponseSenderBlock)callback)
{
  RCTLogError(@"Not implemented: %@", NSStringFromSelector(_cmd));
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[];
}

#endif // TARGET_OS_UIKITFORMAC

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativePushNotificationManagerIOSSpecJSI>(params);
}

@end

Class RCTPushNotificationManagerCls(void) {
  return RCTPushNotificationManager.class;
}
