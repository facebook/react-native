/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@protocol RCTBridgeModule;
@class RCTModuleData;

@protocol RCTDisplayLinkModuleHolder
- (id<RCTBridgeModule>)instance;
- (Class)moduleClass;
- (dispatch_queue_t)methodQueue;
@end

@interface RCTDisplayLink : NSObject

- (instancetype)init;
- (void)invalidate;
- (void)registerModuleForFrameUpdates:(id<RCTBridgeModule>)module
                     withModuleHolder:(id<RCTDisplayLinkModuleHolder>)moduleHolder;
- (void)addToRunLoop:(NSRunLoop *)runLoop;

@end
