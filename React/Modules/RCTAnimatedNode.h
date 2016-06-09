/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@interface RCTAnimatedNode : NSObject

- (instancetype)initWithTag:(NSNumber *)tag config:(NSDictionary *)config;

@property (nonatomic, readonly) NSNumber *nodeTag;
@property (nonatomic, copy) NSDictionary<NSString *, id> *config;

@property (nonatomic, readonly) NSDictionary<NSNumber *, RCTAnimatedNode *> *childNodes;
@property (nonatomic, readonly) NSDictionary<NSNumber *, RCTAnimatedNode *> *parentNodes;

@property (nonatomic, readonly) BOOL needsUpdate;
@property (nonatomic, readonly) BOOL hasUpdated;

/**
 * Marks a node and its children as needing update.
 */

- (void)setNeedsUpdate;

/**
 * The node will update its value if necesarry and only after its parents have updated.
 */

- (void)updateNodeIfNecessary;

/**
 * Where the actual update code lives. Called internally from updateNodeIfNecessary
 */

- (void)performUpdate NS_REQUIRES_SUPER;

/**
 * Cleans up after a round of updates.
 */

- (void)cleanupAnimationUpdate;


- (void)addChild:(RCTAnimatedNode *)child;
- (void)removeChild:(RCTAnimatedNode *)child;

- (void)onAttachedToNode:(RCTAnimatedNode *)parent;
- (void)onDettachedFromNode:(RCTAnimatedNode *)parent;

- (void)dettachNode;

@end
