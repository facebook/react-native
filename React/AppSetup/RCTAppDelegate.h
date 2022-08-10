/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#if RCT_NEW_ARCH_ENABLED
// When the new architecture is enabled, the RCTAppDelegate imports some additional headers
#import <React/RCTCxxBridgeDelegate.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#endif

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
 * All the methods implemented by the RCTAppDelegate can be overriden by your AppDelegate if you need to provide a
 custom implementation.
 * If you need to customize the default implementation, you can invoke `[super <method_name>]` and use the returned
 object.
 *
 * Overridable methods (New Architecture):
 *   - (Class)getModuleClassFromName:(const char *)name
 *   - (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
 *   - (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const facebook::react::ObjCTurboModule::InitParams &)params
 *   - (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass
 */
@interface RCTAppDelegate : UIResponder <UIApplicationDelegate>

/// The window object, used to render the UViewControllers
@property (nonatomic, strong) UIWindow *window;

@end

#if RCT_NEW_ARCH_ENABLED
/// Extension that makes the RCTAppDelegate conform to New Architecture delegates
@interface RCTAppDelegate () <RCTCxxBridgeDelegate, RCTTurboModuleManagerDelegate>

/// The TurboModule manager
@property (nonatomic, strong) RCTTurboModuleManager *turboModuleManager;

@end
#endif
