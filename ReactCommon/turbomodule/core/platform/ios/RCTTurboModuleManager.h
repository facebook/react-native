/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <memory>

#import "RCTTurboModule.h"

#import <ReactCommon/RuntimeExecutor.h>

@protocol RCTTurboModuleManagerDelegate <NSObject>

// TODO: Move to xplat codegen.
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                     initParams:
                                                         (const facebook::react::ObjCTurboModule::InitParams &)params;
@optional
- (NSArray<NSString *> *)getEagerInitModuleNames;
- (NSArray<NSString *> *)getEagerInitMainQueueModuleNames;

@optional

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
