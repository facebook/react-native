/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTBridge.h>

@class RCTModuleData;
@protocol RCTJavaScriptExecutor;

RCT_EXTERN NSArray<Class> *RCTGetModuleClasses(void);

#if RCT_DEBUG
RCT_EXTERN void RCTVerifyAllModulesExported(NSArray *extraModules);
#endif

@interface RCTBridge ()

// Private designated initializer
- (instancetype)initWithDelegate:(id<RCTBridgeDelegate>)delegate
                       bundleURL:(NSURL *)bundleURL
                  moduleProvider:(RCTBridgeModuleProviderBlock)block
                   launchOptions:(NSDictionary *)launchOptions NS_DESIGNATED_INITIALIZER;

// Used for the profiler flow events between JS and native
@property (nonatomic, assign) int64_t flowID;
@property (nonatomic, assign) CFMutableDictionaryRef flowIDMap;
@property (nonatomic, strong) NSLock *flowIDMapLock;

+ (instancetype)currentBridge;
+ (void)setCurrentBridge:(RCTBridge *)bridge;

/**
 * Bridge setup code - creates an instance of RCTBachedBridge. Exposed for
 * test only
 */
- (void)setUp;

/**
 * This method is used to invoke a callback that was registered in the
 * JavaScript application context. Safe to call from any thread.
 */
- (void)enqueueCallback:(NSNumber *)cbID args:(NSArray *)args;

/**
 * This property is mostly used on the main thread, but may be touched from
 * a background thread if the RCTBridge happens to deallocate on a background
 * thread. Therefore, we want all writes to it to be seen atomically.
 */
@property (atomic, strong) RCTBridge *batchedBridge;

/**
 * The block that creates the modules' instances to be added to the bridge.
 * Exposed for the RCTBatchedBridge
 */
@property (nonatomic, copy, readonly) RCTBridgeModuleProviderBlock moduleProvider;

/**
 * Used by RCTDevMenu to override the `hot` param of the current bundleURL.
 */
@property (nonatomic, strong, readwrite) NSURL *bundleURL;

@end

@interface RCTBridge (RCTBatchedBridge)

/**
 * Access the underlying JavaScript executor. You can use this in unit tests to detect
 * when the executor has been invalidated, or when you want to schedule calls on the
 * JS VM outside of React Native. Use with care!
 */
@property (nonatomic, weak, readonly) id<RCTJavaScriptExecutor> javaScriptExecutor;

/**
 * Used by RCTModuleData
 */
@property (nonatomic, assign, readonly) BOOL moduleSetupComplete;

/**
 * Called on the child bridge to run the executor and start loading.
 */
- (void)start;

/**
 * Used by RCTModuleData to register the module for frame updates after it is
 * lazily initialized.
 */
- (void)registerModuleForFrameUpdates:(id<RCTBridgeModule>)module
                       withModuleData:(RCTModuleData *)moduleData;

/**
 * Dispatch work to a module's queue - this is also suports the fake RCTJSThread
 * queue. Exposed for the RCTProfiler
 */
- (void)dispatchBlock:(dispatch_block_t)block queue:(dispatch_queue_t)queue;

/**
 * Get the module data for a given module name. Used by UIManager to implement
 * the `dispatchViewManagerCommand` method.
 */
- (RCTModuleData *)moduleDataForName:(NSString *)moduleName;

/**
 * Systrace profiler toggling methods exposed for the RCTDevMenu
 */
- (void)startProfiling;
- (void)stopProfiling:(void (^)(NSData *))callback;

/**
 * Exposed for the RCTJSCExecutor for sending native methods called from
 * JavaScript in the middle of a batch.
 */
- (void)handleBuffer:(NSArray<NSArray *> *)buffer batchEnded:(BOOL)hasEnded;

/**
 * Synchronously call a specific native module's method and return the result
 */
- (id)callNativeModule:(NSUInteger)moduleID
                method:(NSUInteger)methodID
                params:(NSArray *)params;

/**
 * Exposed for the RCTJSCExecutor for lazily loading native modules
 */
- (NSArray *)configForModuleName:(NSString *)moduleName;

/**
 * Hook exposed for RCTLog to send logs to JavaScript when not running in JSC
 */
- (void)logMessage:(NSString *)message level:(NSString *)level;

/**
 * Allow super fast, one time, timers to skip the queue and be directly executed
 */
- (void)_immediatelyCallTimer:(NSNumber *)timer;

@end

@interface RCTBatchedBridge : RCTBridge <RCTInvalidating>

@property (nonatomic, weak, readonly) RCTBridge *parentBridge;
@property (nonatomic, weak, readonly) id<RCTJavaScriptExecutor> javaScriptExecutor;
@property (nonatomic, assign, readonly) BOOL moduleSetupComplete;

- (instancetype)initWithParentBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;
- (void)start;

@end
