/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDivisionAnimatedNode.h"
#import "RCTLog.h"

@implementation RCTDivisionAnimatedNode

- (void)performUpdate
{
  [super performUpdate];

  NSArray<NSNumber *> *inputNodes = self.config[@"input"];
  if (inputNodes.count > 1) {
    RCTValueAnimatedNode *parent1 = (RCTValueAnimatedNode *)self.parentNodes[inputNodes[0]];
    RCTValueAnimatedNode *parent2 = (RCTValueAnimatedNode *)self.parentNodes[inputNodes[1]];
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
