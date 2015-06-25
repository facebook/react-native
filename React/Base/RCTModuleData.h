/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTJavaScriptExecutor.h"

@interface RCTModuleData : NSObject

@property (nonatomic, weak, readonly) id<RCTJavaScriptExecutor> javaScriptExecutor;
@property (nonatomic, strong, readonly) NSNumber *uid;
@property (nonatomic, strong, readonly) id<RCTBridgeModule> instance;

@property (nonatomic, strong, readonly) Class cls;
@property (nonatomic, copy, readonly) NSString *name;
@property (nonatomic, copy, readonly) NSArray *methods;
@property (nonatomic, copy, readonly) NSDictionary *config;

@property (nonatomic, strong) dispatch_queue_t queue;

- (instancetype)initWithExecutor:(id<RCTJavaScriptExecutor>)javaScriptExecutor
                             uid:(NSNumber *)uid
                        instance:(id<RCTBridgeModule>)instance NS_DESIGNATED_INITIALIZER;


- (void)dispatchBlock:(dispatch_block_t)block;
- (void)dispatchBlock:(dispatch_block_t)block dispatchGroup:(dispatch_group_t)group;

@end
