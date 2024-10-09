/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDebuggingOverlayManager.h"
#import "RCTDebuggingOverlay.h"

#import <React/RCTLog.h>
#import <React/RCTUIManager.h>

#import "RCTBridge.h"

@implementation RCTDebuggingOverlayManager

RCT_EXPORT_MODULE(DebuggingOverlay)

- (UIView *)view
{
  return [RCTDebuggingOverlay new];
}

RCT_EXPORT_METHOD(highlightTraceUpdates : (nonnull NSNumber *)viewTag nodes : (NSArray *)updates)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[RCTDebuggingOverlay class]]) {
      [(RCTDebuggingOverlay *)view highlightTraceUpdates:updates];
    } else {
      RCTLogError(@"Expected view to be RCTDebuggingOverlay, got %@", NSStringFromClass([view class]));
    }
  }];
}

RCT_EXPORT_METHOD(highlightElements : (nonnull NSNumber *)viewTag elements : (NSArray *)elements)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[RCTDebuggingOverlay class]]) {
      [(RCTDebuggingOverlay *)view highlightElements:elements];
    } else {
      RCTLogError(@"Expected view to be RCTDebuggingOverlay, got %@", NSStringFromClass([view class]));
    }
  }];
}

RCT_EXPORT_METHOD(clearElementsHighlights : (nonnull NSNumber *)viewTag)
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];

    if ([view isKindOfClass:[RCTDebuggingOverlay class]]) {
      [(RCTDebuggingOverlay *)view clearElementsHighlights];
    } else {
      RCTLogError(@"Expected view to be RCTDebuggingOverlay, got %@", NSStringFromClass([view class]));
    }
  }];
}

@end
