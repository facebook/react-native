/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTCosAnimatedNode.h"

@implementation RCTCosAnimatedNode

- (void)performUpdate
{
  [super performUpdate];

  NSArray<NSNumber *> *inputNodes = self.config[@"input"];
  if (inputNodes.count == 1) {
    RCTValueAnimatedNode *parent = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNodes[0]];
    if ([parent isKindOfClass:[RCTValueAnimatedNode class]]) {
      self.value = cos(parent.value);
    }
  }
}

@end
