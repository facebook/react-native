/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTDefines.h>
#import <react/renderer/mapbuffer/MapBuffer.h>
#import <react/runtime/JSEngineInstance.h>
#import <react/runtime/ReactInstance.h>

#import "RCTContextContainerHandling.h"

NS_ASSUME_NONNULL_BEGIN

/**
 * A utility to enable diagnostics mode at runtime. Useful for test runs.
 * The flags are comma-separated string tokens, or an empty string when
 * nothing is enabled.
 */
RCT_EXTERN NSString *RCTInstanceRuntimeDiagnosticFlags(void);
RCT_EXTERN void RCTInstanceSetRuntimeDiagnosticFlags(NSString *_Nullable flags);

@class RCTBundleManager;
@class RCTInstance;
@class RCTJSThreadManager;
@class RCTModuleRegistry;
@class RCTPerformanceLogger;
@class RCTSource;
@class RCTSurfacePresenter;

@protocol RCTTurboModuleManagerDelegate;

@protocol RCTInstanceDelegate <RCTContextContainerHandling>

- (void)instance:(RCTInstance *)instance
    didReceiveJSErrorStack:(NSArray<NSDictionary<NSString *, id> *> *)stack
                   message:(NSString *)message
               exceptionId:(NSUInteger)exceptionId
                   isFatal:(BOOL)isFatal;

- (void)instance:(RCTInstance *)instance didInitializeRuntime:(facebook::jsi::Runtime &)runtime;

@end

/**
 * This is a private protocol used to configure internal behavior of the runtime.
 * DO NOT USE THIS OUTSIDE OF THE REACT NATIVE CODEBASE.
 */
@protocol RCTInstanceDelegateInternal <NSObject>

// TODO(T166383606): Remove this method when we remove the legacy runtime scheduler or we have access to
// ReactNativeConfig before we initialize it.
- (BOOL)useModernRuntimeScheduler:(RCTInstance *)instance;

@end

typedef void (^_Null_unspecified RCTInstanceInitialBundleLoadCompletionBlock)();

/**
 * RCTInstance owns and manages most of the pieces of infrastructure required to display a screen powered by React
 * Native. RCTInstance should never be instantiated in product code, but rather accessed through RCTHost. The host
 * ensures that any access to the instance is safe, and manages instance lifecycle.
 */
@interface RCTInstance : NSObject

- (instancetype)initWithDelegate:(id<RCTInstanceDelegate>)delegate
                jsEngineInstance:(std::shared_ptr<facebook::react::JSEngineInstance>)jsEngineInstance
                   bundleManager:(RCTBundleManager *)bundleManager
      turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
             onInitialBundleLoad:(RCTInstanceInitialBundleLoadCompletionBlock)onInitialBundleLoad
                  moduleRegistry:(RCTModuleRegistry *)moduleRegistry;

- (void)callFunctionOnJSModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args;

- (void)registerSegmentWithId:(NSNumber *)segmentId path:(NSString *)path;

- (void)invalidate;

@property (nonatomic, readonly, strong) RCTSurfacePresenter *surfacePresenter;

@end

NS_ASSUME_NONNULL_END
