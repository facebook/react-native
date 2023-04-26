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
@class RCTJSThreadManager;
@class RCTModuleRegistry;
@class RCTPerformanceLogger;
@protocol RCTInstanceDelegate;
FB_RUNTIME_PROTOCOL
@protocol RCTTurboModuleManagerDelegate;

/**
 * This notification fires just before RCTHost releases it's RCTInstance reference.
 */
RCT_EXTERN NSString *const RCTHostWillReloadNotification;

/**
 * This notification fires just after RCTHost releases it's RCTInstance reference.
 */
RCT_EXTERN NSString *const RCTHostDidReloadNotification;

@protocol RCTHostDelegate <NSObject>

- (std::shared_ptr<facebook::react::JSEngineInstance>)getJSEngine;
- (NSURL *)getBundleURL;

@end

/**
 * RCTHost is an object which is responsible for managing the lifecycle of a single RCTInstance.
 * RCTHost is long lived, while an instance may be deallocated and re-initialized. Some examples of when this happens:
 * CMD+R reload in DEV or a JS crash. The host should be the single owner of an RCTInstance.
 */
@interface RCTHost : NSObject <ReactInstanceForwarding>

- (instancetype)initWithHostDelegate:(id<RCTHostDelegate>)hostDelegate
                    instanceDelegate:(id<RCTInstanceDelegate>)instanceDelegate
          turboModuleManagerDelegate:(id<RCTTurboModuleManagerDelegate>)turboModuleManagerDelegate
                 bindingsInstallFunc:(facebook::react::ReactInstance::BindingsInstallFunc)bindingsInstallFunc
                 jsErrorHandlingFunc:(facebook::react::JsErrorHandler::JsErrorHandlingFunc)jsErrorHandlingFunc
    NS_DESIGNATED_INITIALIZER FB_OBJC_DIRECT;

/**
 * This function initializes an RCTInstance if one does not yet exist.  This function is currently only called on the
 * main thread, but it should be threadsafe.
 * TODO T74233481 - Verify if this function is threadsafe.
 */
- (void)preload;

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName
                                             mode:(facebook::react::DisplayMode)displayMode
                                initialProperties:(NSDictionary *)properties FB_OBJC_DIRECT;

- (RCTFabricSurface *)createSurfaceWithModuleName:(NSString *)moduleName
                                initialProperties:(NSDictionary *)properties FB_OBJC_DIRECT;

- (RCTJSThreadManager *)getJSThreadManager FB_OBJC_DIRECT;

- (RCTModuleRegistry *)getModuleRegistry FB_OBJC_DIRECT;

- (RCTPerformanceLogger *)getPerformanceLogger FB_OBJC_DIRECT;

- (RCTSurfacePresenter *)getSurfacePresenter FB_OBJC_DIRECT;

@end

NS_ASSUME_NONNULL_END
