/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAnimatedNode.h"

#import <React/RCTDefines.h>

@implementation RCTAnimatedNode
{
  NSMapTable<NSNumber *, RCTAnimatedNode *> *_childNodes;
  NSMapTable<NSNumber *, RCTAnimatedNode *> *_parentNodes;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super init])) {
    _nodeTag = tag;
    _config = [config copy];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (NSMapTable<NSNumber *, RCTAnimatedNode *> *)childNodes
{
  return _childNodes;
}

- (NSMapTable<NSNumber *, RCTAnimatedNode *> *)parentNodes
{
  return _parentNodes;
}

- (void)addChild:(RCTAnimatedNode *)child
{
  if (!_childNodes) {
    _childNodes = [NSMapTable strongToWeakObjectsMapTable];
  }
  if (child) {
    [_childNodes setObject:child forKey:child.nodeTag];
    [child onAttachedToNode:self];
  }
}

- (void)removeChild:(RCTAnimatedNode *)child
{
  if (!_childNodes) {
    return;
  }
  if (child) {
    [_childNodes removeObjectForKey:child.nodeTag];
    [child onDetachedFromNode:self];
  }
}

- (void)onAttachedToNode:(RCTAnimatedNode *)parent
{
  if (!_parentNodes) {
    _parentNodes = [NSMapTable strongToWeakObjectsMapTable];
  }
  if (parent) {
    [_parentNodes setObject:parent forKey:parent.nodeTag];
  }
}

- (void)onDetachedFromNode:(RCTAnimatedNode *)parent
{
  if (!_parentNodes) {
    return;
  }
  if (parent) {
    [_parentNodes removeObjectForKey:parent.nodeTag];
  }
}

- (void)detachNode
{
  for (RCTAnimatedNode *parent in _parentNodes.objectEnumerator) {
    [parent removeChild:self];
  }
  for (RCTAnimatedNode *child in _childNodes.objectEnumerator) {
    [self removeChild:child];
  }
}

- (void)setNeedsUpdate
{
  _needsUpdate = YES;
  for (RCTAnimatedNode *child in _childNodes.objectEnumerator) {
    [child setNeedsUpdate];
  }
}

- (void)updateNodeIfNecessary
{
  if (_needsUpdate) {
    for (RCTAnimatedNode *parent in _parentNodes.objectEnumerator) {
      [parent updateNodeIfNecessary];
    }
    [self performUpdate];
  }
}

- (void)performUpdate
{
  _needsUpdate = NO;
  // To be overidden by subclasses
  // This method is called on a node only if it has been marked for update
  // during the current update loop
}

@end
