/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTRuntimeExecutor.h"

@implementation RCTRuntimeExecutor {
  facebook::react::RuntimeExecutor _runtimeExecutor;
}

#pragma mark - Initializer

- (instancetype)initWithRuntimeExecutor:(facebook::react::RuntimeExecutor)runtimeExecutor
{
  if (self = [super init]) {
    _runtimeExecutor = runtimeExecutor;
  }

  return self;
}

#pragma mark - Public API

- (void)execute:(RCTJSIRuntimeHandlingBlock)block
{
  if (_runtimeExecutor) {
    _runtimeExecutor([=](facebook::jsi::Runtime &runtime) { block(runtime); });
  }
}

@end
