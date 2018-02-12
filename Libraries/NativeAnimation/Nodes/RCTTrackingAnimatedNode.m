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
  NSNumber *_toValueNodeTag;
  NSNumber *_valueNodeTag;
  NSMutableDictionary *_animationConfig;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithTag:tag config:config])) {
    _animationId = config[@"animationId"];
    _toValueNodeTag = config[@"toValue"];
    _valueNodeTag = config[@"value"];
    _animationConfig = [NSMutableDictionary dictionaryWithDictionary:config[@"animationConfig"]];
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

  // change animation config's "toValue" to reflect updated value of the parent node
  RCTValueAnimatedNode *node = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:_toValueNodeTag];
  _animationConfig[@"toValue"] = @(node.value);

  [self.manager startAnimatingNode:_animationId
                           nodeTag:_valueNodeTag
                            config:_animationConfig
                       endCallback:nil];
}

@end

