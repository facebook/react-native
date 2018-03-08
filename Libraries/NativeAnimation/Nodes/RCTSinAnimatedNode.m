/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTSinAnimatedNode.h"

@implementation RCTSinAnimatedNode

- (void)performUpdate
{
  [super performUpdate];

  NSArray<NSNumber *> *inputNodes = self.config[@"input"];
  if (inputNodes.count == 1) {
    RCTValueAnimatedNode *parent = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNodes[0]];
    if ([parent1isKindOfClass:[RCTValueAnimatedNode class]]) {
      self.value = sin(parent1.value);
    }
  }
}

@end
