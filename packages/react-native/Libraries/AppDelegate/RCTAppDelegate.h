/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridgeDelegate.h>
#import <React/RCTConvert.h>
#import <UIKit/UIKit.h>
#import "RCTArchConfiguratorProtocol.h"
#import "RCTRootViewFactory.h"
#import "RCTUIConfiguratorProtocol.h"

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
@interface RCTAppDelegate : UIResponder <
                                UIApplicationDelegate,
                                UISceneDelegate,
                                RCTBridgeDelegate,
                                RCTUIConfiguratorProtocol,
                                RCTArchConfiguratorProtocol>

/// The window object, used to render the UViewControllers
@property (nonatomic, strong, nonnull) UIWindow *window;
@property (nonatomic, nullable) RCTBridge *bridge;
@property (nonatomic, strong, nullable) NSString *moduleName;
@property (nonatomic, strong, nullable) NSDictionary *initialProps;
@property (nonatomic, strong, nonnull) RCTRootViewFactory *rootViewFactory;
@property (nonatomic, strong) id<RCTDependencyProvider> dependencyProvider;

/// If `automaticallyLoadReactNativeWindow` is set to `true`, the React Native window will be loaded automatically.
@property (nonatomic, assign) BOOL automaticallyLoadReactNativeWindow;

@property (nonatomic, nullable) RCTSurfacePresenterBridgeAdapter *bridgeAdapter;

/**
 * It creates a `RCTBridge` using a delegate and some launch options.
 * By default, it is invoked passing `self` as a delegate.
 * You can override this function to customize the logic that creates the RCTBridge
 *
 * @parameter: delegate - an object that implements the `RCTBridgeDelegate` protocol.
 * @parameter: launchOptions - a dictionary with a set of options.
 *
 * @returns: a newly created instance of RCTBridge.
 */
- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions;

/**
 * It creates a `UIView` starting from a bridge, a module name and a set of initial properties.
 * By default, it is invoked using the bridge created by `createBridgeWithDelegate:launchOptions` and
 * the name in the `self.moduleName` variable.
 * You can override this function to customize the logic that creates the Root View.
 *
 * @parameter: bridge - an instance of the `RCTBridge` object.
 * @parameter: moduleName - the name of the app, used by Metro to resolve the module.
 * @parameter: initProps - a set of initial properties.
 *
 * @returns: a UIView properly configured with a bridge for React Native.
 */
- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps;

/// This method returns a map of Component Descriptors and Components classes that needs to be registered in the
/// new renderer. The Component Descriptor is a string which represent the name used in JS to refer to the native
/// component. The default implementation returns an empty dictionary. Subclasses can override this method to register
/// the required components.
///
/// @return a dictionary that associate a component for the new renderer with his descriptor.
- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents;

/// Return the bundle URL for the main bundle.
- (NSURL *__nullable)bundleURL;

@end

NS_ASSUME_NONNULL_END
