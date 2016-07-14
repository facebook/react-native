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

NSString *const RCTLocalNotificationReceived = @"LocalNotificationReceived";
NSString *const RCTProcessNotificationActions = @"ProcessNotificationActions";
NSString *const RCTRemoteNotificationReceived = @"RemoteNotificationReceived";
NSString *const RCTRemoteNotificationsRegistered = @"RemoteNotificationsRegistered";
NSString *const RCTRegisterUserNotificationSettings = @"RegisterUserNotificationSettings";

NSString *const RCTErrorUnableToRequestPermissions = @"E_UNABLE_TO_REQUEST_PERMISSIONS";

typedef NSArray UILocalNotificationArray;

static NSMutableDictionary *__pendingPushActionCallbacks;
static NSMutableArray *__pendingPushActions;


@implementation RCTConvert (UILocalNotification)

RCT_ENUM_CONVERTER(NSCalendarUnit, (@{
  @"era": @(NSCalendarUnitEra),
  @"year": @(NSCalendarUnitYear),
  @"month": @(NSCalendarUnitMonth),
  @"day": @(NSCalendarUnitDay),
  @"hour": @(NSCalendarUnitHour),
  @"minute": @(NSCalendarUnitMinute),
  @"second": @(NSCalendarUnitSecond),
  @"weekday": @(NSCalendarUnitWeekday),
  @"weekdayOrdinal": @(NSCalendarUnitWeekdayOrdinal),
  @"quarter": @(NSCalendarUnitQuarter),
  @"weekOfMonth": @(NSCalendarUnitWeekOfMonth),
  @"weekOfYear": @(NSCalendarUnitWeekOfYear),
  @"yearForWeekOfYear": @(NSCalendarUnitYearForWeekOfYear),
  @"nanosecond": @(NSCalendarUnitNanosecond),
  @"calendar": @(NSCalendarUnitCalendar),
  @"timeZone": @(NSCalendarUnitTimeZone),
}), 0, integerValue)

RCT_ENUM_CONVERTER(UIUserNotificationActivationMode, (@{
  @"foreground": @(UIUserNotificationActivationModeForeground),
  @"background": @(UIUserNotificationActivationModeBackground)
}), UIUserNotificationActivationModeForeground, integerValue)

RCT_ENUM_CONVERTER(UIUserNotificationActionContext, (@{
  @"default": @(UIUserNotificationActionContextDefault),
  @"minimal": @(UIUserNotificationActionContextMinimal)
}), UIUserNotificationActionContextDefault, integerValue)

+ (UILocalNotification *)UILocalNotification:(id)json
{
  NSDictionary<NSString *, id> *details = [self NSDictionary:json];
  UILocalNotification *notification = [UILocalNotification new];
  notification.fireDate = [RCTConvert NSDate:details[@"fireDate"]] ?: [NSDate date];
  notification.alertBody = [RCTConvert NSString:details[@"alertBody"]];
  notification.alertAction = [RCTConvert NSString:details[@"alertAction"]];
  notification.soundName = [RCTConvert NSString:details[@"soundName"]];
  notification.userInfo = [RCTConvert NSDictionary:details[@"userInfo"]];
  notification.category = [RCTConvert NSString:details[@"category"]];
  if (details[@"applicationIconBadgeNumber"]) {
    notification.applicationIconBadgeNumber = [RCTConvert NSInteger:details[@"applicationIconBadgeNumber"]];
  }
  notification.repeatInterval = [RCTConvert NSCalendarUnit:details[@"repeatInterval"]];
  notification.timeZone = [NSTimeZone systemTimeZone];
  return notification;
}

+ (NSArray *)UILocalNotificationArray:(id)json {
  NSMutableArray *array = [NSMutableArray new];
  NSArray *jsonArray = [self NSArray:json];
  for (id jsonNotification in jsonArray) {
    [array addObject:[self UILocalNotification:jsonNotification]];
  }
  return array;
}

+ (UIUserNotificationAction *)UIUserNotificationAction:(id)json
{
  NSDictionary *details = [self NSDictionary:json];
  UIMutableUserNotificationAction *action = [UIMutableUserNotificationAction new];
  action.identifier = [self NSString:details[@"identifier"]];
  action.title = [self NSString:details[@"title"]];
  if (details[@"activationMode"] != nil) {
    action.activationMode = [self UIUserNotificationActivationMode:details[@"activationMode"]];
  }
  if (details[@"destructive"] != nil) {
    action.destructive = [self BOOL:details[@"destructive"]];
  }
  if (details[@"authenticationRequired"] != nil) {
    action.authenticationRequired = [self BOOL:details[@"authenticationRequired"]];
  }
  return action;
}

+ (UIUserNotificationCategory *)UIUserNotificationCategory:(id)json
{
  NSDictionary *details = [self NSDictionary:json];
  UIMutableUserNotificationCategory *category = [UIMutableUserNotificationCategory new];
  category.identifier = [self NSString:details[@"identifier"]];
  NSArray *actionDetails = [self NSArray:details[@"actions"]];
  NSMutableDictionary *actionsByID = [NSMutableDictionary new];
  for (id actionJson in actionDetails) {
    UIUserNotificationAction *action = [self UIUserNotificationAction:actionJson];
    actionsByID[action.identifier] = action;
  }
  NSDictionary *actionIdentifiersByContext = [self NSDictionary:details[@"actionIdentifiersByContext"]];
  [actionIdentifiersByContext enumerateKeysAndObjectsUsingBlock:^(id key, id value, __unused BOOL* stop) {
    UIUserNotificationActionContext context = [self UIUserNotificationActionContext:key];
    NSArray *identifiers = [self NSStringArray:value];
    NSMutableArray *actions = [NSMutableArray new];
    for (NSString *identifier in identifiers) {
      [actions addObject:actionsByID[identifier]];
    }
    [category setActions:actions forContext:context];
  }];
  return category;
}

+ (UIUserNotificationType)UIUserNotificationType:(id)json {
  NSDictionary *details = [self NSDictionary:json];
  UIUserNotificationType types = UIUserNotificationTypeNone;
  if (details) {
    if ([details[@"alert"] boolValue]) {
      types |= UIUserNotificationTypeAlert;
    }
    if ([details[@"badge"] boolValue]) {
      types |= UIUserNotificationTypeBadge;
    }
    if ([details[@"sound"] boolValue]) {
      types |= UIUserNotificationTypeSound;
    }
  } else {
    types = UIUserNotificationTypeAlert | UIUserNotificationTypeBadge | UIUserNotificationTypeSound;
  }
  return types;
}

+ (UIUserNotificationSettings *)UIUserNotificationSettings:(id)json
{
  NSDictionary *details = [self NSDictionary:json];
  NSInteger types = [self UIUserNotificationType:details[@"types"]];
  NSMutableSet *categories = [NSMutableSet new];
  NSArray *categoryJsonArray = [self NSArray:details[@"categories"]];
  for (id categoryJson in categoryJsonArray) {
    [categories addObject:[self UIUserNotificationCategory:categoryJson]];
  }
  return [UIUserNotificationSettings settingsForTypes:types categories:categories];
}

@end


@implementation RCTPushNotificationManager
{
  RCTPromiseResolveBlock _requestPermissionsResolveBlock;
  BOOL _isPublishingPushActions;
}

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

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)startObserving
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleLocalNotificationReceived:)
                                               name:RCTLocalNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationReceived:)
                                               name:RCTRemoteNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationsRegistered:)
                                               name:RCTRemoteNotificationsRegistered
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRegisterUserNotificationSettings:)
                                               name:RCTRegisterUserNotificationSettings
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
           @"localNotificationActionReceived"];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return @{@"defaultSoundName": UILocalNotificationDefaultSoundName};
}

+ (void)didRegisterUserNotificationSettings:(__unused UIUserNotificationSettings *)notificationSettings
{
  if ([UIApplication instancesRespondToSelector:@selector(registerForRemoteNotifications)]) {
    [[UIApplication sharedApplication] registerForRemoteNotifications];
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTRegisterUserNotificationSettings
                                                        object:self
                                                      userInfo:@{@"notificationSettings": notificationSettings}];
  }
}

+ (void)handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo completionHandler:(void (^)())completionHandler
{
  NSMutableDictionary *notificationDictionary = [userInfo mutableCopy];
  notificationDictionary[@"remote"] = @YES;
  [self handleActionWithIdentifier:identifier
               forNotificationType:@"remote"
        withNotificationDictionary:notificationDictionary
                      responseInfo:nil
                 completionHandler:completionHandler];
}

+ (void)handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo withResponseInfo:(NSDictionary *)responseInfo completionHandler:(void (^)())completionHandler
{
  NSMutableDictionary *notificationDictionary = [userInfo mutableCopy];
  notificationDictionary[@"remote"] = @YES;
  [self handleActionWithIdentifier:identifier
               forNotificationType:@"remote"
        withNotificationDictionary:notificationDictionary
                      responseInfo:responseInfo
                 completionHandler:completionHandler];
}

+ (void)handleActionWithIdentifier:(NSString *)identifier forLocalNotification:(UILocalNotification *)notification completionHandler:(void (^)())completionHandler
{
  [self handleActionWithIdentifier:identifier
               forNotificationType:@"local"
        withNotificationDictionary:RCTFormatLocalNotification(notification)
                      responseInfo:nil
                 completionHandler:completionHandler];
}

+ (void)handleActionWithIdentifier:(NSString *)identifier forLocalNotification:(UILocalNotification *)notification withResponseInfo:(NSDictionary *)responseInfo completionHandler:(void (^)())completionHandler
{
  [self handleActionWithIdentifier:identifier
               forNotificationType:@"local"
        withNotificationDictionary:RCTFormatLocalNotification(notification)
                      responseInfo:responseInfo
                 completionHandler:completionHandler];
}

+ (void)handleActionWithIdentifier:(NSString *)identifier
               forNotificationType:(NSString *)type
        withNotificationDictionary:(NSDictionary *)notificationDictionary
                      responseInfo:(NSDictionary *)responseInfo
                 completionHandler:(void (^)())completionHandler
{
  RCTAssertMainThread();
  if (__pendingPushActions == nil) {
    __pendingPushActions = [NSMutableArray array];
  }
  if (__pendingPushActionCallbacks == nil) {
    __pendingPushActionCallbacks = [NSMutableDictionary dictionary];
  }
  NSString *completionHandlerID = [[NSUUID UUID] UUIDString];
  __pendingPushActionCallbacks[completionHandlerID] = completionHandler;
  NSDictionary *action = @{@"identifier": identifier,
                           @"type": type,
                           @"notification": notificationDictionary,
                           @"responseInfo": RCTNullIfNil(responseInfo),
                           @"completionHandlerID": completionHandlerID};
  [__pendingPushActions addObject:action];
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTProcessNotificationActions
                                                      object:self
                                                    userInfo:nil];
}

+ (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  NSMutableString *hexString = [NSMutableString string];
  NSUInteger deviceTokenLength = deviceToken.length;
  const unsigned char *bytes = deviceToken.bytes;
  for (NSUInteger i = 0; i < deviceTokenLength; i++) {
    [hexString appendFormat:@"%02x", bytes[i]];
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationsRegistered
                                                      object:self
                                                    userInfo:@{@"deviceToken" : [hexString copy]}];
}

+ (void)didReceiveRemoteNotification:(NSDictionary *)notification
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationReceived
                                                      object:self
                                                    userInfo:notification];
}

+ (void)didReceiveLocalNotification:(UILocalNotification *)notification
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTLocalNotificationReceived
                                                      object:self
                                                    userInfo:RCTFormatLocalNotification(notification)];
}

- (void)handleLocalNotificationReceived:(NSNotification *)notification
{
  [self sendEventWithName:@"localNotificationReceived" body:notification.userInfo];
}

- (void)handleProcessNotificationActions:(NSNotification * __unused)notification
{
  RCTAssertMainThread();
  while (__pendingPushActions.count > 0) {
    NSDictionary *data = __pendingPushActions[0];
    [__pendingPushActions removeObjectAtIndex:0];
    [self sendEventWithName:@"localNotificationActionReceived" body:data];
  }
}

- (void)handleRemoteNotificationReceived:(NSNotification *)notification
{
  NSMutableDictionary *userInfo = [notification.userInfo mutableCopy];
  userInfo[@"remote"] = @YES;
  [self sendEventWithName:@"remoteNotificationReceived" body:userInfo];
}

- (void)handleRemoteNotificationsRegistered:(NSNotification *)notification
{
  [self sendEventWithName:@"remoteNotificationsRegistered" body:notification.userInfo];
}

- (void)handleRegisterUserNotificationSettings:(NSNotification *)notification
{
  if (_requestPermissionsResolveBlock == nil) {
    return;
  }

  UIUserNotificationSettings *notificationSettings = notification.userInfo[@"notificationSettings"];
  NSDictionary *notificationTypes = @{
    @"alert": @((notificationSettings.types & UIUserNotificationTypeAlert) > 0),
    @"sound": @((notificationSettings.types & UIUserNotificationTypeSound) > 0),
    @"badge": @((notificationSettings.types & UIUserNotificationTypeBadge) > 0),
  };

  _requestPermissionsResolveBlock(notificationTypes);
  _requestPermissionsResolveBlock = nil;
}

/**
 * Called when the JS environment is ready to start processing push actions
 */
RCT_EXPORT_METHOD(startPublishingPushActions)
{
  if (_isPublishingPushActions) {
    return;
  }
  _isPublishingPushActions = true;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleProcessNotificationActions:)
                                               name:RCTProcessNotificationActions
                                             object:nil];
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTProcessNotificationActions
                                                      object:self
                                                    userInfo:nil];
}

/**
 * Calls the apropriate callback when the push action has been handled by JS
 */
- (void)callPushActionCompletionHandlerWithID:(NSString *)completionHandlerID
{
  RCTAssertMainThread();
  void (^completionHandler)() = __pendingPushActionCallbacks[completionHandlerID];
  RCTAssert(completionHandler, @"No completion handler for ID");
  [__pendingPushActionCallbacks removeObjectForKey:completionHandlerID];
  completionHandler();
}

/**
 * Calls the apropriate callback when the push action has been handled by JS
 */
RCT_EXPORT_METHOD(callPushActionCompletionHandler:(NSString *)completionHandlerID) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [self callPushActionCompletionHandlerWithID:completionHandlerID];
  });
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
  callback(@[@(RCTSharedApplication().applicationIconBadgeNumber)]);
}

RCT_EXPORT_METHOD(registerUserNotificationSettings:(UIUserNotificationSettings *)settings
                                          resolver:(RCTPromiseResolveBlock)resolve
                                          rejecter:(RCTPromiseRejectBlock)reject)
{
  if (RCTRunningInAppExtension()) {
    reject(RCTErrorUnableToRequestPermissions, nil, RCTErrorWithMessage(@"Requesting push notifications is currently unavailable in an app extension"));
    return;
  }

  if (_requestPermissionsResolveBlock != nil) {
    RCTLogError(@"Cannot call registerUserNotificationSettings twice before the first has returned.");
    return;
  }
  _requestPermissionsResolveBlock = resolve;

  UIApplication *app = RCTSharedApplication();
  if ([app respondsToSelector:@selector(registerUserNotificationSettings:)]) {
    [app registerUserNotificationSettings:settings];
  } else {
    [app registerForRemoteNotificationTypes:(NSUInteger)settings.types];
  }
}

RCT_EXPORT_METHOD(abandonPermissions)
{
  [RCTSharedApplication() unregisterForRemoteNotifications];
}

RCT_EXPORT_METHOD(checkPermissions:(RCTResponseSenderBlock)callback)
{
  if (RCTRunningInAppExtension()) {
    callback(@[@{@"alert": @NO, @"badge": @NO, @"sound": @NO}]);
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

  callback(@[@{
    @"alert": @((types & UIUserNotificationTypeAlert) > 0),
    @"badge": @((types & UIUserNotificationTypeBadge) > 0),
    @"sound": @((types & UIUserNotificationTypeSound) > 0),
  }]);
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

RCT_EXPORT_METHOD(cancelLocalNotifications:(NSDictionary<NSString *, id> *)userInfo)
{
  for (UILocalNotification *notification in [UIApplication sharedApplication].scheduledLocalNotifications) {
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
    if (matchesAll) {
      [[UIApplication sharedApplication] cancelLocalNotification:notification];
    }
  }
}

RCT_EXPORT_METHOD(getInitialNotification:(RCTPromiseResolveBlock)resolve
                  reject:(__unused RCTPromiseRejectBlock)reject)
{
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
}

RCT_EXPORT_METHOD(getScheduledLocalNotifications:(RCTResponseSenderBlock)callback)
{
  NSArray<UILocalNotification *> *scheduledLocalNotifications = [UIApplication sharedApplication].scheduledLocalNotifications;
  NSMutableArray<NSDictionary *> *formattedScheduledLocalNotifications = [NSMutableArray new];
  for (UILocalNotification *notification in scheduledLocalNotifications) {
    [formattedScheduledLocalNotifications addObject:RCTFormatLocalNotification(notification)];
  }
  callback(@[formattedScheduledLocalNotifications]);
}

RCT_EXPORT_METHOD(setScheduledLocalNotifications:(UILocalNotificationArray *)notifications
                                        resolver:(RCTPromiseResolveBlock)resolve
                                        rejecter:(__unused RCTPromiseRejectBlock)reject)
{
  [RCTSharedApplication() cancelAllLocalNotifications];
  [RCTSharedApplication() setScheduledLocalNotifications:notifications];
  resolve(nil);
}

@end
