/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTColorAnimatedNode.h>
#import <React/RCTValueAnimatedNode.h>

#import <React/RCTAnimationUtils.h>

@implementation RCTColorAnimatedNode

- (void)performUpdate
{
  [super performUpdate];

  RCTValueAnimatedNode *rNode = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"r"]];
  RCTValueAnimatedNode *gNode = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"g"]];
  RCTValueAnimatedNode *bNode = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"b"]];
  RCTValueAnimatedNode *aNode = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"a"]];

  _color = RCTColorFromComponents(rNode.value, gNode.value, bNode.value, aNode.value);

  // TODO (T111179606): Support platform colors for color animations
}

@end
