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

#if USE_THIRD_PARTY_JSC != 1
#import <reacthermes/HermesExecutorFactory.h>
#endif

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
    const std::shared_ptr<facebook::react::RuntimeScheduler> &runtimeScheduler)
    __attribute__((deprecated(
        "RCTAppSetupJsExecutorFactoryForOldArch(RCTBridge *, RuntimeScheduler) is deprecated and will be removed when we remove the legacy architecture.")));
;

#endif // __cplusplus

RCT_EXTERN_C_BEGIN

void RCTAppSetupPrepareApp(UIApplication *application, BOOL turboModuleEnabled) __attribute__((deprecated(
    "RCTAppSetupPrepareApp(UIApplication, BOOL) is deprecated and it's signature will change when we remove the legacy arch")));
UIView *
RCTAppSetupDefaultRootView(RCTBridge *bridge, NSString *moduleName, NSDictionary *initialProperties, BOOL fabricEnabled)
    __attribute__((deprecated(
        "RCTAppSetupDefaultRootView(RCTBridge *, NSString *, NSDictionary *, BOOL) is deprecated and it's signature will change when we remove the legacy arch")));

RCT_EXTERN_C_END
