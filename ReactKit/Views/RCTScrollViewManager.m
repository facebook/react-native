// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTScrollViewManager.h"

#import "RCTConvert.h"
#import "RCTScrollView.h"

@implementation RCTScrollViewManager

- (UIView *)view
{
  return [[RCTScrollView alloc] initWithEventDispatcher:self.eventDispatcher];
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
RCT_EXPORT_VIEW_PROPERTY(contentOffset);

+ (NSDictionary *)constantsToExport
{
  return
  @{
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

@end
