/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPushNotificationManager.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTUtils.h>

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0
@import UserNotifications;
@import CoreLocation;
#endif

NSString *const RCTLocalNotificationReceived = @"LocalNotificationReceived";
NSString *const RCTRemoteNotificationReceived = @"RemoteNotificationReceived";
NSString *const RCTNotificationWillPresent = @"NotificationWillPresent";
NSString *const RCTRemoteNotificationsRegistered = @"RemoteNotificationsRegistered";
NSString *const RCTRegisterUserNotificationSettings = @"RegisterUserNotificationSettings";

NSString *const RCTErrorUnableToRequestPermissions = @"E_UNABLE_TO_REQUEST_PERMISSIONS";
NSString *const RCTErrorRemoteNotificationRegistrationFailed = @"E_FAILED_TO_REGISTER_FOR_REMOTE_NOTIFICATIONS";

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

@implementation RCTConvert (CLCircularRegion)

+ (CLCircularRegion *)CLCircularRegion:(id)json
{
  NSDictionary<NSString *, id> *regionDict = [self NSDictionary:json];
  
  if (regionDict[@"latitude"] && regionDict[@"longitude"] && regionDict[@"radius"]) {
    CLLocationDegrees latitude = [self double:regionDict[@"latitude"]];
    CLLocationDegrees longitude = [self double:regionDict[@"longitude"]];
    
    CLCircularRegion *region = [[CLCircularRegion alloc] initWithCenter:CLLocationCoordinate2DMake(latitude, longitude) radius:[self double:regionDict[@"radius"]] identifier:[self NSString:regionDict[@"id"]] ?: [[NSUUID new] UUIDString]];
    
    return region;
  }
  
  return nil;
}

@end

@interface RCTPushNotificationManager ()
@property (nonatomic, strong) NSMutableDictionary *remoteNotificationCallbacks;
@property (nonatomic, strong) NSMutableDictionary *willPresentNotificationCallbacks;
@end

@implementation RCTConvert (UILocalNotification)

+ (UILocalNotification *)UILocalNotification:(id)json
{
  NSDictionary<NSString *, id> *details = [self NSDictionary:json];
  BOOL isSilent = [RCTConvert BOOL:details[@"isSilent"]];
  UILocalNotification *notification = [UILocalNotification new];
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

RCT_ENUM_CONVERTER(UIBackgroundFetchResult, (@{
                                               @"UIBackgroundFetchResultNewData": @(UIBackgroundFetchResultNewData),
                                               @"UIBackgroundFetchResultNoData": @(UIBackgroundFetchResultNoData),
                                               @"UIBackgroundFetchResultFailed": @(UIBackgroundFetchResultFailed),
                                               }), UIBackgroundFetchResultNoData, integerValue)

@end

#endif //TARGET_OS_TV

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0 && !TARGET_OS_TV
@implementation RCTConvert (UNNotificationRequest)

+ (UNNotificationRequest *)UNNotificationRequest:(id)json
{
  NSDictionary<NSString *, id> *details = [self NSDictionary:json];
  BOOL isSilent = [RCTConvert BOOL:details[@"isSilent"]];
  UNMutableNotificationContent
  *content = [[UNMutableNotificationContent
               alloc] init];
  content.badge = [RCTConvert NSNumber:details[@"applicationIconBadgeNumber"]];
  content.body = [RCTConvert NSString:details[@"alertBody"]];
  content.categoryIdentifier = [RCTConvert NSString:details[@"category"]];
  content.title = [RCTConvert NSString:details[@"alertTitle"]];
  content.subtitle = [RCTConvert NSString:details[@"alertSubtitle"]];
  content.userInfo = [RCTConvert NSDictionary:details[@"userInfo"]];
  if (!isSilent) {
    content.sound = [RCTConvert NSString:details[@"soundName"]] ? [UNNotificationSound soundNamed:[RCTConvert NSString:details[@"soundName"]]] : [UNNotificationSound defaultSound];
  }
  
  NSArray *attachments = [RCTConvert NSArray:details[@"alertAttachments"]];
  if (attachments) {
    
    NSMutableArray *convertedAttachments = [NSMutableArray new];
    for (NSDictionary *attachment in attachments) {
      
      if ([attachment isKindOfClass:[NSDictionary class]]) {
        
        NSDictionary<NSString *, id> *attachmentDict = [self NSDictionary:attachment];
        NSString *identifier = [RCTConvert NSString:attachmentDict[@"identifier"]];
        NSURL *url = [RCTConvert NSURL:attachmentDict[@"url"]];
        NSError *creationError = nil;
        
        if (identifier && url) {
          UNNotificationAttachment *notificationAttachment = [UNNotificationAttachment attachmentWithIdentifier:identifier URL:url options:[RCTConvert NSDictionary:attachmentDict[@"options"]] error:&creationError];
          if (notificationAttachment && !creationError) {
            [convertedAttachments addObject:attachment];
          }
        }
      }
    }
    content.attachments = convertedAttachments;
  }
  
  UNNotificationTrigger *trigger;
  
  NSDate *fireDate = [self NSDate:details[@"fireDate"]];
  NSCalendarUnit repeatInterval = [RCTConvert NSCalendarUnit:details[@"repeatInterval"]];
  NSTimeInterval timeInterval = [RCTConvert NSTimeInterval:details[@"timeInterval"]];
  CLCircularRegion *region = [RCTConvert CLCircularRegion:details[@"region"]];
  BOOL repeats = [RCTConvert BOOL:details[@"repeats"]];
  
  if (fireDate) {
    
    NSDateComponents *dateComponents = [[NSCalendar currentCalendar] components:NSCalendarUnitYear|NSCalendarUnitMonth|NSCalendarUnitDay|NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitSecond fromDate:fireDate];
    
    trigger = [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:dateComponents repeats:repeatInterval == NSCalendarUnitDay || repeats];
    
  } else if (region) {
    trigger = [UNLocationNotificationTrigger triggerWithRegion:region repeats:repeats];
  } else {
    trigger = [UNTimeIntervalNotificationTrigger triggerWithTimeInterval:timeInterval repeats:repeats];
  }
  
  UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:[RCTConvert NSString:details[@"notificationId"]] ?: [NSUUID new].UUIDString content:content trigger:nil];
  
  return request;
}

@end
#endif

@implementation RCTPushNotificationManager
{
  RCTPromiseResolveBlock _requestPermissionsResolveBlock;
}

#if !TARGET_OS_TV && defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0

static NSDictionary *RCTFormatNotificationTrigger(UNNotificationTrigger *trigger)
{
  NSMutableDictionary *formattedNotificationTrigger = [NSMutableDictionary dictionary];
  
  if ([trigger isKindOfClass:[UNCalendarNotificationTrigger class]]) {
    
    UNCalendarNotificationTrigger *calendarTrigger = (UNCalendarNotificationTrigger *)trigger;
    formattedNotificationTrigger[@"type"] = @"calendar";
    
    NSDate *nextTriggerDate = [calendarTrigger nextTriggerDate];
    if (nextTriggerDate) {
      NSDateFormatter *formatter = [NSDateFormatter new];
      [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"];
      NSString *nextTriggerDateString = [formatter stringFromDate:nextTriggerDate];
      formattedNotificationTrigger[@"nextTriggerDate"] = nextTriggerDateString;
    } else {
      formattedNotificationTrigger[@"nextTriggerDate"] = (id)kCFNull;
    }
    
  } else if ([trigger isKindOfClass:[UNTimeIntervalNotificationTrigger class]]) {
    
    UNTimeIntervalNotificationTrigger *timeIntervalTrigger = (UNTimeIntervalNotificationTrigger *)trigger;
    formattedNotificationTrigger[@"type"] = @"timeInterval";
    
    NSDate *nextTriggerDate = [timeIntervalTrigger nextTriggerDate];
    if (nextTriggerDate) {
      NSDateFormatter *formatter = [NSDateFormatter new];
      [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"];
      NSString *nextTriggerDateString = [formatter stringFromDate:nextTriggerDate];
      formattedNotificationTrigger[@"nextTriggerDate"] = nextTriggerDateString;
    } else {
      formattedNotificationTrigger[@"nextTriggerDate"] = (id)kCFNull;
    }
    
    formattedNotificationTrigger[@"timeInterval"] = @(timeIntervalTrigger.timeInterval);
    
  } else if ([trigger isKindOfClass:[UNLocationNotificationTrigger class]]) {
    
    UNLocationNotificationTrigger *locationTrigger = (UNLocationNotificationTrigger *)trigger;
    formattedNotificationTrigger[@"type"] = @"location";
    
    if ([locationTrigger.region isKindOfClass:[CLCircularRegion class]]) {
      CLCircularRegion *locationTriggerRegion = (CLCircularRegion *)locationTrigger.region;
      formattedNotificationTrigger[@"region"] = @{
                                                  @"radius": @(locationTriggerRegion.radius),
                                                  @"coordinate": @{
                                                      @"latitude": @(locationTriggerRegion.center.latitude),
                                                      @"longitude": @(locationTriggerRegion.center.longitude)
                                                      }
                                                  };
    }
    
  } else if ([trigger isKindOfClass:[UNPushNotificationTrigger class]]) {
    
    formattedNotificationTrigger[@"type"] = @"push";
  }
  
  return formattedNotificationTrigger;
}

static NSDictionary *RCTFormatNotificationRequest(UNNotificationRequest *request)
{
  NSMutableDictionary *formattedNotificationRequest = [NSMutableDictionary dictionary];
  
  if (request.trigger) {
    formattedNotificationRequest[@"trigger"] = RCTFormatNotificationTrigger(request.trigger);
  } else {
    formattedNotificationRequest[@"trigger"] = (id)kCFNull;
  }
  
  formattedNotificationRequest[@"alertBody"] = RCTNullIfNil(request.content.body);
  formattedNotificationRequest[@"applicationIconBadgeNumber"] = RCTNullIfNil(request.content.badge);
  formattedNotificationRequest[@"category"] = RCTNullIfNil(request.content.categoryIdentifier);
  formattedNotificationRequest[@"thread-id"] = RCTNullIfNil(request.content.threadIdentifier);
  formattedNotificationRequest[@"notificationId"] = RCTNullIfNil(request.identifier);
  formattedNotificationRequest[@"alertTitle"] = RCTNullIfNil(request.content.title);
  formattedNotificationRequest[@"alertSubtitle"] = RCTNullIfNil(request.content.subtitle);
  
  if (request.content.userInfo) {
    formattedNotificationRequest[@"userInfo"] = RCTNullIfNil(RCTJSONClean(request.content.userInfo));
  } else {
    formattedNotificationRequest[@"userInfo"] = (id)kCFNull;
  }
  
  formattedNotificationRequest[@"remote"] = request.trigger && [request.trigger isKindOfClass:[UNPushNotificationTrigger class]] ? @YES : @NO;
  
  return formattedNotificationRequest;
}

static NSDictionary *RCTFormatNotification(UNNotification *notification)
{
  NSMutableDictionary *formattedLocalNotification = [NSMutableDictionary dictionary];
  if (notification.date) {
    NSDateFormatter *formatter = [NSDateFormatter new];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"];
    NSString *fireDateString = [formatter stringFromDate:notification.date];
    formattedLocalNotification[@"fireDate"] = fireDateString;
  }
  
  NSDictionary *formattedRequest = RCTFormatNotificationRequest(notification.request);
  [formattedLocalNotification setValuesForKeysWithDictionary:formattedRequest];
  
  return formattedLocalNotification;
}

#endif

#if !TARGET_OS_TV

static NSDictionary *RCTFormatLocalNotification(UILocalNotification *notification)
{
  NSMutableDictionary *formattedLocalNotification = [NSMutableDictionary dictionary];
  if (notification.fireDate) {
    NSDateFormatter *formatter = [NSDateFormatter new];
    [formatter setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss.SSSZZZZZ"];
    NSString *fireDateString = [formatter stringFromDate:notification.fireDate];
    formattedLocalNotification[@"fireDate"] = fireDateString;
    formattedLocalNotification[@"trigger"] = @{
                                               @"type": @"calendar",
                                               @"nextTriggerDate": fireDateString
                                               };
  }
  formattedLocalNotification[@"alertAction"] = RCTNullIfNil(notification.alertAction);
  formattedLocalNotification[@"alertTitle"] = RCTNullIfNil(notification.alertTitle);
  formattedLocalNotification[@"alertBody"] = RCTNullIfNil(notification.alertBody);
  formattedLocalNotification[@"applicationIconBadgeNumber"] = @(notification.applicationIconBadgeNumber);
  formattedLocalNotification[@"category"] = RCTNullIfNil(notification.category);
  formattedLocalNotification[@"soundName"] = RCTNullIfNil(notification.soundName);
  formattedLocalNotification[@"userInfo"] = RCTNullIfNil(RCTJSONClean(notification.userInfo));
  formattedLocalNotification[@"remote"] = @NO;
  return formattedLocalNotification;
}

#endif //TARGET_OS_TV

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
                                               name:RCTLocalNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationReceived:)
                                               name:RCTRemoteNotificationReceived
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRegisterUserNotificationSettings:)
                                               name:RCTRegisterUserNotificationSettings
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationsRegistered:)
                                               name:RCTRemoteNotificationsRegistered
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleRemoteNotificationRegistrationError:)
                                               name:RCTErrorRemoteNotificationRegistrationFailed
                                             object:nil];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleWillPresentNotification:)
                                               name:RCTNotificationWillPresent
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

+ (void)didRegisterUserNotificationSettings:(__unused UIUserNotificationSettings *)notificationSettings
{
  if ([UIApplication instancesRespondToSelector:@selector(registerForRemoteNotifications)]) {
    [RCTSharedApplication() registerForRemoteNotifications];
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTRegisterUserNotificationSettings
                                                        object:self
                                                      userInfo:@{@"notificationSettings": notificationSettings}];
  }
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

+ (void)didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTErrorRemoteNotificationRegistrationFailed
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

+ (void)didReceiveRemoteNotification:(NSDictionary *)notification
              fetchCompletionHandler:(RCTRemoteNotificationCallback)completionHandler
{
  NSDictionary *userInfo = @{@"notification": notification, @"completionHandler": completionHandler};
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTRemoteNotificationReceived
                                                      object:self
                                                    userInfo:userInfo];
}

+ (void)willPresentNotification:(NSDictionary *)notification showCompletionHandler:(RCTWillPresentNotificationCallback)completionHandler
{
  NSDictionary *userInfo = @{@"notification": notification, @"completionHandler": completionHandler};
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTNotificationWillPresent
                                                      object:self
                                                    userInfo:userInfo];
}

+ (void)didReceiveLocalNotification:(UILocalNotification *)notification
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTLocalNotificationReceived
                                                      object:self
                                                    userInfo:RCTFormatLocalNotification(notification)];
}

- (void)handleWillPresentNotification:(NSNotification *)notification
{
  NSMutableDictionary *remoteNotification = [RCTFormatNotification(notification.userInfo[@"notification"]) mutableCopy];
  RCTWillPresentNotificationCallback completionHandler = notification.userInfo[@"completionHandler"];
  
  NSString *notificationId = remoteNotification[@"notificationId"];
  if (!notificationId) {
    notificationId = [[NSUUID UUID] UUIDString];
    remoteNotification[@"notificationId"] = notificationId;
  }
  
  if (completionHandler) {
    if (!self.willPresentNotificationCallbacks) {
      // Lazy initialization
      self.willPresentNotificationCallbacks = [NSMutableDictionary dictionary];
    }
    self.remoteNotificationCallbacks[notificationId] = completionHandler;
  }
  
  [self sendEventWithName:@"willPresentNotification" body:remoteNotification];
}

- (void)handleLocalNotificationReceived:(NSNotification *)notification
{
  [self sendEventWithName:@"localNotificationReceived" body:notification.userInfo];
}

- (void)handleRemoteNotificationReceived:(NSNotification *)notification
{
  NSMutableDictionary *remoteNotification = [NSMutableDictionary dictionaryWithDictionary:notification.userInfo[@"notification"]];
  RCTRemoteNotificationCallback completionHandler = notification.userInfo[@"completionHandler"];
  NSString *notificationId = [[NSUUID UUID] UUIDString];
  remoteNotification[@"notificationId"] = notificationId;
  remoteNotification[@"remote"] = @YES;
  if (completionHandler) {
    if (!self.remoteNotificationCallbacks) {
      // Lazy initialization
      self.remoteNotificationCallbacks = [NSMutableDictionary dictionary];
    }
    self.remoteNotificationCallbacks[notificationId] = completionHandler;
  }
  
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
  
  UIUserNotificationSettings *notificationSettings = notification.userInfo[@"notificationSettings"];
  NSDictionary *notificationTypes = @{
                                      @"alert": @((notificationSettings.types & UIUserNotificationTypeAlert) > 0),
                                      @"sound": @((notificationSettings.types & UIUserNotificationTypeSound) > 0),
                                      @"badge": @((notificationSettings.types & UIUserNotificationTypeBadge) > 0),
                                      };
  
  _requestPermissionsResolveBlock(notificationTypes);
  // Clean up listener added in requestPermissions
  [self removeListeners:1];
  _requestPermissionsResolveBlock = nil;
}

RCT_EXPORT_METHOD(onFinishRemoteNotification:(NSString *)notificationId fetchResult:(UIBackgroundFetchResult)result) {
  RCTRemoteNotificationCallback completionHandler = self.remoteNotificationCallbacks[notificationId];
  if (!completionHandler) {
    RCTLogError(@"There is no completion handler with notification id: %@", notificationId);
    return;
  }
  completionHandler(result);
  [self.remoteNotificationCallbacks removeObjectForKey:notificationId];
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

#endif //TARGET_OS_TV

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_10_0

RCT_EXPORT_METHOD(presentLocalNotification:(UNNotificationRequest *)request callback:(RCTResponseSenderBlock)callback)
{
  UNUserNotificationCenter *notificationCenter = [UNUserNotificationCenter currentNotificationCenter];
  [notificationCenter addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (error) {
      callback(@[RCTMakeError(error.localizedDescription, nil, error.userInfo)]);
    } else {
      callback(@[]);
    }
  }];
}

RCT_EXPORT_METHOD(scheduleLocalNotification:(UNNotificationRequest *)request callback:(RCTResponseSenderBlock)callback)
{
  UNUserNotificationCenter *notificationCenter = [UNUserNotificationCenter currentNotificationCenter];
  [notificationCenter addNotificationRequest:request withCompletionHandler:^(NSError * _Nullable error) {
    if (error) {
      callback(@[RCTMakeError(error.localizedDescription, nil, error.userInfo)]);
    } else {
      callback(@[]);
    }
  }];
}

RCT_EXPORT_METHOD(cancelAllLocalNotifications)
{
  [[UNUserNotificationCenter currentNotificationCenter] removeAllPendingNotificationRequests];
}

RCT_EXPORT_METHOD(cancelLocalNotificationsWithIds:(NSArray<NSString *> *)identifiers)
{
  [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:identifiers];
}

RCT_EXPORT_METHOD(getDeliveredNotifications:(RCTResponseSenderBlock)callback)
{
  UNUserNotificationCenter *notificationCenter = [UNUserNotificationCenter currentNotificationCenter];
  [notificationCenter getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotification *> * _Nonnull notifications) {
    NSMutableArray<NSDictionary *> *formattedDeliveredNotifications = [NSMutableArray new];
    for (UNNotification *notification in notifications) {
      [formattedDeliveredNotifications addObject:RCTFormatNotification(notification)];
    }
    callback(@[formattedDeliveredNotifications]);
  }];
}

RCT_EXPORT_METHOD(getScheduledLocalNotifications:(RCTResponseSenderBlock)callback)
{
  UNUserNotificationCenter *notificationCenter = [UNUserNotificationCenter currentNotificationCenter];
  [notificationCenter getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> * _Nonnull requests) {
    NSMutableArray<NSDictionary *> *formattedScheduledLocalNotifications = [NSMutableArray new];
    for (UNNotificationRequest *request in requests) {
      [formattedScheduledLocalNotifications addObject:RCTFormatNotificationRequest(request)];
    }
    callback(@[formattedScheduledLocalNotifications]);
  }];
}

RCT_EXPORT_METHOD(requestPermissions:(NSDictionary *)permissions resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if (RCTRunningInAppExtension()) {
    reject(RCTErrorUnableToRequestPermissions, nil, RCTErrorWithMessage(@"Requesting push notifications is currently unavailable in an app extension"));
    return;
  }
  
  if (_requestPermissionsResolveBlock != nil) {
    RCTLogError(@"Cannot call requestPermissions twice before the first has returned.");
    return;
  }
  
  _requestPermissionsResolveBlock = resolve;
  
  // Add a listener to make sure that startObserving has been called
  [self addListener:@"remoteNotificationsRegistered"];
  
  UNAuthorizationOptions types = UNAuthorizationOptionNone;
  if (permissions) {
    if ([RCTConvert BOOL:permissions[@"alert"]]) {
      types |= UNAuthorizationOptionAlert;
    }
    if ([RCTConvert BOOL:permissions[@"badge"]]) {
      types |= UNAuthorizationOptionBadge;
    }
    if ([RCTConvert BOOL:permissions[@"sound"]]) {
      types |= UNAuthorizationOptionSound;
    }
    if ([RCTConvert BOOL:permissions[@"carPlay"]]) {
      types |= UNAuthorizationOptionCarPlay;
    }
  } else {
    types = UNAuthorizationOptionAlert | UNAuthorizationOptionBadge | UNAuthorizationOptionSound;
  }
  
  UNUserNotificationCenter *notificationCenter = [UNUserNotificationCenter currentNotificationCenter];
  
  [notificationCenter requestAuthorizationWithOptions:types completionHandler:^(BOOL granted, NSError * _Nullable error) {
    if (error) {
      reject(error.domain, error.localizedDescription, error);
    } else if (!granted) {
      reject(RCTErrorRemoteNotificationRegistrationFailed, nil, RCTErrorWithMessage(@"Push notification permissions weren't granted"));
    } else {
      [RCTSharedApplication() registerForRemoteNotifications];
    }
  }];
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
  
  NSUInteger types = [RCTSharedApplication() currentUserNotificationSettings].types;
  callback(@[@{
               @"alert": @((types & UIUserNotificationTypeAlert) > 0),
               @"badge": @((types & UIUserNotificationTypeBadge) > 0),
               @"sound": @((types & UIUserNotificationTypeSound) > 0),
               }]);
}

#elif !TARGET_OS_TV

RCT_EXPORT_METHOD(cancelAllLocalNotifications)
{
  [RCTSharedApplication() cancelAllLocalNotifications];
}

RCT_EXPORT_METHOD(cancelLocalNotifications:(NSDictionary<NSString *, id> *)userInfo)
{
  for (UILocalNotification *notification in RCTSharedApplication().scheduledLocalNotifications) {
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
      [RCTSharedApplication() cancelLocalNotification:notification];
    }
  }
}

RCT_EXPORT_METHOD(getScheduledLocalNotifications:(RCTResponseSenderBlock)callback)
{
  NSArray<UILocalNotification *> *scheduledLocalNotifications = RCTSharedApplication().scheduledLocalNotifications;
  NSMutableArray<NSDictionary *> *formattedScheduledLocalNotifications = [NSMutableArray new];
  for (UILocalNotification *notification in scheduledLocalNotifications) {
    [formattedScheduledLocalNotifications addObject:RCTFormatLocalNotification(notification)];
  }
  callback(@[formattedScheduledLocalNotifications]);
}

RCT_EXPORT_METHOD(presentLocalNotification:(UILocalNotification *)notification)
{
  [RCTSharedApplication() presentLocalNotificationNow:notification];
}

RCT_EXPORT_METHOD(scheduleLocalNotification:(UILocalNotification *)notification)
{
  [RCTSharedApplication() scheduleLocalNotification:notification];
}

RCT_EXPORT_METHOD(requestPermissions:(NSDictionary *)permissions resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)
{
  if (RCTRunningInAppExtension()) {
    reject(RCTErrorUnableToRequestPermissions, nil, RCTErrorWithMessage(@"Requesting push notifications is currently unavailable in an app extension"));
    return;
  }
  
  if (_requestPermissionsResolveBlock != nil) {
    RCTLogError(@"Cannot call requestPermissions twice before the first has returned.");
    return;
  }
  
  // Add a listener to make sure that startObserving has been called
  [self addListener:@"remoteNotificationsRegistered"];
  
  _requestPermissionsResolveBlock = resolve;
  
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
  
  UIApplication *app = RCTSharedApplication();
  if ([app respondsToSelector:@selector(registerUserNotificationSettings:)]) {
    UIUserNotificationSettings *notificationSettings =
    [UIUserNotificationSettings settingsForTypes:(NSUInteger)types categories:nil];
    [app registerUserNotificationSettings:notificationSettings];
  } else {
    [app registerForRemoteNotificationTypes:(NSUInteger)types];
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
  
  NSUInteger types = [RCTSharedApplication() currentUserNotificationSettings].types;
  callback(@[@{
               @"alert": @((types & UIUserNotificationTypeAlert) > 0),
               @"badge": @((types & UIUserNotificationTypeBadge) > 0),
               @"sound": @((types & UIUserNotificationTypeSound) > 0),
               }]);
}

#elif TARGET_OS_TV //TARGET_OS_TV

- (NSArray<NSString *> *)supportedEvents
{
  return @[];
}

#endif //TARGET_OS_TV

@end


