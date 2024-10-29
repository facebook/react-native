/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollViewManager.h"

#import "RCTBridge.h"
#import "RCTScrollView.h"
#import "RCTShadowView.h"
#import "RCTUIManager.h"

@implementation RCTConvert (UIScrollView)

RCT_ENUM_CONVERTER(
    UIScrollViewKeyboardDismissMode,
    (@{
      @"none" : @(UIScrollViewKeyboardDismissModeNone),
      @"on-drag" : @(UIScrollViewKeyboardDismissModeOnDrag),
      @"interactive" : @(UIScrollViewKeyboardDismissModeInteractive),
      // Backwards compatibility
      @"onDrag" : @(UIScrollViewKeyboardDismissModeOnDrag),
    }),
    UIScrollViewKeyboardDismissModeNone,
    integerValue)

RCT_ENUM_CONVERTER(
    UIScrollViewIndicatorStyle,
    (@{
      @"default" : @(UIScrollViewIndicatorStyleDefault),
      @"black" : @(UIScrollViewIndicatorStyleBlack),
      @"white" : @(UIScrollViewIndicatorStyleWhite),
    }),
    UIScrollViewIndicatorStyleDefault,
    integerValue)

RCT_ENUM_CONVERTER(
    UIScrollViewContentInsetAdjustmentBehavior,
    (@{
      @"automatic" : @(UIScrollViewContentInsetAdjustmentAutomatic),
      @"scrollableAxes" : @(UIScrollViewContentInsetAdjustmentScrollableAxes),
      @"never" : @(UIScrollViewContentInsetAdjustmentNever),
      @"always" : @(UIScrollViewContentInsetAdjustmentAlways),
    }),
    UIScrollViewContentInsetAdjustmentNever,
    integerValue)

@end

@implementation RCTScrollViewManager

RCT_EXPORT_MODULE()

- (UIView *)view
{
  return [[RCTScrollView alloc] initWithEventDispatcher:self.bridge.eventDispatcher];
}

RCT_EXPORT_VIEW_PROPERTY(alwaysBounceHorizontal, BOOL)
RCT_EXPORT_VIEW_PROPERTY(alwaysBounceVertical, BOOL)
RCT_EXPORT_VIEW_PROPERTY(bounces, BOOL)
RCT_EXPORT_VIEW_PROPERTY(bouncesZoom, BOOL)
RCT_EXPORT_VIEW_PROPERTY(canCancelContentTouches, BOOL)
RCT_EXPORT_VIEW_PROPERTY(centerContent, BOOL)
RCT_EXPORT_VIEW_PROPERTY(maintainVisibleContentPosition, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustContentInsets, BOOL)
RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustKeyboardInsets, BOOL)
RCT_EXPORT_VIEW_PROPERTY(decelerationRate, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(endDraggingSensitivityMultiplier, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(directionalLockEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(indicatorStyle, UIScrollViewIndicatorStyle)
RCT_EXPORT_VIEW_PROPERTY(keyboardDismissMode, UIScrollViewKeyboardDismissMode)
RCT_EXPORT_VIEW_PROPERTY(maximumZoomScale, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(minimumZoomScale, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(scrollEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(pagingEnabled, BOOL)
RCT_REMAP_VIEW_PROPERTY(pinchGestureEnabled, scrollView.pinchGestureEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(scrollsToTop, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showsHorizontalScrollIndicator, BOOL)
RCT_EXPORT_VIEW_PROPERTY(showsVerticalScrollIndicator, BOOL)
RCT_EXPORT_VIEW_PROPERTY(scrollEventThrottle, NSTimeInterval)
RCT_EXPORT_VIEW_PROPERTY(zoomScale, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(contentInset, UIEdgeInsets)
RCT_EXPORT_VIEW_PROPERTY(scrollIndicatorInsets, UIEdgeInsets)
RCT_EXPORT_VIEW_PROPERTY(verticalScrollIndicatorInsets, UIEdgeInsets)
RCT_EXPORT_VIEW_PROPERTY(scrollToOverflowEnabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(snapToInterval, int)
RCT_EXPORT_VIEW_PROPERTY(disableIntervalMomentum, BOOL)
RCT_EXPORT_VIEW_PROPERTY(snapToOffsets, NSArray<NSNumber *>)
RCT_EXPORT_VIEW_PROPERTY(snapToStart, BOOL)
RCT_EXPORT_VIEW_PROPERTY(snapToEnd, BOOL)
RCT_EXPORT_VIEW_PROPERTY(snapToAlignment, NSString)
RCT_REMAP_VIEW_PROPERTY(contentOffset, scrollView.contentOffset, CGPoint)
RCT_EXPORT_VIEW_PROPERTY(onScrollBeginDrag, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onScroll, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onScrollToTop, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onScrollEndDrag, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollBegin, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMomentumScrollEnd, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(inverted, BOOL)
RCT_EXPORT_VIEW_PROPERTY(automaticallyAdjustsScrollIndicatorInsets, BOOL)
RCT_EXPORT_VIEW_PROPERTY(contentInsetAdjustmentBehavior, UIScrollViewContentInsetAdjustmentBehavior)

// overflow is used both in css-layout as well as by react-native. In css-layout
// we always want to treat overflow as scroll but depending on what the overflow
// is set to from js we want to clip drawing or not. This piece of code ensures
// that css-layout is always treating the contents of a scroll container as
// overflow: 'scroll'.
RCT_CUSTOM_SHADOW_PROPERTY(overflow, YGOverflow, RCTShadowView)
{
#pragma unused(json)
  view.overflow = YGOverflowScroll;
}

RCT_EXPORT_METHOD(getContentSize : (nonnull NSNumber *)reactTag callback : (RCTResponseSenderBlock)callback)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTScrollView *> *viewRegistry) {
        RCTScrollView *view = viewRegistry[reactTag];
        if (!view || ![view isKindOfClass:[RCTScrollView class]]) {
          RCTLogError(@"Cannot find RCTScrollView with tag #%@", reactTag);
          return;
        }

        CGSize size = view.scrollView.contentSize;
        callback(@[ @{@"width" : @(size.width), @"height" : @(size.height)} ]);
      }];
}

RCT_EXPORT_METHOD(scrollTo
                  : (nonnull NSNumber *)reactTag offsetX
                  : (CGFloat)x offsetY
                  : (CGFloat)y animated
                  : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[reactTag];
        if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
          [(id<RCTScrollableProtocol>)view scrollToOffset:(CGPoint){x, y} animated:animated];
        } else {
          RCTLogError(
              @"tried to scrollTo: on non-RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              reactTag);
        }
      }];
}

RCT_EXPORT_METHOD(scrollToEnd : (nonnull NSNumber *)reactTag animated : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[reactTag];
        if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
          [(id<RCTScrollableProtocol>)view scrollToEnd:animated];
        } else {
          RCTLogError(
              @"tried to scrollTo: on non-RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              reactTag);
        }
      }];
}

RCT_EXPORT_METHOD(zoomToRect : (nonnull NSNumber *)reactTag withRect : (CGRect)rect animated : (BOOL)animated)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
        UIView *view = viewRegistry[reactTag];
        if ([view conformsToProtocol:@protocol(RCTScrollableProtocol)]) {
          [(id<RCTScrollableProtocol>)view zoomToRect:rect animated:animated];
        } else {
          RCTLogError(
              @"tried to zoomToRect: on non-RCTScrollableProtocol view %@ "
               "with tag #%@",
              view,
              reactTag);
        }
      }];
}

RCT_EXPORT_METHOD(flashScrollIndicators : (nonnull NSNumber *)reactTag)
{
  [self.bridge.uiManager
      addUIBlock:^(__unused RCTUIManager *uiManager, NSDictionary<NSNumber *, RCTScrollView *> *viewRegistry) {
        RCTScrollView *view = viewRegistry[reactTag];
        if (!view || ![view isKindOfClass:[RCTScrollView class]]) {
          RCTLogError(@"Cannot find RCTScrollView with tag #%@", reactTag);
          return;
        }

        [view.scrollView flashScrollIndicators];
      }];
}

@end
