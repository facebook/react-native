/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTBridgeModule.h"

@interface RCTPushNotificationManager : NSObject <RCTBridgeModule>

+ (void)rct_application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings;
+ (void)rct_application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken;
+ (void)rct_application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification;

@end
