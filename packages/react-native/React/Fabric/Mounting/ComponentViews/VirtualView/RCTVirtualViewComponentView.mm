/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTVirtualViewComponentView.h"

#import <React/RCTAssert.h>
#import <React/RCTConversions.h>
#import <React/RCTScrollViewComponentView.h>
#import <React/RCTScrollableProtocol.h>
#import <React/UIView+React.h>
#import <jsi/jsi.h>

#import <react/featureflags/ReactNativeFeatureFlags.h>
#import <react/renderer/components/FBReactNativeSpec/ComponentDescriptors.h>
#import <react/renderer/components/FBReactNativeSpec/EventEmitters.h>
#import <react/renderer/components/FBReactNativeSpec/Props.h>
#import <react/renderer/components/virtualview/VirtualViewComponentDescriptor.h>
#import <react/renderer/components/virtualview/VirtualViewShadowNode.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook;
using namespace facebook::react;

typedef NS_ENUM(NSInteger, RCTVirtualViewMode) {
  RCTVirtualViewModeVisible = 0,
  RCTVirtualViewModePrerender = 1,
  RCTVirtualViewModeHidden = 2,
};

typedef NS_ENUM(NSInteger, RCTVirtualViewRenderState) {
  RCTVirtualViewRenderStateUnknown = 0,
  RCTVirtualViewRenderStateRendered = 1,
  RCTVirtualViewRenderStateNone = 2,
};

/**
 * Checks whether one CGRect overlaps with another CGRect.
 *
 * This is different from CGRectIntersectsRect because a CGRect representing
 * a line or a point is considered to overlap with another CGRect if the line
 * or point is within the rect bounds. However, two CGRects are not considered
 * to overlap if they only share a boundary.
 */
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

@interface RCTVirtualViewComponentView () <UIScrollViewDelegate>
@end

@implementation RCTVirtualViewComponentView {
  RCTScrollViewComponentView *_lastParentScrollViewComponentView;
  std::optional<enum RCTVirtualViewMode> _mode;
  enum RCTVirtualViewRenderState _renderState;
  std::optional<CGRect> _targetRect;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = VirtualViewShadowNode::defaultSharedProps();
    _renderState = RCTVirtualViewRenderStateUnknown;
  }

  return self;
}

- (void)updateProps:(const Props::Shared &)props oldProps:(const Props::Shared &)oldProps
{
  const auto &newViewProps = static_cast<const VirtualViewProps &>(*props);

  if (!_mode.has_value()) {
    _mode = newViewProps.initialHidden ? RCTVirtualViewModeHidden : RCTVirtualViewModeVisible;
    if (ReactNativeFeatureFlags::hideOffscreenVirtualViewsOnIOS()) {
      self.hidden = newViewProps.initialHidden && !sIsAccessibilityUsed;
    }
  }

  // If disabled, `_renderState` will always be `RCTVirtualViewRenderStateUnknown`.
  if (ReactNativeFeatureFlags::enableVirtualViewRenderState()) {
    switch (newViewProps.renderState) {
      case 1:
        _renderState = RCTVirtualViewRenderStateRendered;
        break;
      case 2:
        _renderState = RCTVirtualViewRenderStateNone;
        break;
      default:
        _renderState = RCTVirtualViewRenderStateUnknown;
        break;
    }
  }

  [super updateProps:props oldProps:oldProps];
}

- (RCTScrollViewComponentView *)getParentScrollViewComponentView
{
  UIView *view = self.superview;
  while (view != nil) {
    if ([view isKindOfClass:[RCTScrollViewComponentView class]]) {
      return (RCTScrollViewComponentView *)view;
    }
    view = view.superview;
  }
  return nil;
}

/**
 * Static flag that tracks whether accessibility services are being used.
 * When accessibility is detected, virtual views will remain visible even when
 * they would normally be hidden when off-screen, ensuring that accessibility
 * features will work correctly.
 */
static BOOL sIsAccessibilityUsed = NO;

- (void)_unhideIfNeeded
{
  if (!sIsAccessibilityUsed) {
    // accessibility is detected for the first time. Make views visible.
    sIsAccessibilityUsed = YES;
  }

  if (self.hidden) {
    self.hidden = NO;
  }
}

- (NSInteger)accessibilityElementCount
{
  // From empirical testing, method `accessibilityElementCount` is called lazily only
  // when accessibility is used.
  [self _unhideIfNeeded];
  return [super accessibilityElementCount];
}

- (NSArray<id<UIFocusItem>> *)focusItemsInRect:(CGRect)rect
{
  // From empirical testing, method `focusItemsInRect:` is called lazily only
  // when keyboard navigation is used.
  [self _unhideIfNeeded];
  return [super focusItemsInRect:rect];
}

- (void)prepareForRecycle
{
  [super prepareForRecycle];

  // No need to remove the scroll listener here since the view is always removed from window before being recycled and
  // we do that in didMoveToWindow, which gets called when the view is removed from window.
  RCTAssert(
      _lastParentScrollViewComponentView == nil,
      @"_lastParentScrollViewComponentView should already have been cleared in didMoveToWindow.");

  self.hidden = NO;
  _mode.reset();
  _targetRect.reset();
}

// Handles case when sibling changes size.
// TODO(T202601695): This doesn't yet handle the case of elements in the ScrollView outside a VirtualColumn changing
// size.
- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:_layoutMetrics];

  [self dispatchOnModeChangeIfNeeded:YES];
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (_lastParentScrollViewComponentView) {
    [_lastParentScrollViewComponentView removeScrollListener:self];
    _lastParentScrollViewComponentView = nil;
  }

  if (RCTScrollViewComponentView *parentScrollViewComponentView = [self getParentScrollViewComponentView]) {
    if (self.window) {
      // TODO(T202601695): We also want the ScrollView to emit layout changes from didLayoutSubviews so that any event
      // that may affect visibily of this view notifies the listeners.
      [parentScrollViewComponentView addScrollListener:self];
      _lastParentScrollViewComponentView = parentScrollViewComponentView;

      // We want to dispatch the event immediately when the view is added to the window before any scrolling occurs.
      [self dispatchOnModeChangeIfNeeded:NO];
    }
  }
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  [self dispatchOnModeChangeIfNeeded:NO];
}

- (void)dispatchOnModeChangeIfNeeded:(BOOL)checkForTargetRectChange
{
  if (!_lastParentScrollViewComponentView) {
    return;
  }

  UIScrollView *scrollView = _lastParentScrollViewComponentView.scrollView;
  CGRect targetRect = [self convertRect:self.bounds toView:scrollView];

  // While scrolling, the `targetRect` does not change, so we don't check for changed `targetRect` in that case.
  if (checkForTargetRectChange) {
    if (_targetRect.has_value() && CGRectEqualToRect(targetRect, _targetRect.value())) {
      return;
    }
    _targetRect = targetRect;
  }

  enum RCTVirtualViewMode newMode;
  CGRect thresholdRect = CGRectMake(
      scrollView.contentOffset.x,
      scrollView.contentOffset.y,
      scrollView.frame.size.width,
      scrollView.frame.size.height);
  if (CGRectOverlaps(targetRect, thresholdRect)) {
    newMode = RCTVirtualViewModeVisible;
  } else {
    auto prerender = false;
    const CGFloat prerenderRatio = ReactNativeFeatureFlags::virtualViewPrerenderRatio();
    if (prerenderRatio > 0) {
      thresholdRect = CGRectInset(
          thresholdRect, -thresholdRect.size.width * prerenderRatio, -thresholdRect.size.height * prerenderRatio);
      prerender = CGRectOverlaps(targetRect, thresholdRect);
    }
    if (prerender) {
      newMode = RCTVirtualViewModePrerender;
    } else {
      newMode = RCTVirtualViewModeHidden;
      thresholdRect = CGRectZero;
    }
  }

  if (_mode.has_value() && newMode == _mode.value()) {
    return;
  }

  // NOTE: Make sure to keep these props in sync with dispatchSyncModeChange below where we have to explicitly copy all
  // props.
  VirtualViewEventEmitter::OnModeChange event = {
      .mode = (int)newMode,
      .targetRect =
          {.x = targetRect.origin.x,
           .y = targetRect.origin.y,
           .width = targetRect.size.width,
           .height = targetRect.size.height},
      .thresholdRect =
          {.x = thresholdRect.origin.x,
           .y = thresholdRect.origin.y,
           .width = thresholdRect.size.width,
           .height = thresholdRect.size.height},
  };

  const std::optional<enum RCTVirtualViewMode> oldMode = _mode;
  _mode = newMode;

  switch (newMode) {
    case RCTVirtualViewModeVisible:
      if (_renderState == RCTVirtualViewRenderStateUnknown) {
        // Feature flag is disabled, so use the former logic.
        [self dispatchSyncModeChange:event];
      } else {
        // If the previous mode was prerender and the result of dispatching that event was committed, we do not need to
        // dispatch an event for visible.
        const auto wasPrerenderCommitted = oldMode.has_value() && oldMode == RCTVirtualViewModePrerender &&
            _renderState == RCTVirtualViewRenderStateRendered;
        if (!wasPrerenderCommitted) {
          [self dispatchSyncModeChange:event];
        }
      }
      break;
    case RCTVirtualViewModePrerender:
      if (!oldMode.has_value() || oldMode != RCTVirtualViewModeVisible) {
        [self dispatchAsyncModeChange:event];
      }
      break;
    case RCTVirtualViewModeHidden:
      [self dispatchAsyncModeChange:event];
      break;
  }

  if (ReactNativeFeatureFlags::hideOffscreenVirtualViewsOnIOS()) {
    switch (newMode) {
      case RCTVirtualViewModeVisible:
        self.hidden = NO;
        break;
      case RCTVirtualViewModePrerender:
        self.hidden = !sIsAccessibilityUsed;
        break;
      case RCTVirtualViewModeHidden:
        self.hidden = YES;
        break;
    }
  }
}

- (void)dispatchAsyncModeChange:(VirtualViewEventEmitter::OnModeChange &)event
{
  if (!_eventEmitter) {
    return;
  }

  std::shared_ptr<const VirtualViewEventEmitter> emitter =
      std::static_pointer_cast<const VirtualViewEventEmitter>(_eventEmitter);
  emitter->onModeChange(event);
}

- (void)dispatchSyncModeChange:(VirtualViewEventEmitter::OnModeChange &)event
{
  if (!_eventEmitter) {
    return;
  }

  std::shared_ptr<const VirtualViewEventEmitter> emitter =
      std::static_pointer_cast<const VirtualViewEventEmitter>(_eventEmitter);

  // TODO: Move this into a custom event emitter. We had to duplicate the codegen code here from onModeChange in order
  // to dispatch synchronously and discrete.
  emitter->experimental_flushSync([&emitter, &event]() {
    emitter->dispatchEvent(
        "modeChange",
        [event](jsi::Runtime &runtime) {
          auto payload = jsi::Object(runtime);
          payload.setProperty(runtime, "mode", event.mode);
          {
            auto targetRect = jsi::Object(runtime);
            targetRect.setProperty(runtime, "x", event.targetRect.x);
            targetRect.setProperty(runtime, "y", event.targetRect.y);
            targetRect.setProperty(runtime, "width", event.targetRect.width);
            targetRect.setProperty(runtime, "height", event.targetRect.height);
            payload.setProperty(runtime, "targetRect", targetRect);
          }
          {
            auto thresholdRect = jsi::Object(runtime);
            thresholdRect.setProperty(runtime, "x", event.thresholdRect.x);
            thresholdRect.setProperty(runtime, "y", event.thresholdRect.y);
            thresholdRect.setProperty(runtime, "width", event.thresholdRect.width);
            thresholdRect.setProperty(runtime, "height", event.thresholdRect.height);
            payload.setProperty(runtime, "thresholdRect", thresholdRect);
          }
          return payload;
        },
        RawEvent::Category::Discrete);
  });
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<VirtualViewComponentDescriptor>();
}

@end

Class<RCTComponentViewProtocol> VirtualViewCls(void)
{
  return RCTVirtualViewComponentView.class;
}
