/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>

#ifdef __cplusplus

#import <memory>

#if USE_HERMES
#if __has_include(<jsireact/HermesExecutorFactory.h>)
#import <jsireact/HermesExecutorFactory.h>
#elif __has_include(<reacthermes/HermesExecutorFactory.h>)
#import <reacthermes/HermesExecutorFactory.h>
#endif
#elif USE_THIRD_PARTY_JSC != 1
#import <React/JSCExecutorFactory.h>
#endif // USE_HERMES

#import <ReactCommon/RCTTurboModuleManager.h>
#import <jsireact/JSIExecutor.h>

@protocol RCTDependencyProvider;

// Forward declaration to decrease compilation coupling
namespace facebook::react {
class RuntimeScheduler;
}
RCT_EXTERN NSArray<NSString *> *RCTAppSetupUnstableModulesRequiringMainQueueSetup(
    id<RCTDependencyProvider> dependencyProvider);

RCT_EXTERN id<RCTTurboModule> RCTAppSetupDefaultModuleFromClass(
    Class moduleClass,
    id<RCTDependencyProvider> dependencyProvider);

std::unique_ptr<facebook::react::JSExecutorFactory> RCTAppSetupDefaultJsExecutorFactory(
    RCTBridge *bridge,
    RCTTurboModuleManager *turboModuleManager,
    const std::shared_ptr<facebook::react::RuntimeScheduler> &runtimeScheduler);

std::unique_ptr<facebook::react::JSExecutorFactory> RCTAppSetupJsExecutorFactoryForOldArch(
    RCTBridge *bridge,
    const std::shared_ptr<facebook::react::RuntimeScheduler> &runtimeScheduler);

#endif // __cplusplus

RCT_EXTERN_C_BEGIN

void RCTAppSetupPrepareApp(UIApplication *application, BOOL turboModuleEnabled);
UIView *RCTAppSetupDefaultRootView(
    RCTBridge *bridge,
    NSString *moduleName,
    NSDictionary *initialProperties,
    BOOL fabricEnabled);

RCT_EXTERN_C_END
