/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTBridgeDelegate.h"
#import "RCTBridgeModule.h"
#import "RCTDefines.h"
#import "RCTFrameUpdate.h"
#import "RCTInvalidating.h"
#import "RCTJavaScriptExecutor.h"

@class RCTBridge;
@class RCTEventDispatcher;

/**
 * This notification triggers a reload of all bridges currently running.
 */
RCT_EXTERN NSString *const RCTReloadNotification;

/**
 * This notification fires when the bridge starts loading.
 */
RCT_EXTERN NSString *const RCTJavaScriptWillStartLoadingNotification;

/**
 * This notification fires when the bridge has finished loading.
 */
RCT_EXTERN NSString *const RCTJavaScriptDidLoadNotification;

/**
 * This notification fires when the bridge failed to load.
 */
RCT_EXTERN NSString *const RCTJavaScriptDidFailToLoadNotification;

/**
 * This notification fires when the bridge created all registered native modules
 */
RCT_EXTERN NSString *const RCTDidCreateNativeModules;

/**
 * This block can be used to instantiate modules that require additional
 * init parameters, or additional configuration prior to being used.
 * The bridge will call this block to instatiate the modules, and will
 * be responsible for invalidating/releasing them when the bridge is destroyed.
 * For this reason, the block should always return new module instances, and
 * module instances should not be shared between bridges.
 */
typedef NSArray<id<RCTBridgeModule>> *(^RCTBridgeModuleProviderBlock)(void);

/**
 * This function returns the module name for a given class.
 */
RCT_EXTERN NSString *RCTBridgeModuleNameForClass(Class bridgeModuleClass);

/**
 * Async batched bridge used to communicate with the JavaScript application.
 */
@interface RCTBridge : NSObject <RCTInvalidating>

/**
 * Creates a new bridge with a custom RCTBridgeDelegate.
 *
 * All the interaction with the JavaScript context should be done using the bridge
 * instance of the RCTBridgeModules. Modules will be automatically instantiated
 * using the default contructor, but you can optionally pass in an array of
 * pre-initialized module instances if they require additional init parameters
 * or configuration.
 */
- (instancetype)initWithDelegate:(id<RCTBridgeDelegate>)delegate
                   launchOptions:(NSDictionary *)launchOptions NS_DESIGNATED_INITIALIZER;

/**
 * DEPRECATED: Use initWithDelegate:launchOptions: instead
 *
 * The designated initializer. This creates a new bridge on top of the specified
 * executor. The bridge should then be used for all subsequent communication
 * with the JavaScript code running in the executor. Modules will be automatically
 * instantiated using the default contructor, but you can optionally pass in an
 * array of pre-initialized module instances if they require additional init
 * parameters or configuration.
 */
- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                   moduleProvider:(RCTBridgeModuleProviderBlock)block
                    launchOptions:(NSDictionary *)launchOptions NS_DESIGNATED_INITIALIZER;

/**
 * This method is used to call functions in the JavaScript application context.
 * It is primarily intended for use by modules that require two-way communication
 * with the JavaScript code. Safe to call from any thread.
 */
- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args;

/**
 * DEPRECATED: Do not use.
 */
#define RCT_IMPORT_METHOD(module, method) \
  _Pragma("message(\"This macro is no longer required\")")

/**
 * URL of the script that was loaded into the bridge.
 */
@property (nonatomic, strong) NSURL *bundleURL;

/**
 * The class of the executor currently being used *or* to be used after the next
 * reload.
 */
@property (nonatomic, strong) Class executorClass;

/**
 * The delegate provided during the bridge initialization
 */
@property (nonatomic, weak, readonly) id<RCTBridgeDelegate> delegate;

/**
 * The event dispatcher is a wrapper around -enqueueJSCall:args: that provides a
 * higher-level interface for sending UI events such as touches and text input.
 *
 * NOTE: RCTEventDispatcher is now a bridge module, this is implemented as a
 * category but remains declared in the bridge to avoid breaking changes
 *
 * To be moved.
 */
@property (nonatomic, readonly) RCTEventDispatcher *eventDispatcher;

/**
 * A dictionary of all registered RCTBridgeModule instances, keyed by moduleName.
 */
@property (nonatomic, copy, readonly) NSDictionary *modules;

/**
 * The launch options that were used to initialize the bridge.
 */
@property (nonatomic, copy, readonly) NSDictionary *launchOptions;

/**
 * Use this to check if the bridge is currently loading.
 */
@property (nonatomic, readonly, getter=isLoading) BOOL loading;

/**
 * Use this to check if the bridge has been invalidated.
 */
@property (nonatomic, readonly, getter=isValid) BOOL valid;

/**
 * The block passed in the constructor with pre-initialized modules
 */
@property (nonatomic, copy, readonly) RCTBridgeModuleProviderBlock moduleProvider;

/**
 * Reload the bundle and reset executor & modules. Safe to call from any thread.
 */
- (void)reload;

@end
