/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAnimatedNode.h"

@implementation RCTAnimatedNode {
  NSMutableDictionary *_childNodes;
  NSMutableDictionary *_parentNodes;
}

- (instancetype)initWithTag:(NSNumber *)tag config:(NSDictionary *)config {
  self = [super init];
  if (self) {
    _nodeTag = tag;
    _config = config;
  }
  return self;
}

- (NSDictionary *)childNodes {
  return _childNodes;
}

- (NSDictionary *)parentNodes {
  return _parentNodes;
}

- (void)addChild:(RCTAnimatedNode *)child {
  if (!_childNodes) {
    _childNodes = [NSMutableDictionary new];
  }
  
  if (child) {
    [_childNodes setObject:child forKey:child.nodeTag];
    [child onAttachedToNode:self];
  }
  
}

- (void)removeChild:(RCTAnimatedNode *)child {
  if (!_childNodes) {
    return;
  }
  
  if (child) {
    [_childNodes removeObjectForKey:child.nodeTag];
    [child onDettachedFromNode:self];
  }
}

- (void)onAttachedToNode:(RCTAnimatedNode *)parent {
  if (!_parentNodes) {
    _parentNodes = [NSMutableDictionary new];
  }
  
  if (parent) {
    [_parentNodes setObject:parent forKey:parent.nodeTag];
  }
}

- (void)onDettachedFromNode:(RCTAnimatedNode *)parent {
  if (!_parentNodes) {
    return;
  }
  
  if (parent) {
    [_parentNodes removeObjectForKey:parent.nodeTag];
  }
}

- (void)dettachNode {
  NSArray *parentNodes = [NSArray arrayWithArray:_parentNodes.allValues];
  for (RCTAnimatedNode *parent in parentNodes) {
    [parent removeChild:self];
  }
  NSArray *childNodes = [NSArray arrayWithArray:_childNodes.allValues];
  for (RCTAnimatedNode *child in childNodes) {
    [self removeChild:child];
  }
}

- (void)setNeedsUpdate {
  if (_needsUpdate) {
    // Has already been marked. Stop branch.
    return;
  }
  _needsUpdate = YES;
  [_childNodes.allValues makeObjectsPerformSelector:@selector(setNeedsUpdate)];
}

- (void)cleanupAnimationUpdate {
  if (_hasUpdated) {
    _needsUpdate = NO;
    _hasUpdated = NO;
    [_childNodes.allValues makeObjectsPerformSelector:@selector(cleanupAnimationUpdate)];
  }
}

- (void)updateNodeIfNecessary {
  if (_needsUpdate && !_hasUpdated) {
    // First make sure all parent nodes have been updated
    [_parentNodes.allValues makeObjectsPerformSelector:@selector(updateNodeIfNecessary)];
    [self performUpdate];
  }
}

- (void)performUpdate {
  _hasUpdated = YES;
  // To be overidden by subclasses
  // This method is called on a node only if it has been marked for update during the current update loop
  // Note subclasses must call [super performUpdate]
}

@end
