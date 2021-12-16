/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>

#if RCT_TM_FABRIC_ENABLED

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

#import <ReactCommon/RCTTurboModuleManager.h>
#endif

@interface RCTAppSetupUtils : NSObject
+ (void)prepareApp:(UIApplication *_Nonnull)application;
+ (UIView *_Nonnull)defaultRootViewWithBridge:(RCTBridge *_Nonnull)bridge
                                   moduleName:(NSString *_Nonnull)moduleName
                            initialProperties:(nullable NSDictionary *)initialProperties;

#if RCT_TM_FABRIC_ENABLED
+ (id<RCTTurboModule> _Nonnull)defaultModuleInstanceFromClass:(Class _Nonnull)moduleClass;
+ (std::unique_ptr<facebook::react::JSExecutorFactory>)
    defaultJsExecutorFactoryForBridge:(RCTBridge *_Nonnull)bridge
               withTurboModuleManager:(RCTTurboModuleManager *_Nonnull)turboModuleManager;
#endif
@end
