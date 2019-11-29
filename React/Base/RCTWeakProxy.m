/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTWeakProxy.h"

@implementation RCTWeakProxy

- (instancetype)initWithTarget:(id)target
{
  if (self = [super init]) {
    _target = target;
  }
  return self;
}

+ (instancetype)weakProxyWithTarget:(id)target
{
  return [[RCTWeakProxy alloc] initWithTarget:target];
}

- (id)forwardingTargetForSelector:(SEL)aSelector
{
  return _target;
}

@end
