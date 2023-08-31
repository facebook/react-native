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

#ifndef RCT_USE_HERMES
#if __has_include(<reacthermes/HermesExecutorFactory.h>)
#define RCT_USE_HERMES 1
#else
#define RCT_USE_HERMES 0
#endif
#endif

#if RCT_USE_HERMES
#import <reacthermes/HermesExecutorFactory.h>
#else
#import <React/JSCExecutorFactory.h>
#endif

#if RCT_NEW_ARCH_ENABLED
#import <ReactCommon/RCTTurboModuleManager.h>
#endif

// Forward declaration to decrease compilation coupling
namespace facebook::react {
class RuntimeScheduler;
}

#if RCT_NEW_ARCH_ENABLED

RCT_EXTERN id<RCTTurboModule> RCTAppSetupDefaultModuleFromClass(Class moduleClass);

std::unique_ptr<facebook::react::JSExecutorFactory> RCTAppSetupDefaultJsExecutorFactory(
    RCTBridge *bridge,
    RCTTurboModuleManager *turboModuleManager,
    const std::shared_ptr<facebook::react::RuntimeScheduler> &runtimeScheduler);
#else
std::unique_ptr<facebook::react::JSExecutorFactory> RCTAppSetupJsExecutorFactoryForOldArch(
    RCTBridge *bridge,
    const std::shared_ptr<facebook::react::RuntimeScheduler> &runtimeScheduler);
#endif

#endif // __cplusplus

RCT_EXTERN_C_BEGIN

void RCTAppSetupPrepareApp(UIApplication *application, BOOL turboModuleEnabled);
UIView *RCTAppSetupDefaultRootView(
    RCTBridge *bridge,
    NSString *moduleName,
    NSDictionary *initialProperties,
    BOOL fabricEnabled);

RCT_EXTERN_C_END
