/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import "RNTLegacyView.h"
#import "RNTMyNativeViewComponentView.h"

@interface RNTMyLegacyNativeViewManager : RCTViewManager

@end

@implementation RNTMyLegacyNativeViewManager

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_EXPORT_MODULE()

RCT_REMAP_VIEW_PROPERTY(color, backgroundColor, UIColor)

RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)

RCT_EXPORT_VIEW_PROPERTY(onColorChanged, RCTBubblingEventBlock)

- (RCTUIView *)view // [macOS]
{
  RNTLegacyView *view = [[RNTLegacyView alloc] init];
  return view;
}

- (NSDictionary *)constantsToExport
{
  return @{@"PI" : @3.14};
}
@end
