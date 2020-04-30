/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTMultiplicationAnimatedNode.h>

@implementation RCTMultiplicationAnimatedNode

- (void)performUpdate
{
  [super performUpdate];

  NSArray<NSNumber *> *inputNodes = self.config[@"input"];
  if (inputNodes.count > 1) {
    RCTValueAnimatedNode *parent1 = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNodes[0]];
    RCTValueAnimatedNode *parent2 = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNodes[1]];
    if ([parent1 isKindOfClass:[RCTValueAnimatedNode class]] &&
        [parent2 isKindOfClass:[RCTValueAnimatedNode class]]) {
      self.value = parent1.value * parent2.value;
    }
  }
}

@end
