/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTBridgeModule.h"
#import "RCTInvalidating.h"
#import "RCTJavaScriptExecutor.h"

@class RCTBridge;
@class RCTEventDispatcher;

/**
 * This block can be used to instantiate modules that require additional
 * init parameters, or additional configuration prior to being used.
 * The bridge will call this block to instatiate the modules, and will
 * be responsible for invalidating/releasing them when the bridge is destroyed.
 * For this reason, the block should always return new module instances, and
 * module instances should not be shared between bridges.
 */
typedef NSArray *(^RCTBridgeModuleProviderBlock)(void);

/**
 * Async batched bridge used to communicate with the JavaScript application.
 */
@interface RCTBridge : NSObject <RCTInvalidating>

/**
 * The designated initializer. This creates a new bridge on top of the specified
 * executor. The bridge should then be used for all subsequent communication
 * with the JavaScript code running in the executor. Modules will be automatically
 * instantiated using the default contructor, but you can optionally pass in an
 * array of pre-initialized module instances if they require additional init
 * parameters or configuration.
 */
- (instancetype)initWithBundlePath:(NSString *)bundlepath
                    moduleProvider:(RCTBridgeModuleProviderBlock)block
                     launchOptions:(NSDictionary *)launchOptions NS_DESIGNATED_INITIALIZER;

/**
 * This method is used to call functions in the JavaScript application context.
 * It is primarily intended for use by modules that require two-way communication
 * with the JavaScript code.
 */
- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args;

/**
 * This method is used to execute a new application script. It is called
 * internally whenever a JS application bundle is loaded/reloaded, but should
 * probably not be used at any other time.
 */
- (void)enqueueApplicationScript:(NSString *)script url:(NSURL *)url onComplete:(RCTJavaScriptCompleteBlock)onComplete;

/**
 * The event dispatcher is a wrapper around -enqueueJSCall:args: that provides a
 * higher-level interface for sending UI events such as touches and text input.
 */
@property (nonatomic, readonly) RCTEventDispatcher *eventDispatcher;

/**
 * A dictionary of all registered RCTBridgeModule instances, keyed by moduleName.
 */
@property (nonatomic, copy, readonly) NSDictionary *modules;

/**
 * The shadow queue is used to execute callbacks from the JavaScript code. All
 * native hooks (e.g. exported module methods) will be executed on the shadow
 * queue.
 */
@property (nonatomic, readonly) dispatch_queue_t shadowQueue;

/**
 * Global logging function that will print to both xcode and JS debugger consoles.
 *
 * NOTE: Use via RCTLog* macros defined in RCTLog.h
 * TODO (#5906496): should log function be exposed here, or could it be a module?
 */
+ (void)log:(NSArray *)objects level:(NSString *)level;

@property (nonatomic, copy, readonly) NSDictionary *launchOptions;


/**
 * Method to check that a valid executor exists with which to log
 */
+ (BOOL)hasValidJSExecutor;

@end
