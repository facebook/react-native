/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSceneDelegate.h"
#import "RCTReactNativeFactory.h"
#import "RCTRootViewFactory.h"

@implementation RCTSceneDelegate

- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)connectionOptions API_AVAILABLE(ios(13.0))
{
  if (![scene isKindOfClass:[UIWindowScene class]]) {
    return;
  }

  UIWindowScene *windowScene = (UIWindowScene *)scene;

  self.window = [[UIWindow alloc] initWithWindowScene:windowScene];

  if (self.reactNativeFactory) {
    UIView *rootView = [self.reactNativeFactory.rootViewFactory
        viewWithModuleName:self.reactNativeFactory.rootViewFactory.moduleName
         initialProperties:self.reactNativeFactory.rootViewFactory.initialProperties
             launchOptions:connectionOptions.notificationResponse.notification.request.content.userInfo];

    UIViewController *rootViewController = [UIViewController new];
    rootViewController.view = rootView;
    self.window.rootViewController = rootViewController;
  }

  [self.window makeKeyAndVisible];
}

- (void)sceneDidDisconnect:(UIScene *)scene API_AVAILABLE(ios(13.0))
{
}

- (void)sceneDidBecomeActive:(UIScene *)scene API_AVAILABLE(ios(13.0))
{
}

- (void)sceneWillResignActive:(UIScene *)scene API_AVAILABLE(ios(13.0))
{
}

- (void)sceneWillEnterForeground:(UIScene *)scene API_AVAILABLE(ios(13.0))
{
}

- (void)sceneDidEnterBackground:(UIScene *)scene API_AVAILABLE(ios(13.0))
{
}

@end
