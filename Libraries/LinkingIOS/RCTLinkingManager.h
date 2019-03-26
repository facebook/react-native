/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

#import <React/RCTEventEmitter.h>

@interface RCTLinkingManager : RCTEventEmitter

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wnullability-completeness"

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
+ (void)getUrlEventHandler:(NSAppleEventDescriptor *)event withReplyEvent:(NSAppleEventDescriptor *)replyEvent;
#else // ]TODO(macOS ISS#2323203)
+ (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)URL
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options;

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation;

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
  restorationHandler:(void (^ _Nullable)(NSArray * __nullable))restorationHandler;
#endif // TODO(macOS ISS#2323203)
@end

#pragma clang diagnostic pop
