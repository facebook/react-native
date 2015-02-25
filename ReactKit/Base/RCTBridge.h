// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTBridgeModule.h"
#import "RCTInvalidating.h"
#import "RCTJavaScriptExecutor.h"

@class RCTEventDispatcher;
@class RCTRootView;

/**
 * Utilities for constructing common response objects. When sending a
 * systemError back to JS, it's important to describe whether or not it was a
 * system error, or API usage error. System errors should never happen and are
 * therefore logged using `RCTLogError()`. API usage errors are expected if the
 * API is misused and will therefore not be logged using `RCTLogError()`. The JS
 * application code is expected to handle them. Regardless of type, each error
 * should be logged at most once.
 */
static inline NSDictionary *RCTSystemErrorObject(NSString *msg)
{
  return @{@"systemError": msg ?: @""};
}

static inline NSDictionary *RCTAPIErrorObject(NSString *msg)
{
  return @{@"apiError": msg ?: @""};
}

/**
 * Async batched bridge used to communicate with the JavaScript application.
 */
@interface RCTBridge : NSObject <RCTInvalidating>

/**
 * The designated initializer. This creates a new bridge on top of the specified
 * executor. The bridge should then be used for all subsequent communication
 * with the JavaScript code running in the executor. You can optionally pass in
 * a list of module instances to be used instead of the auto-instantiated versions.
 */
- (instancetype)initWithJavaScriptExecutor:(id<RCTJavaScriptExecutor>)javaScriptExecutor
                           moduleInstances:(NSArray *)moduleInstances NS_DESIGNATED_INITIALIZER;

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
 * The shadow queue is used to execute callbacks from the JavaScript code. All
 * native hooks (e.g. exported module methods) will be executed on the shadow
 * queue.
 */
@property (nonatomic, readonly) dispatch_queue_t shadowQueue;

// For use in implementing delegates, which may need to queue responses.
- (RCTResponseSenderBlock)createResponseSenderBlock:(NSInteger)callbackID;

/**
 * Register a root view with the bridge. Theorectically, a single bridge can
 * support multiple root views, however this feature is not currently exposed
 * and may eventually be removed.
 */
- (void)registerRootView:(RCTRootView *)rootView;

/**
 * Global logging function that will print to both xcode and JS debugger consoles.
 *
 * NOTE: Use via RCTLog* macros defined in RCTLog.h
 * TODO (#5906496): should log function be exposed here, or could it be a module?
 */
+ (void)log:(NSArray *)objects level:(NSString *)level;

/**
 * Method to check that a valid executor exists with which to log
 */
+ (BOOL)hasValidJSExecutor;

@end
