/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeDelegate.h>
#import <React/RCTConvert.h>
#import <UIKit/UIKit.h>
#import "RCTDefaultReactNativeFactoryDelegate.h"
#import "RCTReactNativeFactory.h"
#import "RCTRootViewFactory.h"

@class RCTBridge;
@protocol RCTBridgeDelegate;
@protocol RCTComponentViewProtocol;
@class RCTRootView;
@class RCTSurfacePresenterBridgeAdapter;
@protocol RCTDependencyProvider;

NS_ASSUME_NONNULL_BEGIN

/**
 * The RCTAppDelegate is an utility class that implements some base configurations for all the React Native apps.
 * It is not mandatory to use it, but it could simplify your AppDelegate code.
 *
 * To use it, you just need to make your AppDelegate a subclass of RCTAppDelegate:
 *
 * ```objc
 * #import <React/RCTAppDelegate.h>
 * @interface AppDelegate: RCTAppDelegate
 * @end
 * ```
 *
 * All the methods implemented by the RCTAppDelegate can be overridden by your AppDelegate if you need to provide a
 custom implementation.
 * If you need to customize the default implementation, you can invoke `[super <method_name>]` and use the returned
 object.
 *
 * Overridable methods
 * Shared:
 *   - (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary
 *)launchOptions;
 *   - (UIView *)createRootViewWithBridge:(RCTBridge *)bridge moduleName:(NSString*)moduleName initProps:(NSDictionary
 *)initProps;
 *   - (UIViewController *)createRootViewController;
 *   - (void)setRootView:(UIView *)rootView toRootViewController:(UIViewController *)rootViewController;
 * New Architecture:
 *   - (BOOL)turboModuleEnabled;
 *   - (BOOL)fabricEnabled;
 *   - (NSDictionary *)prepareInitialProps
 *   - (Class)getModuleClassFromName:(const char *)name
 *   - (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
 *   - (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const facebook::react::ObjCTurboModule::InitParams &)params
 *   - (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
 */
@interface RCTAppDelegate : RCTDefaultReactNativeFactoryDelegate <UIApplicationDelegate, UISceneDelegate>

/// The window object, used to render the UViewControllers
@property (nonatomic, strong, nonnull) UIWindow *window;

@property (nonatomic, nullable) RCTBridge *bridge;
@property (nonatomic, strong, nullable) NSString *moduleName;
@property (nonatomic, strong, nullable) NSDictionary *initialProps;
@property (nonatomic, strong) RCTReactNativeFactory *reactNativeFactory;

/// If `automaticallyLoadReactNativeWindow` is set to `true`, the React Native window will be loaded automatically.
@property (nonatomic, assign) BOOL automaticallyLoadReactNativeWindow;

@property (nonatomic, nullable) RCTSurfacePresenterBridgeAdapter *bridgeAdapter;

- (RCTRootViewFactory *)rootViewFactory;

@end

NS_ASSUME_NONNULL_END
