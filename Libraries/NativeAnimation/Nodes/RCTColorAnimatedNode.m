/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTColorAnimatedNode.h>
#import <React/RCTValueAnimatedNode.h>

@implementation RCTColorAnimatedNode

- (void)performUpdate
{
  [super performUpdate];

  RCTValueAnimatedNode *rNode = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"r"]];
  RCTValueAnimatedNode *gNode = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"g"]];
  RCTValueAnimatedNode *bNode = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"b"]];
  RCTValueAnimatedNode *aNode = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"a"]];

  _color = ((int)round(aNode.value * 255) & 0xff) << 24 | ((int)round(rNode.value) & 0xff) << 16 |
      ((int)round(gNode.value) & 0xff) << 8 | ((int)round(bNode.value) & 0xff);

  // TODO (T111179606): Support platform colors for color animations
}

@end
