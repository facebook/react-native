/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@class RCTBridge;
@protocol RCTBridgeDelegate;
@protocol RCTComponentViewProtocol;
@class RCTSurfacePresenterBridgeAdapter;

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
 *   - (BOOL)concurrentRootEnabled
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
@interface RCTAppDelegate : UIResponder <UIApplicationDelegate, UISceneDelegate, RCTBridgeDelegate>

/// The window object, used to render the UViewControllers
@property (nonatomic, strong) UIWindow *window;
@property (nonatomic, strong) RCTBridge *bridge;
@property (nonatomic, strong) NSString *moduleName;
@property (nonatomic, strong) NSDictionary *initialProps;

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

/**
 * It creates the RootViewController.
 * By default, it creates a new instance of a `UIViewController`.
 * You can override it to provide your own initial ViewController.
 *
 * @return: an instance of `UIViewController`.
 */
- (UIViewController *)createRootViewController;

/**
 * It assigns the rootView to the rootViewController
 * By default, it assigns the rootView to the view property of the rootViewController
 * If you are not using a simple UIViewController, then there could be other methods to use to setup the rootView.
 * For example: UISplitViewController requires `setViewController(_:for:)`
 */
- (void)setRootView:(UIView *)rootView toRootViewController:(UIViewController *)rootViewController;

/// This method controls whether the App will use RuntimeScheduler. Only applicable in the legacy architecture.
///
/// @return: `YES` to use RuntimeScheduler, `NO` to use JavaScript scheduler. The default value is `YES`.
- (BOOL)runtimeSchedulerEnabled;

#if RCT_NEW_ARCH_ENABLED
@property (nonatomic, strong) RCTSurfacePresenterBridgeAdapter *bridgeAdapter;

/// This method returns a map of Component Descriptors and Components classes that needs to be registered in the
/// new renderer. The Component Descriptor is a string which represent the name used in JS to refer to the native
/// component. The default implementation returns an empty dictionary. Subclasses can override this method to register
/// the required components.
///
/// @return a dictionary that associate a component for the new renderer with his descriptor.
- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents;

/// This method controls whether the `turboModules` feature of the New Architecture is turned on or off.
///
/// @note: This is required to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the Turbo Native Module are enabled. Otherwise, it returns `false`.
- (BOOL)turboModuleEnabled;

/// This method controls whether the App will use the Fabric renderer of the New Architecture or not.
///
/// @return: `true` if the Fabric Renderer is enabled. Otherwise, it returns `false`.
- (BOOL)fabricEnabled;

/// This method controls whether React Native's new initialization layer is enabled.
///
/// @return: `true` if the new initialization layer is enabled. Otherwise returns `false`.
- (BOOL)bridgelessEnabled;

/// Return the bundle URL for the main bundle.
- (NSURL *)getBundleURL;

#endif

@end
