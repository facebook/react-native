/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
