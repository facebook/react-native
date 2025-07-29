/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTLog.h>
#import <UIKit/UIKit.h>
#import "../VirtualViewExperimental/RCTVirtualViewMode.h"

#import <React/RCTScrollViewComponentView.h>
#import <react/featureflags/ReactNativeFeatureFlags.h>
#import "RCTVirtualViewContainerState.h"

using namespace facebook;
using namespace facebook::react;

#if RCT_DEBUG
static void debugLog(NSString *msg, ...)
{
  auto debugEnabled = ReactNativeFeatureFlags::enableVirtualViewDebugFeatures();
  if (!debugEnabled) {
    return;
  }

  va_list args = nullptr;
  va_start(args, msg);
  NSString *msgString = [[NSString alloc] initWithFormat:msg arguments:args];
  RCTLogInfo(@"%@", msgString);
}
#endif

static BOOL CGRectOverlaps(CGRect rect1, CGRect rect2)
{
  CGFloat minY1 = CGRectGetMinY(rect1);
  CGFloat maxY1 = CGRectGetMaxY(rect1);
  CGFloat minY2 = CGRectGetMinY(rect2);
  CGFloat maxY2 = CGRectGetMaxY(rect2);
  if (minY1 >= maxY2 || minY2 >= maxY1) {
    // No overlap on the y-axis.
    return NO;
  }
  CGFloat minX1 = CGRectGetMinX(rect1);
  CGFloat maxX1 = CGRectGetMaxX(rect1);
  CGFloat minX2 = CGRectGetMinX(rect2);
  CGFloat maxX2 = CGRectGetMaxX(rect2);
  if (minX1 >= maxX2 || minX2 >= maxX1) {
    // No overlap on the x-axis.
    return NO;
  }
  return YES;
}

@interface RCTVirtualViewContainerState () <UIScrollViewDelegate>
@end

@implementation RCTVirtualViewContainerState

- (instancetype)initWithScrollView:(RCTScrollViewComponentView *)scrollView
{
  self = [super init];
  if (self != nil) {
    _virtualViews = [NSMutableSet set];
    _emptyRect = CGRectZero;
    _prerenderRect = CGRectZero;
    _scrollViewComponentView = scrollView;
    _prerenderRatio = ReactNativeFeatureFlags::virtualViewPrerenderRatio();
    [_scrollViewComponentView addScrollListener:self];

#if RCT_DEBUG
    debugLog(@"initWithScrollView");
#endif
  }
  return self;
}

- (void)onChange:(id<RCTVirtualViewProtocol>)virtualView
{
  if (![_virtualViews containsObject:virtualView]) {
    [_virtualViews addObject:virtualView];
#if RCT_DEBUG
    debugLog(@"Add virtualViewID=%@", virtualView.virtualViewID);
#endif

  } else {
#if RCT_DEBUG
    debugLog(@"Update virtualViewID=%@", virtualView.virtualViewID);
#endif
  }
  [self updateModes:virtualView];
}

- (void)cleanup
{
#if RCT_DEBUG
  debugLog(@"Cleanup");
#endif
  if (_scrollViewComponentView != nil) {
    [_scrollViewComponentView removeScrollListener:self];
    _scrollViewComponentView = nil;
  }
  [_virtualViews removeAllObjects];
}

- (void)remove:(id<RCTVirtualViewProtocol>)virtualView
{
  NSAssert(
      [_virtualViews containsObject:virtualView],
      @"Attempting to remove non-existent VirtualView: %@",
      virtualView.virtualViewID);

  [_virtualViews removeObject:virtualView];

#if RCT_DEBUG
  debugLog(@"Remove virtualViewID=%@", virtualView.virtualViewID);
#endif
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  [self updateModes:nil];
}

- (void)updateModes:(id<RCTVirtualViewProtocol>)virtualView
{
  auto scrollView = _scrollViewComponentView.scrollView;
  CGRect visibleRect = CGRectMake(
      scrollView.contentOffset.x,
      scrollView.contentOffset.y,
      scrollView.frame.size.width,
      scrollView.frame.size.height);

  _prerenderRect = visibleRect;
  _prerenderRect = CGRectInset(
      _prerenderRect, -_prerenderRect.size.width * _prerenderRatio, -_prerenderRect.size.height * _prerenderRatio);

  NSArray<id<RCTVirtualViewProtocol>> *virtualViewsIt =
      (virtualView != nullptr) ? @[ virtualView ] : [_virtualViews allObjects];

  for (id<RCTVirtualViewProtocol> vv = nullptr in virtualViewsIt) {
    CGRect rect = [vv containerRelativeRect:scrollView];

    RCTVirtualViewMode mode = RCTVirtualViewModeHidden;
    CGRect thresholdRect = _emptyRect;

    if (CGRectIsEmpty(rect)) {
      mode = RCTVirtualViewModeHidden;
      thresholdRect = _emptyRect;
    } else if (CGRectOverlaps(rect, visibleRect)) {
      thresholdRect = visibleRect;
      mode = RCTVirtualViewModeVisible;
    } else if (CGRectOverlaps(rect, _prerenderRect)) {
      mode = RCTVirtualViewModePrerender;
      thresholdRect = _prerenderRect;
    }

#if RCT_DEBUG
    debugLog(
        @"UpdateModes virtualView=%@ mode=%ld rect=%@ thresholdRect=%@",
        vv.virtualViewID,
        (long)mode,
        NSStringFromCGRect(rect),
        NSStringFromCGRect(thresholdRect));
#endif
    [vv onModeChange:mode targetRect:rect thresholdRect:thresholdRect];
  }
}
@end
