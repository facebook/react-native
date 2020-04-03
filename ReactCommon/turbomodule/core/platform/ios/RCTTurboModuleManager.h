/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTurboModule.h"

@protocol RCTTurboModuleManagerDelegate <NSObject>

// TODO: Move to xplat codegen.
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const std::string &)name
                                                       instance:(id<RCTTurboModule>)instance
                                                      jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
                                                  nativeInvoker:
                                                      (std::shared_ptr<facebook::react::CallInvoker>)nativeInvoker
                                                     perfLogger:(id<RCTTurboModulePerformanceLogger>)perfLogger;

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

@interface RCTTurboModuleManager : NSObject <RCTTurboModuleLookupDelegate>

- (instancetype)initWithBridge:(RCTBridge *)bridge
                      delegate:(id<RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker;

- (instancetype)initWithBridge:(RCTBridge *)bridge
                      delegate:(id<RCTTurboModuleManagerDelegate>)delegate
                     jsInvoker:(std::shared_ptr<facebook::react::CallInvoker>)jsInvoker
             performanceLogger:(id<RCTTurboModulePerformanceLogger>)performanceLogger;

- (void)installJSBindingWithRuntime:(facebook::jsi::Runtime *)runtime;

- (void)invalidate;

@end
