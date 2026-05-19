/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIManager.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

#import "RCTRefreshControl.h"
#import "RCTRefreshControlManager.h"
#import "RCTRefreshableProtocol.h"

@implementation RCTRefreshControlManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RCTRefreshControl new];
}

RCT_EXPORT_VIEW_PROPERTY(onRefresh, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(refreshing, BOOL)
RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(title, NSString)
RCT_EXPORT_VIEW_PROPERTY(titleColor, UIColor)
RCT_EXPORT_VIEW_PROPERTY(progressViewOffset, CGFloat)

RCT_EXPORT_METHOD(setNativeRefreshing : (nonnull NSNumber *)viewTag toRefreshing : (BOOL)refreshing)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view conformsToProtocol:@protocol(RCTRefreshableProtocol)]) {
      [(id<RCTRefreshableProtocol>)view setRefreshing:refreshing];
    } else {
      RCTLogError(@"view must conform to protocol RCTRefreshableProtocol");
    }
  }];
}

@end

#endif // RCT_REMOVE_LEGACY_ARCH
