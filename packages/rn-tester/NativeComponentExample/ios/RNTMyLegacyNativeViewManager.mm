/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import "RNTMyNativeViewComponentView.h"

@interface RNTMyLegacyNativeViewManager : RCTViewManager

@end

@implementation RNTMyLegacyNativeViewManager

RCT_EXPORT_MODULE()

RCT_REMAP_VIEW_PROPERTY(color, backgroundColor, UIColor)

RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)

- (UIView *)view
{
  UIView *view = [[UIView alloc] init];
  view.backgroundColor = UIColor.greenColor;
  return view;
}

@end
