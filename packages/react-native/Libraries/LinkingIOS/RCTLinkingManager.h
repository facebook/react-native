/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTEventEmitter.h>
#import <UIKit/UIKit.h>
#import <UIKit/UIUserActivity.h>

@interface RCTLinkingManager : RCTEventEmitter

#pragma mark - AppDelegate methods

/// Lifecycle method informing of a URL being opened with the app, must be invoked from the AppDelegate.
/// Must be invoked from the AppDelegate.
/// Note: this is an implementation using the iOS 9.0-26.0 API
+ (BOOL)application:(nonnull UIApplication *)app
            openURL:(nonnull NSURL *)URL
            options:(nonnull NSDictionary<UIApplicationOpenURLOptionsKey, id> *)options;

/// Lifecycle method handling a URL being opened with the app, must be invoked from the AppDelegate.
/// Must be invoked from the AppDelegate.
/// Note: this is an implementation using the iOS 4.2-9.0 API
+ (BOOL)application:(nonnull UIApplication *)application
              openURL:(nonnull NSURL *)URL
    sourceApplication:(nullable NSString *)sourceApplication
           annotation:(nonnull id)annotation;

/// Lifecycle method handling user activity being performed.
/// Must be invoked from the AppDelegate.
+ (BOOL)application:(nonnull UIApplication *)application
    continueUserActivity:(nonnull NSUserActivity *)userActivity
      restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> *_Nullable))restorationHandler;

#pragma mark - SceneDelegate methods

/// Successor to AppDelegate's application:continueUserActivity:restorationHandler:, which handles user activity being
/// performed. Must be invoked from the SceneDelegate.
+ (void)scene:(nonnull UIScene *)scene continueUserActivity:(nonnull NSUserActivity *)userActivity;

/// Successor to AppDelegate's application:openURL:options:, which handles user activity being performed.
/// Must be invoked from the SceneDelegate.
+ (void)scene:(nonnull UIScene *)scene openURLContexts:(nonnull NSSet<UIOpenURLContext *> *)URLContexts;

@end
