/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>
#import "RCTBridgeModule.h"

@class RCTNativeAnimatedModule;
@class RCTAnimatedNode;
@interface RCTNativeAnimationManager : NSObject

@property (nonatomic, weak) RCTNativeAnimatedModule *nativeAnimationModule;

+ (instancetype)sharedManager;

- (void)createAnimatedNode:(nonnull NSNumber *)tag
                    config:(nonnull NSDictionary *)config;

- (void)connectAnimatedNodes:(nonnull NSNumber *)parentTag
                    childTag:(nonnull NSNumber *)childTag;

- (void)disconnectAnimatedNodes:(nonnull NSNumber *)parentTag
                       childTag:(nonnull NSNumber *)childTag;

- (void)startAnimatingNode:(nonnull NSNumber *)animationId
                   nodeTag:(nonnull NSNumber *)nodeTag
                    config:(nonnull NSDictionary *)config
              endCallback:(nullable RCTResponseSenderBlock)callBack;

- (void)stopAnimation:(nonnull NSNumber *)animationId;

- (void)setAnimatedNodeValue:(nonnull NSNumber *)nodeTag
                       value:(nonnull NSNumber *)value;

- (void)connectAnimatedNodeToView:(nonnull NSNumber *)nodeTag
                          viewTag:(nonnull NSNumber *)viewTag;

- (void)disconnectAnimatedNodeFromView:(nonnull NSNumber *)nodeTag
                               viewTag:(nonnull NSNumber *)viewTag;

- (void)dropAnimatedNode:(nonnull NSNumber *)tag;

- (nullable RCTAnimatedNode *)nodeForTag:(nonnull NSNumber *)tag;

@end
