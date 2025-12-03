/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSceneDelegate.h"
#import <UIKit/UIKit.h>
#import "RCTAppDelegate.h"
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

  // Get the app delegate to access the React Native factory
  RCTAppDelegate *appDelegate = (RCTAppDelegate *)[UIApplication sharedApplication].delegate;

  if (appDelegate && [appDelegate respondsToSelector:@selector(rootViewFactory)]) {
    RCTRootViewFactory *rootViewFactory = appDelegate.rootViewFactory;

    UIView *rootView = [rootViewFactory viewWithModuleName:appDelegate.moduleName
                                         initialProperties:appDelegate.initialProps
                                             launchOptions:nil];

    UIViewController *rootViewController = [UIViewController new];
    rootViewController.view = rootView;
    self.window.rootViewController = rootViewController;
  }

  [self.window makeKeyAndVisible];
}

- (void)sceneDidDisconnect:(UIScene *)scene API_AVAILABLE(ios(13.0))
{
  // Scene disconnected
}

- (void)sceneDidBecomeActive:(UIScene *)scene API_AVAILABLE(ios(13.0))
{
  // Scene became active
}

- (void)sceneWillResignActive:(UIScene *)scene API_AVAILABLE(ios(13.0))
{
  // Scene will resign active
}

- (void)sceneWillEnterForeground:(UIScene *)scene API_AVAILABLE(ios(13.0))
{
  // Scene will enter foreground
}

- (void)sceneDidEnterBackground:(UIScene *)scene API_AVAILABLE(ios(13.0))
{
  // Scene entered background
}

@end
