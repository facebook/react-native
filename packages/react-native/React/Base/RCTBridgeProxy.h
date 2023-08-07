/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "RCTBridgeModule.h"

@class RCTBundleManager;
@class RCTCallableJSModules;
@class RCTModuleRegistry;
@class RCTViewRegistry;

@interface RCTBridgeProxy : NSProxy
- (instancetype)initWithViewRegistry:(RCTViewRegistry *)viewRegistry
                      moduleRegistry:(RCTModuleRegistry *)moduleRegistry
                       bundleManager:(RCTBundleManager *)bundleManager
                   callableJSModules:(RCTCallableJSModules *)callableJSModules
                  dispatchToJSThread:(void (^)(dispatch_block_t))dispatchToJSThread
               registerSegmentWithId:(void (^)(NSNumber *, NSString *))registerSegmentWithId NS_DESIGNATED_INITIALIZER;

- (NSMethodSignature *)methodSignatureForSelector:(SEL)sel;
- (void)forwardInvocation:(NSInvocation *)invocation;

- (void)logWarning:(NSString *)message cmd:(SEL)cmd;
- (void)logError:(NSString *)message cmd:(SEL)cmd;

/**
 * Methods required for RCTBridge class extensions
 */
- (id)moduleForClass:(Class)moduleClass;
- (id)moduleForName:(NSString *)moduleName lazilyLoadIfNecessary:(BOOL)lazilyLoad;
@end
