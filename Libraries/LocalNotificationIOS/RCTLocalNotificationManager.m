//
//  RCTLocalNotificationManager.m
//

#import "RCTLocalNotificationManager.h"
#import "RCTEventDispatcher.h"

NSString *const RCTLocalNotificationReceived = @"LocalNotificationReceived";
NSString *const RCTNotificationPermissionsReceived = @"NotificationPermissionsReceived";

@implementation RCTLocalNotificationManager

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

#pragma mark - Initialization

- (instancetype)init {
  if ((self = [super init])) {
    NSNotificationCenter *const defaultCenter = [NSNotificationCenter defaultCenter];

    [defaultCenter addObserver:self
                      selector:@selector(handleLocalNotificationReceived:)
                          name:RCTLocalNotificationReceived
                        object:nil];

    [defaultCenter addObserver:self
                      selector:@selector(handleNotificationPermissionsReceived:)
                          name:RCTNotificationPermissionsReceived
                        object:nil];
  }

  return self;
}

- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Notification Handlers

- (void)handleLocalNotificationReceived:(NSNotification *)notification {
  [[self.bridge eventDispatcher] sendDeviceEventWithName:@"localNotificationReceived"
                                                    body:[notification userInfo]];
}

- (void)handleNotificationPermissionsReceived:(NSNotification *)notification {
  [[self.bridge eventDispatcher] sendDeviceEventWithName:@"notificationPermissionsReceived"
                                                    body:[notification userInfo]];
}

#pragma mark - Convenience Methods

+ (NSDictionary *)dictionaryFromUserNotificationTypes:(UIUserNotificationType)types {
  return @{
           @"alert": @((BOOL)(types & UIUserNotificationTypeAlert)),
           @"badge": @((BOOL)(types & UIUserNotificationTypeBadge)),
           @"sound": @((BOOL)(types & UIUserNotificationTypeBadge)),
           };
}

#pragma mark - AppDelegate Forward Methods

+ (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)userNotificationSettings {
  UIUserNotificationType types = [userNotificationSettings types];
  NSDictionary *permissions = [self dictionaryFromUserNotificationTypes:types];

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTNotificationPermissionsReceived
                                                      object:self
                                                    userInfo:permissions];
}

+ (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)localNotification {
  NSDictionary *userInfo = @{
                             @"body": [localNotification alertBody] ?: @"",
                             @"title": [localNotification alertTitle] ?: @"",
                             @"action": [localNotification alertAction] ?: @"",
                             };

  [[NSNotificationCenter defaultCenter] postNotificationName:RCTLocalNotificationReceived
                                                      object:self
                                                    userInfo:userInfo];
}

#pragma mark - Exported Methods

RCT_EXPORT_METHOD(setApplicationIconBadgeNumber:(NSInteger)number) {
  [UIApplication sharedApplication].applicationIconBadgeNumber = number;
}

RCT_EXPORT_METHOD(getApplicationIconBadgeNumber:(RCTResponseSenderBlock)callback) {
  callback(@[@([UIApplication sharedApplication].applicationIconBadgeNumber)]);
}

RCT_EXPORT_METHOD(requestPermissions) {
  UIUserNotificationType types = UIUserNotificationTypeSound | UIUserNotificationTypeBadge | UIUserNotificationTypeAlert;
  UIUserNotificationSettings *notificationSettings = [UIUserNotificationSettings settingsForTypes:types categories:nil];
  [[UIApplication sharedApplication] registerUserNotificationSettings:notificationSettings];
}

RCT_EXPORT_METHOD(checkPermissions:(RCTResponseSenderBlock)callback) {
  UIUserNotificationType types = [[[UIApplication sharedApplication] currentUserNotificationSettings] types];
  NSDictionary *permissions = [self.class dictionaryFromUserNotificationTypes:types];
  callback(@[permissions]);
}

RCT_EXPORT_METHOD(presentLocalNotificationNow:(NSDictionary *)localNotification) {
  UILocalNotification *notification = [UILocalNotification new];
  [notification setAlertAction:(localNotification[@"action"] ?: @"")];
  [notification setAlertBody:(localNotification[@"body"] ?: @"")];
  [notification setAlertTitle:(localNotification[@"title"] ?: @"")];

  [[UIApplication sharedApplication] presentLocalNotificationNow:notification];
}

@end
