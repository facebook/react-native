/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTVirtualTextViewManager.h>

#import <React/RCTVirtualTextShadowView.h>

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
