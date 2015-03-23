/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTScrollViewManager.h"

#import "RCTBridge.h"
#import "RCTConvert.h"
#import "RCTScrollView.h"
#import "RCTSparseArray.h"
#import "RCTUIManager.h"

@implementation RCTScrollViewManager

- (UIView *)view
{
  return [[RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal)
RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical)
RCT_EXPORT_VIEW_PROPERTY(bounces)
RCT_EXPORT_VIEW_PROPERTY(bouncesZoom)
RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches)
RCT_EXPORT_VIEW_PROPERTY(centerContent)
RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets)
RCT_EXPORT_VIEW_PROPERTY(decelerationRate)
RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled)
RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode)
RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale)
RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale)
RCT_EXPORT_VIEW_PROPERTY(pagingEnabled)
RCT_EXPORT_VIEW_PROPERTY(scrollEnabled)
RCT_EXPORT_VIEW_PROPERTY(scrollsToTop)
RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator)
RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator)
RCT_EXPORT_VIEW_PROPERTY(stickyHeaderIndices);
RCT_EXPORT_VIEW_PROPERTY(throttleScrollCallbackMS);
RCT_EXPORT_VIEW_PROPERTY(zoomScale);
RCT_EXPORT_VIEW_PROPERTY(contentInset);
RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets);
RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset);

- (NSDictionary *)constantsToExport
{
  return @{
    @"DecelerationRate": @{
      @"Normal": @(UIScrollViewDecelerationRateNormal),
      @"Fast": @(UIScrollViewDecelerationRateFast),
    },
    @"KeyboardDismissMode": @{
      @"None": @(UIScrollViewKeyboardDismissModeNone),
      @"Interactive": @(UIScrollViewKeyboardDismissModeInteractive),
      @"OnDrag": @(UIScrollViewKeyboardDismissModeOnDrag),
    },
  };
}

- (void)getContentSize:(NSNumber *)reactTag
              callback:(RCTResponseSenderBlock)callback
{
  RCT_EXPORT();

  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, RCTSparseArray *viewRegistry) {

    UIView *view = viewRegistry[reactTag];
    if (!view) {
      RCTLogError(@"Cannot find view with tag %@", reactTag);
      return;
    }

    CGSize size = ((RCTScrollView *)view).scrollView.contentSize;
    callback(@[@{
      @"width" : @(size.width),
      @"height" : @(size.height)
    }]);
  }];
}

@end
