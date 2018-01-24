/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTVirtualTextViewManager.h"

#import "RCTVirtualTextShadowView.h"

@implementation RCTVirtualTextViewManager

RCT_EXPORT_MODULE(RCTVirtualText)

- (UIView *)view
{
  return [UIView new];
}

- (RCTShadowView *)shadowView
{
  return [RCTVirtualTextShadowView new];
}

@end
