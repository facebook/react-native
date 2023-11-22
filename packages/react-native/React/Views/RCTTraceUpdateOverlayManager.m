/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTTraceUpdateOverlayManager.h"
#import "RCTTraceUpdateOverlay.h"

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>

#import "RCTBridge.h"

@implementation RCTTraceUpdateOverlayManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [RCTTraceUpdateOverlay new];
}

RCT_EXPORT_METHOD(draw : (nonnull NSNumber *)viewTag nodes : (NSString *)serializedNodes)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[RCTTraceUpdateOverlay class]]) {
      [(RCTTraceUpdateOverlay *)view draw:serializedNodes];
    } else {
      RCTLogError(@"Expected view to be RCTTraceUpdateOverlay, got %@", NSStringFromClass([view class]));
    }
  }];
}

@end
