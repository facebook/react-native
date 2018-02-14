/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTMaskedViewManager.h"

#import "RCTMaskedView.h"
#import "RCTUIManager.h"

@implementation RCTMaskedViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RCTMaskedView new];
}

@end
