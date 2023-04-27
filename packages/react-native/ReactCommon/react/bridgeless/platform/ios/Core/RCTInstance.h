/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <PikaOptimizationsMacros/PikaOptimizationsMacros.h>
#import <React/RCTDefines.h>
#import <react/bridgeless/JSEngineInstance.h>
#import <react/bridgeless/ReactInstance.h>
#import <react/utils/ContextContainer.h>

/**
 * A utility to enable diagnostics mode at runtime. Useful for test runs.
 * The flags are comma-separated string tokens, or an empty string when
 * nothing is enabled.
 */
RCT_EXTERN NSString *RCTInstanceRuntimeDiagnosticFlags(void);
RCT_EXTERN void RCTInstanceSetRuntimeDiagnosticFlags(NSString *flags);

NS_ASSUME_NONNULL_BEGIN

@class RCTBundleManager;
@class RCTJSThreadManager;
@class RCTModuleRegistry;
@class RCTPerformanceLogger;
@class RCTSource;
@class RCTSurfacePresenter;

FB_RUNTIME_PROTOCOL
@protocol RCTTurboModuleManagerDelegate;

// TODO (T74233481) - Delete this. Communication between Product Code <> RCTInstance should go through RCTHost.
@protocol RCTInstanceDelegate <NSObject>

@required

- (std::shared_ptr<facebook::react::ContextContainer>)createContextContainer;

@end

/**
 * A set of functions which are forwarded through RCTHost, RCTInstance to ReactInstance.
 */
@protocol ReactInstanceForwarding

/**
 * Calls a method on a JS module that has been registered with `registerCallableModule`. Used to invoke a JS function
 * from platform code.
 */
- (void)callFunctionOnModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args;

/**
 * Loads the JS bundle asynchronously.
 */
- (void)loadScript:(RCTSource *)source;

/**
 * Registers a new JS segment.
 */
- (void)registerSegmentWithId:(NSNumber *)segmentId path:(NSString *)path;

@end

typedef void (^_Null_unspecified RCTInstanceInitialBundleLoadCompletionBlock)();

/**
 * RCTInstance owns and manages most of the pieces of infrastructure required to display a screen powered by React
 * Native. RCTInstance should never be instantiated in product code, but rather accessed through RCTHost. The host
 * ensures that any access to the instance is safe, and manages instance lifecycle.
 */
@interface RCTInstance : NSObject <ReactInstanceForwarding>

- (instancetype)initWithDelegate:(id<RCTInstanceDelegate>)delegate
                jsEngineInstance:(std::shared_ptr<facebook::react::JSEngineInstance>)jsEngineInstance
                   bundleManager:(RCTBundleManager *)bundleManager
      turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
             onInitialBundleLoad:(RCTInstanceInitialBundleLoadCompletionBlock)onInitialBundleLoad
             bindingsInstallFunc:(facebook::react::ReactInstance::BindingsInstallFunc)bindingsInstallFunc
                  moduleRegistry:(RCTModuleRegistry *)moduleRegistry
             jsErrorHandlingFunc:(facebook::react::JsErrorHandler::JsErrorHandlingFunc)jsErrorHandlingFunc
    FB_OBJC_DIRECT;

- (void)invalidate;

@property (nonatomic, readonly, strong, FB_DIRECT) RCTJSThreadManager *jsThreadManager;

@property (nonatomic, readonly, strong) RCTPerformanceLogger *performanceLogger;

@property (nonatomic, readonly, strong) RCTSurfacePresenter *surfacePresenter;

@end

NS_ASSUME_NONNULL_END
