/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTEventEmitter.h>

extern NSString *const RCTRemoteNotificationReceived;

@interface RCTPushNotificationManager : RCTEventEmitter

#if !TARGET_OS_OSX // [macOS]
typedef void (^RCTRemoteNotificationCallback)(UIBackgroundFetchResult result);
#endif // [macOS]

#if !TARGET_OS_UIKITFORMAC
#if !TARGET_OS_OSX // [macOS]
+ (void)didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings;
#endif // [macOS]
+ (void)didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
+ (void)didReceiveRemoteNotification:(NSDictionary *)notification;
#if !TARGET_OS_OSX // [macOS]
+ (void)didReceiveRemoteNotification:(NSDictionary *)notification
              fetchCompletionHandler:(RCTRemoteNotificationCallback)completionHandler;
+ (void)didReceiveLocalNotification:(UILocalNotification *)notification;
#endif // [macOS]
#if TARGET_OS_OSX // [macOS
+ (void)didReceiveUserNotification:(NSUserNotification *)notification;
#endif // macOS]
+ (void)didFailToRegisterForRemoteNotificationsWithError:(NSError *)error;
#endif

@end
