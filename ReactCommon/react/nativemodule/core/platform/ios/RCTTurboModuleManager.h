/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <memory>

#import <React/RCTTurboModuleRegistry.h>
#import <ReactCommon/RuntimeExecutor.h>
#import "RCTTurboModule.h"

@protocol RCTTurboModuleManagerDelegate <NSObject>

@optional
- (NSArray<NSString *> *)getEagerInitModuleNames;
- (NSArray<NSString *> *)getEagerInitMainQueueModuleNames;

/**
 * Given a module name, return its actual class. If not provided, basic ObjC class lookup is performed.
 */
- (Class)getModuleClassFromName:(const char *)name;

/**
 * Given a module class, provide an instance for it. If not provided, default initializer is used.
 */
- (id<RCTTurboModule>)getModuleInstanceFromClass:(Class)moduleClass;

/**
 * Create an instance of a TurboModule without relying on any ObjC++ module instance.
 */
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                      jsInvoker:
                                                          (std::shared_ptr<facebook::react::CallInvoker>)jsInvoker;

@end

@interface RCTTurboModuleManager : NSObject <RCTTurboModuleRegistry>

- (instancetype)initWithBridge:(RCTBridge *)bridge
                      delegate:(id<RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker;

- (void)installJSBindingWithRuntimeExecutor:(facebook::react::RuntimeExecutor)runtimeExecutor;

- (void)invalidate;

@end
