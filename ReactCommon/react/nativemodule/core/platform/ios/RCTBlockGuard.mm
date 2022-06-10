/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBlockGuard.h"

@implementation RCTBlockGuard {
  void (^_cleanup)(void);
}

- (instancetype)initWithCleanup:(void (^)(void))cleanup
{
  if (self = [super init]) {
    _cleanup = cleanup;
  }

  return self;
}

- (void)dealloc
{
  _cleanup();
}

@end
