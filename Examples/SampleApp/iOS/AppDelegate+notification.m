/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

 #if __has_include("RCTPushNotificationManager.h")

#import "AppDelegate+notification.h"
#import "RCTPushNotificationManager.h"

@implementation AppDelegate (notification)

- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
  [[RCTPushNotificationManager class] application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings];
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification {
  [[RCTPushNotificationManager class] application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification];
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken {
  [[RCTPushNotificationManager class] application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error {
  [[RCTPushNotificationManager class] application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error];
}

@end

#endif
