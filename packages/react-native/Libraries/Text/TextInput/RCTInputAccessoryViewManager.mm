/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTInputAccessoryViewManager.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

#import <React/RCTInputAccessoryShadowView.h>
#import <React/RCTInputAccessoryView.h>

@implementation RCTInputAccessoryViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTInputAccessoryView alloc] initWithBridge:self.bridge];
}

- (RCTShadowView *)shadowView
{
  return [RCTInputAccessoryShadowView new];
}

RCT_REMAP_VIEW_PROPERTY(backgroundColor, inputAccessoryView.backgroundColor, UIColor)

@end

#endif // RCT_REMOVE_LEGACY_ARCH
