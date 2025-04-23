/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTCallInvoker.h"

@implementation RCTCallInvoker {
  std::shared_ptr<facebook::react::CallInvoker> _callInvoker;
}

- (instancetype)init
{
  return [self initWithCallInvoker:nullptr];
}

- (instancetype)initWithCallInvoker:(std::shared_ptr<facebook::react::CallInvoker>)callInvoker
{
  if (self = [super init]) {
    _callInvoker = callInvoker;
  }

  return self;
}

- (std::shared_ptr<facebook::react::CallInvoker>)callInvoker
{
  return _callInvoker;
}

@end
