/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTVirtualTextViewManager.h>

#import <React/RCTVirtualTextShadowView.h>

@implementation RCTVirtualTextViewManager

RCT_EXPORT_MODULE(RCTVirtualText)

- (RCTUIView *)view // TODO(macOS ISS#3536887)
{
  return [RCTUIView new]; // TODO(macOS ISS#3536887)
}

- (RCTShadowView *)shadowView
{
  return [RCTVirtualTextShadowView new];
}

@end
