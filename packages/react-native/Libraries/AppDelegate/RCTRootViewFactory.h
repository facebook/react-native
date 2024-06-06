/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTRootView.h>
#import <React/RCTUtils.h>

@protocol RCTCxxBridgeDelegate;
@protocol RCTComponentViewFactoryComponentProvider;
@protocol RCTTurboModuleManagerDelegate;
@class RCTBridge;
@class RCTRootView;
@class RCTSurfacePresenterBridgeAdapter;

NS_ASSUME_NONNULL_BEGIN

#pragma mark - Blocks' definitions
typedef UIView *_Nonnull (
    ^RCTCreateRootViewWithBridgeBlock)(RCTBridge *bridge, NSString *moduleName, NSDictionary *initProps);
typedef RCTBridge *_Nonnull (
    ^RCTCreateBridgeWithDelegateBlock)(id<RCTBridgeDelegate> delegate, NSDictionary *launchOptions);
typedef void (^RCTCustomizeRootViewBlock)(UIView *rootView);
typedef NSURL *_Nullable (^RCTSourceURLForBridgeBlock)(RCTBridge *bridge);
typedef NSURL *_Nullable (^RCTBundleURLBlock)(void);
typedef NSArray<id<RCTBridgeModule>> *_Nonnull (^RCTExtraModulesForBridgeBlock)(RCTBridge *bridge);
typedef NSDictionary<NSString *, Class> *_Nonnull (^RCTExtraLazyModuleClassesForBridge)(RCTBridge *bridge);
typedef BOOL (^RCTBridgeDidNotFindModuleBlock)(RCTBridge *bridge, NSString *moduleName);

#pragma mark - RCTRootViewFactory Configuration
@interface RCTRootViewFactoryConfiguration : NSObject

/// This property controls whether the App will use the Fabric renderer of the New Architecture or not.
@property (nonatomic, assign, readonly) BOOL fabricEnabled;

/// This property controls whether React Native's new initialization layer is enabled.
@property (nonatomic, assign, readonly) BOOL bridgelessEnabled;

/// This method controls whether the `turboModules` feature of the New Architecture is turned on or off
@property (nonatomic, assign, readonly) BOOL turboModuleEnabled;

/// Return the bundle URL for the main bundle.
@property (nonatomic, nonnull) RCTBundleURLBlock bundleURLBlock;

/**
 * Use this method to initialize a new instance of `RCTRootViewFactoryConfiguration` by passing a `bundleURL`
 *
 * Which is the location of the JavaScript source file. When running from the packager
 * this should be an absolute URL, e.g. `http://localhost:8081/index.ios.bundle`.
 * When running from a locally bundled JS file, this should be a `file://` url
 * pointing to a path inside the app resources, e.g. `file://.../main.jsbundle`.
 *
 */
- (instancetype)initWithBundleURLBlock:(RCTBundleURLBlock)bundleURLBlock
                        newArchEnabled:(BOOL)newArchEnabled
                    turboModuleEnabled:(BOOL)turboModuleEnabled
                     bridgelessEnabled:(BOOL)bridgelessEnabled NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   newArchEnabled:(BOOL)newArchEnabled
               turboModuleEnabled:(BOOL)turboModuleEnabled
                bridgelessEnabled:(BOOL)bridgelessEnabled __deprecated;

/**
 * Block that allows to override logic of creating root view instance.
 * It creates a `UIView` starting from a bridge, a module name and a set of initial properties.
 * By default, it is invoked using the bridge created by `RCTCreateBridgeWithDelegateBlock` (or the default
 * implementation) and the `moduleName` variable comes from `viewWithModuleName:initialProperties:launchOptions` of
 * `RCTRootViewFactory`.
 *
 * @parameter: bridge - an instance of the `RCTBridge` object.
 * @parameter: moduleName - the name of the app, used by Metro to resolve the module.
 * @parameter: initProps - a set of initial properties.
 *
 * @returns: a UIView properly configured with a bridge for React Native.
 */
@property (nonatomic, nullable) RCTCreateRootViewWithBridgeBlock createRootViewWithBridge;

/**
 * Block that allows to override default behavior of creating bridge.
 * It should return `RCTBridge` using a delegate and some launch options.
 *
 * By default, it is invoked passing `self` as a delegate.
 *
 * @parameter: delegate - an object that implements the `RCTBridgeDelegate` protocol.
 * @parameter: launchOptions - a dictionary with a set of options.
 *
 * @returns: a newly created instance of RCTBridge.
 */
@property (nonatomic, nullable) RCTCreateBridgeWithDelegateBlock createBridgeWithDelegate;

/**
 * Block that allows to customize the rootView that is passed to React Native.
 *
 * @parameter: rootView - The root view to customize.
 */
@property (nonatomic, nullable) RCTCustomizeRootViewBlock customizeRootView;

@end

#pragma mark - RCTRootViewFactory
/**
 * The RCTRootViewFactory is an utility class that encapsulates the logic of creating a new RCTRootView based on the
 * current state of the environment. It allows you to initialize your app root view for old architecture, new
 * architecture and bridgless mode.
 *
 * This class is used to initalize rootView in RCTAppDelegate, but you can also use it separately.
 *
 * Create a new instance of this class (make sure to retain it) and call the
 * `viewWithModuleName:initialProperties:launchOptions` method to create new RCTRootView.
 */
@interface RCTRootViewFactory : NSObject

@property (nonatomic, strong, nullable) RCTBridge *bridge;
@property (nonatomic, strong, nullable) RCTSurfacePresenterBridgeAdapter *bridgeAdapter;

- (instancetype)initWithConfiguration:(RCTRootViewFactoryConfiguration *)configuration
        andTurboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate;

/**
 * This method can be used to create new RCTRootViews on demand.
 *
 * @parameter: moduleName  - the name of the app, used by Metro to resolve the module.
 * @parameter: initialProperties  -  a set of initial properties.
 * @parameter: launchOptions  - a dictionary with a set of options.
 */
- (UIView *_Nonnull)viewWithModuleName:(NSString *)moduleName
                     initialProperties:(NSDictionary *__nullable)initialProperties
                         launchOptions:(NSDictionary *__nullable)launchOptions;

- (UIView *_Nonnull)viewWithModuleName:(NSString *)moduleName
                     initialProperties:(NSDictionary *__nullable)initialProperties;

- (UIView *_Nonnull)viewWithModuleName:(NSString *)moduleName;

@end

NS_ASSUME_NONNULL_END
