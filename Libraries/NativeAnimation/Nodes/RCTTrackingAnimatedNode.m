/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTrackingAnimatedNode.h"
#import "RCTValueAnimatedNode.h"
#import "RCTNativeAnimatedNodesManager.h"

@implementation RCTTrackingAnimatedNode {
  NSNumber *_animationId;
  NSNumber *_nodeTag;
  NSNumber *_valueNodeTag;
  NSMutableDictionary *_animationConfig;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithTag:tag config:config])) {
    _animationId = config[@"animationId"];
    _nodeTag = config[@"toValue"];
    _valueNodeTag = config[@"value"];
    _animationConfig = config[@"animationConfig"];
  }
  return self;
}

- (void)onDetachedFromNode:(RCTAnimatedNode *)parent
{
  [self.manager stopAnimation:_animationId];
  [super onDetachedFromNode:parent];
}

- (void)performUpdate
{
  [super performUpdate];

  // clone animation config and update "toValue" to reflect updated value of the parent node
  RCTValueAnimatedNode *node = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:_nodeTag];
  NSMutableDictionary *config = [NSMutableDictionary dictionaryWithDictionary:_animationConfig];
  [config setValue:@(node.value) forKey:@"toValue"];

  NSNumber *animationId = _animationId;
  NSNumber *valueNodeTag = _valueNodeTag;
  [self.manager schedulePostUpdateOperation:^(RCTNativeAnimatedNodesManager * _Nonnull manager) {
    [manager startAnimatingNode:animationId
                        nodeTag:valueNodeTag
                         config:config
                    endCallback:nil];
  }];
}

@end

