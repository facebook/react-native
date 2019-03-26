/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTPushNotificationManager.h"

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
#import <UserNotifications/UserNotifications.h>
#endif // TODO(macOS ISS#2323203)

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTUtils.h>

NSString *const RCTRemoteNotificationReceived = @"RemoteNotificationReceived";

static NSString *const kLocalNotificationReceived = @"LocalNotificationReceived";
static NSString *const kRemoteNotificationsRegistered = @"RemoteNotificationsRegistered";
static NSString *const kRegisterUserNotificationSettings = @"RegisterUserNotificationSettings";
static NSString *const kRemoteNotificationRegistrationFailed = @"RemoteNotificationRegistrationFailed";

static NSString *const kErrorUnableToRequestPermissions = @"E_UNABLE_TO_REQUEST_PERMISSIONS";

#if !TARGET_OS_TV
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

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
@interface RCTPushNotificationManager ()
@property (nonatomic, strong) NSMutableDictionary *remoteNotificationCallbacks;
@end
#endif // TODO(macOS ISS#2323203)

@implementation RCTConvert (UILocalNotification)

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
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
#else // [TODO(macOS ISS#2323203)
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

#if !TARGET_OS_OSX // ]TODO(macOS ISS#2323203)
RCT_ENUM_CONVERTER(UIBackgroundFetchResult, (@{
  @"UIBackgroundFetchResultNewData": @(UIBackgroundFetchResultNewData),
  @"UIBackgroundFetchResultNoData": @(UIBackgroundFetchResultNoData),
  @"UIBackgroundFetchResultFailed": @(UIBackgroundFetchResultFailed),
}), UIBackgroundFetchResultNoData, integerValue)
#endif // TODO(macOS ISS#2323203)

@end
#endif //TARGET_OS_TV

@implementation RCTPushNotificationManager
{
  RCTPromiseResolveBlock _requestPermissionsResolveBlock;
}

#if !TARGET_OS_TV && !TARGET_OS_OSX // TODO(macOS ISS#2323203)

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

#endif //TARGET_OS_TV
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)

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
#endif // ]TODO(macOS ISS#2323203)

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

#if !TARGET_OS_TV
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
                                           selector:@selector(handleRegisterUserNotificationSettings:)
                                               name:kRegisterUserNotificationSettings
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

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
+ (void)didRegisterUserNotificationSettings:(__unused UIUserNotificationSettings *)notificationSettings
{
  if ([UIApplication instancesRespondToSelector:@selector(registerForRemoteNotifications)]) {
    [RCTSharedApplication() registerForRemoteNotifications];
    [[NSNotificationCenter defaultCenter] postNotificationName:kRegisterUserNotificationSettings
                                                        object:self
                                                      userInfo:@{@"notificationSettings": notificationSettings}];
  }
}
#endif // TODO(macOS ISS#2323203)

+ (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
  [[NSNotificationCenter defaultCenter] postNotificationName:kRegisterUserNotificationSettings
                                                      object:self
                                                    userInfo:@{@"notificationSettings": @(RCTSharedApplication().enabledRemoteNotificationTypes)}];
#endif // ]TODO(macOS ISS#2323203)
  
  NSMutableString *hexString = [NSMutableString string];
  NSUInteger deviceTokenLength = deviceToken.length;
  const unsigned char *bytes = deviceToken.bytes;
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

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
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

#else // [TODO(macOS ISS#2323203)

+ (void)didReceiveUserNotification:(NSUserNotification *)notification
{
  NSString *notificationName = notification.isRemote ? RCTRemoteNotificationReceived : kLocalNotificationReceived;
  NSDictionary *userInfo = notification.isRemote ? @{@"notification": notification.userInfo} : RCTFormatUserNotification(notification);
  [[NSNotificationCenter defaultCenter] postNotificationName:notificationName
                                                      object:self
                                                    userInfo:userInfo];
}

#endif // ]TODO(macOS ISS#2323203)

- (void)handleLocalNotificationReceived:(NSNotification *)notification
{
  [self sendEventWithName:@"localNotificationReceived" body:notification.userInfo];
}

- (void)handleRemoteNotificationReceived:(NSNotification *)notification
{
  NSMutableDictionary *remoteNotification = [NSMutableDictionary dictionaryWithDictionary:notification.userInfo[@"notification"]];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  RCTRemoteNotificationCallback completionHandler = notification.userInfo[@"completionHandler"];
#endif // TODO(macOS ISS#2323203)
  NSString *notificationId = [[NSUUID UUID] UUIDString];
  remoteNotification[@"notificationId"] = notificationId;
  remoteNotification[@"remote"] = @YES;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (completionHandler) {
    if (!self.remoteNotificationCallbacks) {
      // Lazy initialization
      self.remoteNotificationCallbacks = [NSMutableDictionary dictionary];
    }
    self.remoteNotificationCallbacks[notificationId] = completionHandler;
  }
#endif // TODO(macOS ISS#2323203)

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

- (void)handleRegisterUserNotificationSettings:(NSNotification *)notification
{
  if (_requestPermissionsResolveBlock == nil) {
    return;
  }

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UIUserNotificationSettings *notificationSettings = notification.userInfo[@"notificationSettings"];
  NSDictionary *notificationTypes = @{
    @"alert": @((notificationSettings.types & UIUserNotificationTypeAlert) > 0),
    @"sound": @((notificationSettings.types & UIUserNotificationTypeSound) > 0),
    @"badge": @((notificationSettings.types & UIUserNotificationTypeBadge) > 0),
  };
#else // [TODO(macOS ISS#2323203)
  NSRemoteNotificationType remoteNotificationType = [notification.userInfo[@"notificationSettings"] unsignedIntegerValue];
  NSDictionary *notificationTypes = @{
    @"alert": @((remoteNotificationType & NSRemoteNotificationTypeAlert) > 0),
    @"sound": @((remoteNotificationType & NSRemoteNotificationTypeSound) > 0),
    @"badge": @((remoteNotificationType & NSRemoteNotificationTypeBadge) > 0),
  };
#endif // ]TODO(macOS ISS#2323203)

  _requestPermissionsResolveBlock(notificationTypes);
  // Clean up listener added in requestPermissions
  [self removeListeners:1];
  _requestPermissionsResolveBlock = nil;
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
RCT_EXPORT_METHOD(onFinishRemoteNotification:(NSString *)notificationId fetchResult:(UIBackgroundFetchResult)result) {
  RCTRemoteNotificationCallback completionHandler = self.remoteNotificationCallbacks[notificationId];
  if (!completionHandler) {
    RCTLogError(@"There is no completion handler with notification id: %@", notificationId);
    return;
  }
  completionHandler(result);
  [self.remoteNotificationCallbacks removeObjectForKey:notificationId];
}
#endif // TODO(macOS ISS#2323203)

/**
 * Update the application icon badge number on the home screen
 */
RCT_EXPORT_METHOD(setApplicationIconBadgeNumber:(NSInteger)number)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  RCTSharedApplication().applicationIconBadgeNumber = number;
#else // [TODO(macOS ISS#2323203)
  NSDockTile *tile = [NSApp dockTile];
  tile.showsApplicationBadge = number > 0;
  tile.badgeLabel = number > 0 ? [NSString stringWithFormat:@"%ld", number] : nil;
#endif // ]TODO(macOS ISS#2323203)
}

/**
 * Get the current application icon badge number on the home screen
 */
RCT_EXPORT_METHOD(getApplicationIconBadgeNumber:(RCTResponseSenderBlock)callback)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  callback(@[@(RCTSharedApplication().applicationIconBadgeNumber)]);
#else // [TODO(macOS ISS#2323203)
  callback(@[@([NSApp dockTile].badgeLabel.integerValue)]);
#endif // ]TODO(macOS ISS#2323203)
}

RCT_EXPORT_METHOD(requestPermissions:(NSDictionary *)permissions
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (RCTRunningInAppExtension()) {
    reject(kErrorUnableToRequestPermissions, nil, RCTErrorWithMessage(@"Requesting push notifications is currently unavailable in an app extension"));
    return;
  }
#endif // TODO(macOS ISS#2323203)

  if (_requestPermissionsResolveBlock != nil) {
    RCTLogError(@"Cannot call requestPermissions twice before the first has returned.");
    return;
  }

  // Add a listener to make sure that startObserving has been called
  [self addListener:@"remoteNotificationsRegistered"];
  _requestPermissionsResolveBlock = resolve;

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UIUserNotificationType types = UIUserNotificationTypeNone;
  if (permissions) {
    if ([RCTConvert BOOL:permissions[@"alert"]]) {
      types |= UIUserNotificationTypeAlert;
    }
    if ([RCTConvert BOOL:permissions[@"badge"]]) {
      types |= UIUserNotificationTypeBadge;
    }
    if ([RCTConvert BOOL:permissions[@"sound"]]) {
      types |= UIUserNotificationTypeSound;
    }
  } else {
    types = UIUserNotificationTypeAlert | UIUserNotificationTypeBadge | UIUserNotificationTypeSound;
  }

  UIUserNotificationSettings *notificationSettings =
    [UIUserNotificationSettings settingsForTypes:types categories:nil];
  [RCTSharedApplication() registerUserNotificationSettings:notificationSettings];
#else // [TODO(macOS ISS#2323203)
  NSRemoteNotificationType types = NSRemoteNotificationTypeNone;
  if (permissions) {
    if ([RCTConvert BOOL:permissions[@"alert"]]) {
      types |= NSRemoteNotificationTypeAlert;
    }
    if ([RCTConvert BOOL:permissions[@"badge"]]) {
      types |= NSRemoteNotificationTypeBadge;
    }
    if ([RCTConvert BOOL:permissions[@"sound"]]) {
      types |= NSRemoteNotificationTypeSound;
    }
  } else {
    types = NSRemoteNotificationTypeAlert | NSRemoteNotificationTypeBadge | NSRemoteNotificationTypeSound;
  }
  [RCTSharedApplication() registerForRemoteNotificationTypes:types];
#endif // ]TODO(macOS ISS#2323203)
}

RCT_EXPORT_METHOD(abandonPermissions)
{
  [RCTSharedApplication() unregisterForRemoteNotifications];
}

RCT_EXPORT_METHOD(checkPermissions:(RCTResponseSenderBlock)callback)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (RCTRunningInAppExtension()) {
    callback(@[@{@"alert": @NO, @"badge": @NO, @"sound": @NO}]);
    return;
  }
#endif // TODO(macOS ISS#2323203)

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  NSUInteger types = [RCTSharedApplication() currentUserNotificationSettings].types;
  callback(@[@{
    @"alert": @((types & UIUserNotificationTypeAlert) > 0),
    @"badge": @((types & UIUserNotificationTypeBadge) > 0),
    @"sound": @((types & UIUserNotificationTypeSound) > 0),
  }]);
#else // [TODO(macOS ISS#2323203)
  NSRemoteNotificationType types = RCTSharedApplication().enabledRemoteNotificationTypes;
  callback(@[@{
    @"alert": @((types & NSRemoteNotificationTypeAlert) > 0),
    @"badge": @((types & NSRemoteNotificationTypeBadge) > 0),
    @"sound": @((types & NSRemoteNotificationTypeSound) > 0),
  }]);
#endif // ]TODO(macOS ISS#2323203)
}

#if !TARGET_OS_OSX
RCT_EXPORT_METHOD(presentLocalNotification:(UILocalNotification *)notification)
{
  [RCTSharedApplication() presentLocalNotificationNow:notification];
}
#else // [TODO(macOS ISS#2323203)
RCT_EXPORT_METHOD(presentLocalNotification:(NSUserNotification *)notification)
{
  [[NSUserNotificationCenter defaultUserNotificationCenter] deliverNotification:notification];
}
#endif // ]TODO(macOS ISS#2323203)

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
RCT_EXPORT_METHOD(scheduleLocalNotification:(UILocalNotification *)notification)
{
  [RCTSharedApplication() scheduleLocalNotification:notification];
}
#else // [TODO(macOS ISS#2323203)
RCT_EXPORT_METHOD(scheduleLocalNotification:(NSUserNotification *)notification)
{
  [[NSUserNotificationCenter defaultUserNotificationCenter] scheduleNotification:notification];
}
#endif // ]TODO(macOS ISS#2323203)

RCT_EXPORT_METHOD(cancelAllLocalNotifications)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  [RCTSharedApplication() cancelAllLocalNotifications];
#else // [TODO(macOS ISS#2323203)
  for (NSUserNotification *notif in [NSUserNotificationCenter defaultUserNotificationCenter].scheduledNotifications) {
    [[NSUserNotificationCenter defaultUserNotificationCenter] removeScheduledNotification:notif];
  }
#endif // ]TODO(macOS ISS#2323203)
}

RCT_EXPORT_METHOD(cancelLocalNotifications:(NSDictionary<NSString *, id> *)userInfo)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  for (UILocalNotification *notification in RCTSharedApplication().scheduledLocalNotifications) {
#else // [TODO(macOS ISS#2323203)
  for (NSUserNotification *notification in [NSUserNotificationCenter defaultUserNotificationCenter].scheduledNotifications) {
#endif // ]TODO(macOS ISS#2323203)
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
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    if (matchesAll) {
      [RCTSharedApplication() cancelLocalNotification:notification];
    }
#else // [TODO(macOS ISS#2323203)
    if ([notification.identifier isEqualToString:userInfo[@"identifier"]] || matchesAll) {
      [[NSUserNotificationCenter defaultUserNotificationCenter] removeScheduledNotification:notification];
    }
#endif // ]TODO(macOS ISS#2323203)
  }
}

RCT_EXPORT_METHOD(getInitialNotification:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
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
#else // [TODO(macOS ISS#2323203)
  NSUserNotification *initialNotification = self.bridge.launchOptions[NSApplicationLaunchUserNotificationKey];
  if (initialNotification) {
    resolve(RCTFormatUserNotification(initialNotification));
  } else {
    resolve((id)kCFNull);
  }
#endif // ]TODO(macOS ISS#2323203)
}

RCT_EXPORT_METHOD(getScheduledLocalNotifications:(RCTResponseSenderBlock)callback)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  NSArray<UILocalNotification *> *scheduledLocalNotifications = RCTSharedApplication().scheduledLocalNotifications;
#endif // TODO(macOS ISS#2323203)
  NSMutableArray<NSDictionary *> *formattedScheduledLocalNotifications = [NSMutableArray new];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  for (UILocalNotification *notification in scheduledLocalNotifications) {
    [formattedScheduledLocalNotifications addObject:RCTFormatLocalNotification(notification)];
  }
#else // [TODO(macOS ISS#2323203)
  for (NSUserNotification *notification in [NSUserNotificationCenter defaultUserNotificationCenter].scheduledNotifications) {
    [formattedScheduledLocalNotifications addObject:RCTFormatUserNotification(notification)];
  }
#endif // ]TODO(macOS ISS#2323203)
  callback(@[formattedScheduledLocalNotifications]);
}

RCT_EXPORT_METHOD(removeAllDeliveredNotifications)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if ([UNUserNotificationCenter class]) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    [center removeAllDeliveredNotifications];
  }
#else // [TODO(macOS ISS#2323203)
  [[NSUserNotificationCenter defaultUserNotificationCenter] removeAllDeliveredNotifications];
#endif // ]TODO(macOS ISS#2323203)
}

RCT_EXPORT_METHOD(removeDeliveredNotifications:(NSArray<NSString *> *)identifiers)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if ([UNUserNotificationCenter class]) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    [center removeDeliveredNotificationsWithIdentifiers:identifiers];
  }
#else // [TODO(macOS ISS#2323203)
  NSArray<NSUserNotification*> *notificationsToRemove = [[NSUserNotificationCenter defaultUserNotificationCenter].deliveredNotifications filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(NSUserNotification* evaluatedObject, NSDictionary<NSString *,id> * _Nullable bindings) {
    return [identifiers containsObject:evaluatedObject.identifier];
  }]];
  for (NSUserNotification *notification in notificationsToRemove) {
    [[NSUserNotificationCenter defaultUserNotificationCenter] removeDeliveredNotification:notification];
  }
#endif // ]TODO(macOS ISS#2323203)
}

RCT_EXPORT_METHOD(getDeliveredNotifications:(RCTResponseSenderBlock)callback)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if ([UNUserNotificationCenter class]) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    [center getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> *_Nonnull notifications) {
      NSMutableArray<NSDictionary *> *formattedNotifications = [NSMutableArray new];

      for (UNNotification *notification in notifications) {
        [formattedNotifications addObject:RCTFormatUNNotification(notification)];
      }
      callback(@[formattedNotifications]);
    }];
  }
#else // [TODO(macOS ISS#2323203)
  NSMutableArray<NSDictionary *> *formattedNotifications = [NSMutableArray new];
  for (NSUserNotification *notification in [NSUserNotificationCenter defaultUserNotificationCenter].deliveredNotifications) {
    [formattedNotifications addObject:RCTFormatUserNotification(notification)];
  }
  callback(@[formattedNotifications]);
#endif // ]TODO(macOS ISS#2323203)
}

#else //TARGET_OS_TV

- (NSArray<NSString *> *)supportedEvents
{
  return @[];
}

#endif //TARGET_OS_TV

@end
