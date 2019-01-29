/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModuloAnimatedNode.h"

@implementation RCTModuloAnimatedNode

- (void)performUpdate
{
  [super performUpdate];
  NSNumber *inputNode = self.config[@"input"];
  NSNumber *modulus = self.config[@"modulus"];
  RCTValueAnimatedNode *parent = (RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNode];
  self.value = fmodf(parent.value, modulus.floatValue);
}

@end
