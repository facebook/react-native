/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTEventEmitter.h>

@interface RCTLinkingManager : RCTEventEmitter

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

@end
