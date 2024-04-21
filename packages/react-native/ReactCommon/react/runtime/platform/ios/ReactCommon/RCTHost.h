/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTDefines.h>
#import <react/renderer/core/ReactPrimitives.h>
#import <react/runtime/JSRuntimeFactory.h>

#import "RCTInstance.h"

NS_ASSUME_NONNULL_BEGIN

@class RCTFabricSurface;
@class RCTHost;
@class RCTModuleRegistry;

@protocol RCTTurboModuleManagerDelegate;

typedef NSURL *_Nullable (^RCTHostBundleURLProvider)(void);

// Runtime API

@protocol RCTHostDelegate <NSObject>

- (void)host:(RCTHost *)host
    didReceiveJSErrorStack:(NSArray<NSDictionary<NSString *, id> *> *)stack
                   message:(NSString *)message
               exceptionId:(NSUInteger)exceptionId
                   isFatal:(BOOL)isFatal;

- (void)hostDidStart:(RCTHost *)host;

@end

@protocol RCTHostRuntimeDelegate <NSObject>

- (void)host:(RCTHost *)host didInitializeRuntime:(facebook::jsi::Runtime &)runtime;

@end

typedef std::shared_ptr<facebook::react::JSRuntimeFactory> (^RCTHostJSEngineProvider)(void);

@interface RCTHost : NSObject

- (instancetype)initWithBundleURLProvider:(RCTHostBundleURLProvider)provider
                             hostDelegate:(id<RCTHostDelegate>)hostDelegate
               turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                         jsEngineProvider:(RCTHostJSEngineProvider)jsEngineProvider
                            launchOptions:(nullable NSDictionary *)launchOptions NS_DESIGNATED_INITIALIZER;

- (instancetype)initWithBundleURL:(NSURL *)bundleURL
                     hostDelegate:(id<RCTHostDelegate>)hostDelegate
       turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                 jsEngineProvider:(RCTHostJSEngineProvider)jsEngineProvider
                    launchOptions:(nullable NSDictionary *)launchOptions __deprecated;

@property (nonatomic, weak, nullable) id<RCTHostRuntimeDelegate> runtimeDelegate;

@property (nonatomic, readonly) RCTSurfacePresenter *surfacePresenter;

@property (nonatomic, readonly) RCTModuleRegistry *moduleRegistry;

- (void)start;

- (void)callFunctionOnJSModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args;

// Renderer API

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName
                                             mode:(facebook::react::DisplayMode)displayMode
                                initialProperties:(NSDictionary *)properties;

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName initialProperties:(NSDictionary *)properties;

- (RCTSurfacePresenter *)getSurfacePresenter __attribute__((deprecated("Use `surfacePresenter` property instead.")));

// Native module API

- (RCTModuleRegistry *)getModuleRegistry __attribute__((deprecated("Use `moduleRegistry` property instead.")));

@end

NS_ASSUME_NONNULL_END
