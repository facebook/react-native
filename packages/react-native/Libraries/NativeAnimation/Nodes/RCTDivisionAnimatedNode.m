/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDivisionAnimatedNode.h>

#import <React/RCTLog.h>

@implementation RCTDivisionAnimatedNode

- (void)performUpdate
{
  [super performUpdate];

  NSArray<NSNumber *> *inputNodes = self.config[@"input"];
  if (inputNodes.count > 1) {
    RCTValueAnimatedNode *parent1 = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNodes[0]];
    RCTValueAnimatedNode *parent2 = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNodes[1]];
    if ([parent1 isKindOfClass:[RCTValueAnimatedNode class]] &&
        [parent2 isKindOfClass:[RCTValueAnimatedNode class]]) {
      if (parent2.value == 0) {
        RCTLogError(@"Detected a division by zero in Animated.divide node");
        return;
      }
      self.value = parent1.value / parent2.value;
    }
  }
}

@end
