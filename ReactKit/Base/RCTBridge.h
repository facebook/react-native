// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTExport.h"
#import "RCTInvalidating.h"
#import "RCTJavaScriptExecutor.h"

@protocol RCTNativeModule;

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
 * Async batched bridge used to communicate with `RCTJavaScriptAppEngine`.
 */
@interface RCTBridge : NSObject <RCTInvalidating>

- (instancetype)initWithJavaScriptExecutor:(id<RCTJavaScriptExecutor>)javaScriptExecutor;

- (void)enqueueJSCall:(NSString *)moduleDotMethod args:(NSArray *)args;
- (void)enqueueApplicationScript:(NSString *)script url:(NSURL *)url onComplete:(RCTJavaScriptCompleteBlock)onComplete;

@property (nonatomic, readonly) RCTEventDispatcher *eventDispatcher;
@property (nonatomic, readonly) dispatch_queue_t shadowQueue;

// For use in implementing delegates, which may need to queue responses.
- (RCTResponseSenderBlock)createResponseSenderBlock:(NSInteger)callbackID;

- (void)registerRootView:(RCTRootView *)rootView;

/**
 * Global logging function will print to both xcode and js debugger consoles.
 *
 * NOTE: Use via RCTLog* macros defined in RCTLog.h
 * TODO (#5906496): should log function be exposed here, or could it be a module?
 */
+ (void)log:(NSArray *)objects level:(NSString *)level;

+ (BOOL)hasValidJSExecutor;

@end
