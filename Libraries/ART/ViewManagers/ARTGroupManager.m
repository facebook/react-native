/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ARTGroupManager.h"

#import "ARTGroup.h"

@implementation ARTGroupManager

RCT_EXPORT_MODULE()

- (ARTNode *)node
{
  return [[ARTGroup alloc] init];
}

@end
