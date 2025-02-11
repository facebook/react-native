/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAppDelegate.h"
#import <React/RCTLog.h>
#import <React/RCTRootView.h>
#import <React/RCTSurfacePresenterBridgeAdapter.h>
#import <React/RCTUtils.h>
#import <ReactCommon/RCTHost.h>
#include <UIKit/UIKit.h>
#import <objc/runtime.h>
#import "RCTAppSetupUtils.h"
#import "RCTDependencyProvider.h"

#if RN_DISABLE_OSS_PLUGIN_HEADER
#import <RCTTurboModulePlugin/RCTTurboModulePlugin.h>
#else
#import <React/CoreModulesPlugins.h>
#endif
#import <React/RCTComponentViewFactory.h>
#import <React/RCTComponentViewProtocol.h>
#if USE_HERMES
#import <ReactCommon/RCTHermesInstance.h>
#else
#import <ReactCommon/RCTJscInstance.h>
#endif
#import <react/nativemodule/defaults/DefaultTurboModules.h>

using namespace facebook::react;

@implementation RCTAppDelegate

- (instancetype)init
{
  if (self = [super init]) {
    _automaticallyLoadReactNativeWindow = YES;
  }
  return self;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:self];

  if (self.automaticallyLoadReactNativeWindow) {
    [self loadReactNativeWindow:launchOptions];
  }

  return YES;
}

- (void)loadReactNativeWindow:(NSDictionary *)launchOptions
{
  UIView *rootView = [self.rootViewFactory viewWithModuleName:self.moduleName
                                            initialProperties:self.initialProps
                                                launchOptions:launchOptions];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [self createRootViewController];
  [self setRootView:rootView toRootViewController:rootViewController];
  _window.windowScene.delegate = self;
  _window.rootViewController = rootViewController;
  [_window makeKeyAndVisible];
}

#pragma mark - UISceneDelegate

- (void)windowScene:(UIWindowScene *)windowScene
    didUpdateCoordinateSpace:(id<UICoordinateSpace>)previousCoordinateSpace
        interfaceOrientation:(UIInterfaceOrientation)previousInterfaceOrientation
             traitCollection:(UITraitCollection *)previousTraitCollection API_AVAILABLE(ios(13.0))
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTWindowFrameDidChangeNotification object:self];
}

- (RCTRootViewFactory *)rootViewFactory
{
  return self.reactNativeFactory.rootViewFactory;
}

- (RCTBridge *)bridge
{
  return self.rootViewFactory.bridge;
}

- (RCTSurfacePresenterBridgeAdapter *)bridgeAdapter
{
  return self.rootViewFactory.bridgeAdapter;
}

- (void)setBridge:(RCTBridge *)bridge
{
  self.reactNativeFactory.rootViewFactory.bridge = bridge;
}

- (void)setBridgeAdapter:(RCTSurfacePresenterBridgeAdapter *)bridgeAdapter
{
  self.reactNativeFactory.rootViewFactory.bridgeAdapter = bridgeAdapter;
}

@end
