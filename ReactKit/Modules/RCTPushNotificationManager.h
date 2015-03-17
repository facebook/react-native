// Copyright 2004-present Facebook. All Rights Reserved.

#import <FBReactKit/RCTBridgeModule.h>

extern NSString *const RKRemoteNotificationReceived;
extern NSString *const RKOpenURLNotification;

@interface RCTPushNotificationManager : NSObject <RCTBridgeModule>

- (instancetype)initWithInitialNotification:(NSDictionary *)initialNotification NS_DESIGNATED_INITIALIZER;

@end
