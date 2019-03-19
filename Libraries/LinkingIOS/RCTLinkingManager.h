/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
+ (BOOL)application:(nonnull UIApplication *)app
            openURL:(nonnull NSURL *)URL
            options:(nonnull NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options;

+ (BOOL)application:(nonnull UIApplication *)application
              openURL:(nonnull NSURL *)URL
    sourceApplication:(nullable NSString *)sourceApplication
           annotation:(nonnull id)annotation;

+ (BOOL)application:(nonnull UIApplication *)application
    continueUserActivity:(nonnull NSUserActivity *)userActivity
      restorationHandler:(nonnull void (^)(NSArray *__nullable))restorationHandler;
#endif // TODO(macOS ISS#2323203)
@end

#pragma clang diagnostic pop
