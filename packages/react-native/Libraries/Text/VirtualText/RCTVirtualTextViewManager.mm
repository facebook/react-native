/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTVirtualTextShadowView.h>
#import <React/RCTVirtualTextView.h>
#import <React/RCTVirtualTextViewManager.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

@implementation RCTVirtualTextViewManager

RCT_EXPORT_MODULE(RCTVirtualText)

- (UIView *)view
{
  return [RCTVirtualTextView new];
}

- (RCTShadowView *)shadowView
{
  return [RCTVirtualTextShadowView new];
}

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
