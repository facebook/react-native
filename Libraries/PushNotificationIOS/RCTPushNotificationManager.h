/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTEventEmitter.h>

extern NSString *const RCTRemoteNotificationReceived;

@interface RCTPushNotificationManager : RCTEventEmitter

#if !TARGET_OS_OSX // TODO(macOS GH#774)
typedef void (^RCTRemoteNotificationCallback)(UIBackgroundFetchResult result);
#endif // TODO(macOS GH#774)

#if !TARGET_OS_UIKITFORMAC
#if !TARGET_OS_OSX // TODO(macOS GH#774)
+ (void)didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings;
#endif // TODO(macOS GH#774)
+ (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
+ (void)didReceiveRemoteNotification:(NSDictionary *)notification;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
+ (void)didReceiveRemoteNotification:(NSDictionary *)notification fetchCompletionHandler:(RCTRemoteNotificationCallback)completionHandler;
+ (void)didReceiveLocalNotification:(UILocalNotification *)notification;
#endif // [TODO(macOS GH#774)
#if TARGET_OS_OSX
+ (void)didReceiveUserNotification:(NSUserNotification *)notification;
#endif // ]TODO(macOS GH#774)
+ (void)didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;
#endif

@end
