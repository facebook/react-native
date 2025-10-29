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
#import "RCTDependencyProvider.h"
#import "RCTJSRuntimeConfiguratorProtocol.h"
#import "RCTRootViewFactory.h"
#import "RCTUIConfiguratorProtocol.h"

#if defined(__cplusplus) // Don't conform to protocols requiring C++ when it's not defined.
#import <React/RCTComponentViewFactory.h>
#import <ReactCommon/RCTHost.h>
#import <ReactCommon/RCTTurboModuleManager.h>

#endif

@class RCTBridge;
@protocol RCTComponentViewProtocol;
@class RCTSurfacePresenterBridgeAdapter;
@class RCTDevMenuConfiguration;

NS_ASSUME_NONNULL_BEGIN

typedef NS_ENUM(NSInteger, RCTReleaseLevel) { Canary, Experimental, Stable };

@protocol RCTReactNativeFactoryDelegate <
    RCTBridgeDelegate,
    RCTUIConfiguratorProtocol,
#if defined(__cplusplus) // Don't conform to protocols requiring C++ when it's not defined.
    RCTHostDelegate,
    RCTTurboModuleManagerDelegate,
    RCTComponentViewFactoryComponentProvider,
#endif
    RCTJSRuntimeConfiguratorProtocol,
    RCTArchConfiguratorProtocol>

/// Return the bundle URL for the main bundle.
- (NSURL *__nullable)bundleURL;

@property (nonatomic, strong) id<RCTDependencyProvider> dependencyProvider;

@optional
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
- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate
                          launchOptions:(NSDictionary *)launchOptions
    __attribute__((deprecated(
        "createBridgeWithDelegate:launchOptions: is deprecated and will be removed when removing the legacy architecture.")));

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
                           initProps:(NSDictionary *)initProps
    __attribute__((deprecated(
        "createRootViewWithBridge:moduleName:initProps is deprecated and will be removed when removing the legacy architecture.")));

/// This method returns a map of Component Descriptors and Components classes that needs to be registered in the
/// new renderer. The Component Descriptor is a string which represent the name used in JS to refer to the native
/// component. The default implementation returns an empty dictionary. Subclasses can override this method to register
/// the required components.
///
/// @return a dictionary that associate a component for the new renderer with his descriptor.
- (NSDictionary<NSString *, Class<RCTComponentViewProtocol>> *)thirdPartyFabricComponents;

@end

@interface RCTReactNativeFactory : NSObject

- (instancetype)initWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate;

- (instancetype)initWithDelegate:(id<RCTReactNativeFactoryDelegate>)delegate releaseLevel:(RCTReleaseLevel)releaseLevel;

- (void)startReactNativeWithModuleName:(NSString *)moduleName inWindow:(UIWindow *_Nullable)window;

- (void)startReactNativeWithModuleName:(NSString *)moduleName
                              inWindow:(UIWindow *_Nullable)window
                         launchOptions:(NSDictionary *_Nullable)launchOptions;

- (void)startReactNativeWithModuleName:(NSString *)moduleName
                              inWindow:(UIWindow *_Nullable)window
                     initialProperties:(NSDictionary *_Nullable)initialProperties
                         launchOptions:(NSDictionary *_Nullable)launchOptions;

@property (nonatomic, nullable) RCTBridge *bridge
    __attribute__((deprecated("The bridge is deprecated and will be removed when removing the legacy architecture.")));
@property (nonatomic, strong, nonnull) RCTRootViewFactory *rootViewFactory;

@property (nonatomic, nullable) RCTSurfacePresenterBridgeAdapter *bridgeAdapter __attribute__((
    deprecated("The bridgeAdapter is deprecated and will be removed when removing the legacy architecture.")));
;

@property (nonatomic, weak) id<RCTReactNativeFactoryDelegate> delegate;

@property (nonatomic, nullable) RCTDevMenuConfiguration *devMenuConfiguration;

@end

NS_ASSUME_NONNULL_END
