/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <FBReactKit/RCTBridgeModule.h>

extern NSString *const RKRemoteNotificationReceived;
extern NSString *const RKOpenURLNotification;

@interface RCTPushNotificationManager : NSObject <RCTBridgeModule>

- (instancetype)initWithInitialNotification:(NSDictionary *)initialNotification NS_DESIGNATED_INITIALIZER;

@end
