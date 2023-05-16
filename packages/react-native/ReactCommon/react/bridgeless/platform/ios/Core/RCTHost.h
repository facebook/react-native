/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <PikaOptimizationsMacros/PikaOptimizationsMacros.h>
#import <React/RCTDefines.h>
#import <react/bridgeless/JSEngineInstance.h>
#import <react/bridgeless/ReactInstance.h>
#import <react/renderer/core/ReactPrimitives.h>

#import "RCTInstance.h"

NS_ASSUME_NONNULL_BEGIN

@class RCTFabricSurface;
@class RCTHost;
@class RCTJSThreadManager;
@class RCTModuleRegistry;
@protocol RCTInstanceDelegate;
FB_RUNTIME_PROTOCOL
@protocol RCTTurboModuleManagerDelegate;

typedef std::shared_ptr<facebook::react::JSEngineInstance> (^RCTHostJSEngineProvider)(void);

@protocol RCTHostDelegate <NSObject>

- (NSURL *)getBundleURL;
- (std::shared_ptr<facebook::react::ContextContainer>)createContextContainer;

- (void)host:(RCTHost *)host
    didReceiveJSErrorStack:(NSArray<NSDictionary<NSString *, id> *> *)stack
                   message:(NSString *)message
               exceptionId:(NSUInteger)exceptionId
                   isFatal:(BOOL)isFatal;
- (void)hostDidStart:(RCTHost *)host;

@end

/**
 * RCTHost is an object which is responsible for managing the lifecycle of a single RCTInstance.
 * RCTHost is long lived, while an instance may be deallocated and re-initialized. Some examples of when this happens:
 * CMD+R reload in DEV or a JS crash. The host should be the single owner of an RCTInstance.
 */
@interface RCTHost : NSObject

- (instancetype)initWithHostDelegate:(id<RCTHostDelegate>)hostDelegate
          turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                 bindingsInstallFunc:(facebook::react::ReactInstance::BindingsInstallFunc)bindingsInstallFunc
                    jsEngineProvider:(RCTHostJSEngineProvider)jsEngineProvider NS_DESIGNATED_INITIALIZER FB_OBJC_DIRECT;

/**
 * This function initializes an RCTInstance if one does not yet exist.  This function is currently only called on the
 * main thread, but it should be threadsafe.
 * TODO T74233481 - Verify if this function is threadsafe.
 */
- (void)start;

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName
                                             mode:(facebook::react::DisplayMode)displayMode
                                initialProperties:(NSDictionary *)properties FB_OBJC_DIRECT;

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName
                                initialProperties:(NSDictionary *)properties FB_OBJC_DIRECT;

- (RCTModuleRegistry *)getModuleRegistry FB_OBJC_DIRECT;

- (RCTSurfacePresenter *)getSurfacePresenter FB_OBJC_DIRECT;

/**
 * Calls a method on a JS module that has been registered with `registerCallableModule`. Used to invoke a JS function
 * from platform code.
 */
- (void)callFunctionOnJSModule:(NSString *)moduleName method:(NSString *)method args:(NSArray *)args;

@end

NS_ASSUME_NONNULL_END
