/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTScrollViewComponentView.h"

#import <React/RCTAssert.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTConstants.h>
#import <React/RCTScrollEvent.h>

#import <react/renderer/components/scrollview/RCTComponentViewHelpers.h>
#import <react/renderer/components/scrollview/ScrollViewComponentDescriptor.h>
#import <react/renderer/components/scrollview/ScrollViewEventEmitter.h>
#import <react/renderer/components/scrollview/ScrollViewProps.h>
#import <react/renderer/components/scrollview/ScrollViewState.h>
#import <react/renderer/components/scrollview/conversions.h>
#import <react/renderer/graphics/Geometry.h>

#import "RCTConversions.h"
#import "RCTEnhancedScrollView.h"
#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

static CGFloat const kClippingLeeway = 44.0;

static UIScrollViewKeyboardDismissMode RCTUIKeyboardDismissModeFromProps(ScrollViewProps const &props)
{
  switch (props.keyboardDismissMode) {
    case ScrollViewKeyboardDismissMode::None:
      return UIScrollViewKeyboardDismissModeNone;
    case ScrollViewKeyboardDismissMode::OnDrag:
      return UIScrollViewKeyboardDismissModeOnDrag;
    case ScrollViewKeyboardDismissMode::Interactive:
      return UIScrollViewKeyboardDismissModeInteractive;
  }
}

static UIScrollViewIndicatorStyle RCTUIScrollViewIndicatorStyleFromProps(ScrollViewProps const &props)
{
  switch (props.indicatorStyle) {
    case ScrollViewIndicatorStyle::Default:
      return UIScrollViewIndicatorStyleDefault;
    case ScrollViewIndicatorStyle::Black:
      return UIScrollViewIndicatorStyleBlack;
    case ScrollViewIndicatorStyle::White:
      return UIScrollViewIndicatorStyleWhite;
  }
}

// Once Fabric implements proper NativeAnimationDriver, this should be removed.
// This is just a workaround to allow animations based on onScroll event.
// This is only used to animate sticky headers in ScrollViews, and only the contentOffset and tag is used.
// TODO: T116850910 [Fabric][iOS] Make Fabric not use legacy RCTEventDispatcher for native-driven AnimatedEvents
static void RCTSendScrollEventForNativeAnimations_DEPRECATED(UIScrollView *scrollView, NSInteger tag)
{
  static uint16_t coalescingKey = 0;
  RCTScrollEvent *scrollEvent = [[RCTScrollEvent alloc] initWithEventName:@"onScroll"
                                                                 reactTag:[NSNumber numberWithInt:tag]
                                                  scrollViewContentOffset:scrollView.contentOffset
                                                   scrollViewContentInset:scrollView.contentInset
                                                    scrollViewContentSize:scrollView.contentSize
                                                          scrollViewFrame:scrollView.frame
                                                      scrollViewZoomScale:scrollView.zoomScale
                                                                 userData:nil
                                                            coalescingKey:coalescingKey];
  RCTBridge *bridge = [RCTBridge currentBridge];
  if (bridge) {
    [bridge.eventDispatcher sendEvent:scrollEvent];
  } else {
    NSDictionary *userInfo = [NSDictionary dictionaryWithObjectsAndKeys:scrollEvent, @"event", nil];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED"
                                                        object:nil
                                                      userInfo:userInfo];
  }
}

@interface RCTScrollViewComponentView () <
    UIScrollViewDelegate,
    RCTScrollViewProtocol,
    RCTScrollableProtocol,
    RCTEnhancedScrollViewOverridingDelegate>

@end

@implementation RCTScrollViewComponentView {
  ScrollViewShadowNode::ConcreteState::Shared _state;
  CGSize _contentSize;
  NSTimeInterval _lastScrollEventDispatchTime;
  NSTimeInterval _scrollEventThrottle;
  // Flag indicating whether the scrolling that is currently happening
  // is triggered by user or not.
  // This helps to only update state from `scrollViewDidScroll` in case
  // some other part of the system scrolls scroll view.
  BOOL _isUserTriggeredScrolling;
  BOOL _shouldUpdateContentInsetAdjustmentBehavior;

  CGPoint _contentOffsetWhenClipped;
}

+ (RCTScrollViewComponentView *_Nullable)findScrollViewComponentViewForView:(UIView *)view
{
  do {
    view = view.superview;
  } while (view != nil && ![view isKindOfClass:[RCTScrollViewComponentView class]]);
  return (RCTScrollViewComponentView *)view;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const ScrollViewProps>();
    _props = defaultProps;

    _scrollView = [[RCTEnhancedScrollView alloc] initWithFrame:self.bounds];
    _scrollView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _scrollView.delaysContentTouches = NO;
    ((RCTEnhancedScrollView *)_scrollView).overridingDelegate = self;
    _isUserTriggeredScrolling = NO;
    _shouldUpdateContentInsetAdjustmentBehavior = YES;
    [self addSubview:_scrollView];

    _containerView = [[UIView alloc] initWithFrame:CGRectZero];
    [_scrollView addSubview:_containerView];

    [self.scrollViewDelegateSplitter addDelegate:self];

    _scrollEventThrottle = INFINITY;
  }

  return self;
}

- (void)dealloc
{
  // Removing all delegates from the splitter nils the actual delegate which prevents a crash on UIScrollView
  // deallocation.
  [self.scrollViewDelegateSplitter removeAllDelegates];
}

- (RCTGenericDelegateSplitter<id<UIScrollViewDelegate>> *)scrollViewDelegateSplitter
{
  return ((RCTEnhancedScrollView *)_scrollView).delegateSplitter;
}

#pragma mark - RCTMountingTransactionObserving

- (void)mountingTransactionDidMount:(MountingTransaction const &)transaction
               withSurfaceTelemetry:(facebook::react::SurfaceTelemetry const &)surfaceTelemetry
{
  [self _remountChildren];
}

#pragma mark - RCTComponentViewProtocol

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<ScrollViewComponentDescriptor>();
}

- (void)updateLayoutMetrics:(const LayoutMetrics &)layoutMetrics
           oldLayoutMetrics:(const LayoutMetrics &)oldLayoutMetrics
{
  [super updateLayoutMetrics:layoutMetrics oldLayoutMetrics:oldLayoutMetrics];
  if (layoutMetrics.layoutDirection != oldLayoutMetrics.layoutDirection) {
    CGAffineTransform transform = (layoutMetrics.layoutDirection == LayoutDirection::LeftToRight)
        ? CGAffineTransformIdentity
        : CGAffineTransformMakeScale(-1, 1);

    _containerView.transform = transform;
    _scrollView.transform = transform;
  }
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldScrollViewProps = *std::static_pointer_cast<const ScrollViewProps>(_props);
  const auto &newScrollViewProps = *std::static_pointer_cast<const ScrollViewProps>(props);

#define REMAP_PROP(reactName, localName, target)                      \
  if (oldScrollViewProps.reactName != newScrollViewProps.reactName) { \
    target.localName = newScrollViewProps.reactName;                  \
  }

#define REMAP_VIEW_PROP(reactName, localName) REMAP_PROP(reactName, localName, self)
#define MAP_VIEW_PROP(name) REMAP_VIEW_PROP(name, name)
#define REMAP_SCROLL_VIEW_PROP(reactName, localName) \
  REMAP_PROP(reactName, localName, ((RCTEnhancedScrollView *)_scrollView))
#define MAP_SCROLL_VIEW_PROP(name) REMAP_SCROLL_VIEW_PROP(name, name)

  // FIXME: Commented props are not supported yet.
  MAP_SCROLL_VIEW_PROP(alwaysBounceHorizontal);
  MAP_SCROLL_VIEW_PROP(alwaysBounceVertical);
  MAP_SCROLL_VIEW_PROP(bounces);
  MAP_SCROLL_VIEW_PROP(bouncesZoom);
  MAP_SCROLL_VIEW_PROP(canCancelContentTouches);
  MAP_SCROLL_VIEW_PROP(centerContent);
  // MAP_SCROLL_VIEW_PROP(automaticallyAdjustContentInsets);
  MAP_SCROLL_VIEW_PROP(decelerationRate);
  MAP_SCROLL_VIEW_PROP(directionalLockEnabled);
  MAP_SCROLL_VIEW_PROP(maximumZoomScale);
  MAP_SCROLL_VIEW_PROP(minimumZoomScale);
  MAP_SCROLL_VIEW_PROP(scrollEnabled);
  MAP_SCROLL_VIEW_PROP(pagingEnabled);
  MAP_SCROLL_VIEW_PROP(pinchGestureEnabled);
  MAP_SCROLL_VIEW_PROP(scrollsToTop);
  MAP_SCROLL_VIEW_PROP(showsHorizontalScrollIndicator);
  MAP_SCROLL_VIEW_PROP(showsVerticalScrollIndicator);

  if (oldScrollViewProps.scrollIndicatorInsets != newScrollViewProps.scrollIndicatorInsets) {
    _scrollView.scrollIndicatorInsets = RCTUIEdgeInsetsFromEdgeInsets(newScrollViewProps.scrollIndicatorInsets);
  }

  if (oldScrollViewProps.indicatorStyle != newScrollViewProps.indicatorStyle) {
    _scrollView.indicatorStyle = RCTUIScrollViewIndicatorStyleFromProps(newScrollViewProps);
  }

  if (oldScrollViewProps.scrollEventThrottle != newScrollViewProps.scrollEventThrottle) {
    // Zero means "send value only once per significant logical event".
    // Prop value is in milliseconds.
    // iOS implementation uses `NSTimeInterval` (in seconds).
    CGFloat throttleInSeconds = newScrollViewProps.scrollEventThrottle / 1000.0;
    CGFloat msPerFrame = 1.0 / 60.0;
    if (throttleInSeconds < 0) {
      _scrollEventThrottle = INFINITY;
    } else if (throttleInSeconds <= msPerFrame) {
      _scrollEventThrottle = 0;
    } else {
      _scrollEventThrottle = throttleInSeconds;
    }
  }

  MAP_SCROLL_VIEW_PROP(zoomScale);

  if (oldScrollViewProps.contentInset != newScrollViewProps.contentInset) {
    _scrollView.contentInset = RCTUIEdgeInsetsFromEdgeInsets(newScrollViewProps.contentInset);
  }

  RCTEnhancedScrollView *scrollView = (RCTEnhancedScrollView *)_scrollView;
  if (oldScrollViewProps.contentOffset != newScrollViewProps.contentOffset) {
    _scrollView.contentOffset = RCTCGPointFromPoint(newScrollViewProps.contentOffset);
  }

  if (oldScrollViewProps.snapToAlignment != newScrollViewProps.snapToAlignment) {
    scrollView.snapToAlignment = RCTNSStringFromString(toString(newScrollViewProps.snapToAlignment));
  }

  scrollView.snapToStart = newScrollViewProps.snapToStart;
  scrollView.snapToEnd = newScrollViewProps.snapToEnd;

  if (oldScrollViewProps.snapToOffsets != newScrollViewProps.snapToOffsets) {
    NSMutableArray<NSNumber *> *snapToOffsets = [NSMutableArray array];
    for (auto const &snapToOffset : newScrollViewProps.snapToOffsets) {
      [snapToOffsets addObject:[NSNumber numberWithFloat:snapToOffset]];
    }
    scrollView.snapToOffsets = snapToOffsets;
  }

  if (@available(iOS 13.0, *)) {
    if (oldScrollViewProps.automaticallyAdjustsScrollIndicatorInsets !=
        newScrollViewProps.automaticallyAdjustsScrollIndicatorInsets) {
      scrollView.automaticallyAdjustsScrollIndicatorInsets =
          newScrollViewProps.automaticallyAdjustsScrollIndicatorInsets;
    }
  }

  if ((oldScrollViewProps.contentInsetAdjustmentBehavior != newScrollViewProps.contentInsetAdjustmentBehavior) ||
      _shouldUpdateContentInsetAdjustmentBehavior) {
    auto const contentInsetAdjustmentBehavior = newScrollViewProps.contentInsetAdjustmentBehavior;
    if (contentInsetAdjustmentBehavior == ContentInsetAdjustmentBehavior::Never) {
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
    } else if (contentInsetAdjustmentBehavior == ContentInsetAdjustmentBehavior::Automatic) {
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentAutomatic;
    } else if (contentInsetAdjustmentBehavior == ContentInsetAdjustmentBehavior::ScrollableAxes) {
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentAutomatic;
    } else if (contentInsetAdjustmentBehavior == ContentInsetAdjustmentBehavior::Always) {
      scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentAlways;
    }
    _shouldUpdateContentInsetAdjustmentBehavior = NO;
  }

  MAP_SCROLL_VIEW_PROP(disableIntervalMomentum);
  MAP_SCROLL_VIEW_PROP(snapToInterval);

  if (oldScrollViewProps.keyboardDismissMode != newScrollViewProps.keyboardDismissMode) {
    scrollView.keyboardDismissMode = RCTUIKeyboardDismissModeFromProps(newScrollViewProps);
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)updateState:(State::Shared const &)state oldState:(State::Shared const &)oldState
{
  assert(std::dynamic_pointer_cast<ScrollViewShadowNode::ConcreteState const>(state));
  _state = std::static_pointer_cast<ScrollViewShadowNode::ConcreteState const>(state);
  auto &data = _state->getData();

  auto contentOffset = RCTCGPointFromPoint(data.contentOffset);
  if (!oldState && !CGPointEqualToPoint(contentOffset, CGPointZero)) {
    _scrollView.contentOffset = contentOffset;
  }

  CGSize contentSize = RCTCGSizeFromSize(data.getContentSize());

  if (CGSizeEqualToSize(_contentSize, contentSize)) {
    return;
  }

  _contentSize = contentSize;
  _containerView.frame = CGRect{RCTCGPointFromPoint(data.contentBoundingRect.origin), contentSize};

  [self _preserveContentOffsetIfNeededWithBlock:^{
    self->_scrollView.contentSize = contentSize;
  }];
}

/*
 * Disables programmatical changing of ScrollView's `contentOffset` if a touch gesture is in progress.
 */
- (void)_preserveContentOffsetIfNeededWithBlock:(void (^)())block
{
  if (!block) {
    return;
  }

  if (!_isUserTriggeredScrolling) {
    return block();
  }

  [((RCTEnhancedScrollView *)_scrollView) preserveContentOffsetWithBlock:block];
}

- (void)mountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [_containerView insertSubview:childComponentView atIndex:index];
}

- (void)unmountChildComponentView:(UIView<RCTComponentViewProtocol> *)childComponentView index:(NSInteger)index
{
  [childComponentView removeFromSuperview];
}

/*
 * Returns whether or not the scroll view interaction should be blocked because
 * JavaScript was found to be the responder.
 */
- (BOOL)_shouldDisableScrollInteraction
{
  UIView *ancestorView = self.superview;

  while (ancestorView) {
    if ([ancestorView respondsToSelector:@selector(isJSResponder)]) {
      BOOL isJSResponder = ((UIView<RCTComponentViewProtocol> *)ancestorView).isJSResponder;
      if (isJSResponder) {
        return YES;
      }
    }

    ancestorView = ancestorView.superview;
  }

  return NO;
}

- (ScrollViewMetrics)_scrollViewMetrics
{
  ScrollViewMetrics metrics;
  metrics.contentSize = RCTSizeFromCGSize(_scrollView.contentSize);
  metrics.contentOffset = RCTPointFromCGPoint(_scrollView.contentOffset);
  metrics.contentInset = RCTEdgeInsetsFromUIEdgeInsets(_scrollView.contentInset);
  metrics.containerSize = RCTSizeFromCGSize(_scrollView.bounds.size);
  metrics.zoomScale = _scrollView.zoomScale;
  return metrics;
}

- (void)_updateStateWithContentOffset
{
  if (!_state) {
    return;
  }
  auto contentOffset = RCTPointFromCGPoint(_scrollView.contentOffset);
  _state->updateState([contentOffset](ScrollViewShadowNode::ConcreteState::Data const &data) {
    auto newData = data;
    newData.contentOffset = contentOffset;
    return std::make_shared<ScrollViewShadowNode::ConcreteState::Data const>(newData);
  });
}

- (void)prepareForRecycle
{
  const auto &props = *std::static_pointer_cast<const ScrollViewProps>(_props);
  _scrollView.contentOffset = RCTCGPointFromPoint(props.contentOffset);
  // We set the default behavior to "never" so that iOS
  // doesn't do weird things to UIScrollView insets automatically
  // and keeps it as an opt-in behavior.
  _scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
  _shouldUpdateContentInsetAdjustmentBehavior = YES;
  _state.reset();
  _isUserTriggeredScrolling = NO;
  CGRect oldFrame = self.frame;
  self.frame = CGRectZero;
  self.frame = oldFrame;
  [super prepareForRecycle];
}

#pragma mark - UIScrollViewDelegate

- (BOOL)touchesShouldCancelInContentView:(__unused UIView *)view
{
  // Historically, `UIScrollView`s in React Native do not cancel touches
  // started on `UIControl`-based views (as normal iOS `UIScrollView`s do).
  return ![self _shouldDisableScrollInteraction];
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
  if (!_isUserTriggeredScrolling) {
    [self _updateStateWithContentOffset];
  }

  NSTimeInterval now = CACurrentMediaTime();
  if ((_lastScrollEventDispatchTime == 0) || (now - _lastScrollEventDispatchTime > _scrollEventThrottle)) {
    _lastScrollEventDispatchTime = now;
    if (_eventEmitter) {
      std::static_pointer_cast<ScrollViewEventEmitter const>(_eventEmitter)->onScroll([self _scrollViewMetrics]);
    }

    RCTSendScrollEventForNativeAnimations_DEPRECATED(scrollView, self.tag);
  }

  [self _remountChildrenIfNeeded];
}

- (void)scrollViewDidZoom:(UIScrollView *)scrollView
{
  [self scrollViewDidScroll:scrollView];
}

- (BOOL)scrollViewShouldScrollToTop:(UIScrollView *)scrollView
{
  _isUserTriggeredScrolling = YES;
  return YES;
}

- (void)scrollViewDidScrollToTop:(UIScrollView *)scrollView
{
  _isUserTriggeredScrolling = NO;
  [self _updateStateWithContentOffset];
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<ScrollViewEventEmitter const>(_eventEmitter)->onScrollBeginDrag([self _scrollViewMetrics]);
  _isUserTriggeredScrolling = YES;
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<ScrollViewEventEmitter const>(_eventEmitter)->onScrollEndDrag([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

- (void)scrollViewWillBeginDecelerating:(UIScrollView *)scrollView
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<ScrollViewEventEmitter const>(_eventEmitter)
      ->onMomentumScrollBegin([self _scrollViewMetrics]);
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<ScrollViewEventEmitter const>(_eventEmitter)->onMomentumScrollEnd([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
  _isUserTriggeredScrolling = NO;
}

- (void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView
{
  [self _handleFinishedScrolling:scrollView];
}

- (void)_handleFinishedScrolling:(UIScrollView *)scrollView
{
  [self _forceDispatchNextScrollEvent];
  [self scrollViewDidScroll:scrollView];

  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<ScrollViewEventEmitter const>(_eventEmitter)->onMomentumScrollEnd([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

- (void)scrollViewWillBeginZooming:(UIScrollView *)scrollView withView:(nullable UIView *)view
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<ScrollViewEventEmitter const>(_eventEmitter)->onScrollBeginDrag([self _scrollViewMetrics]);
}

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView withView:(nullable UIView *)view atScale:(CGFloat)scale
{
  [self _forceDispatchNextScrollEvent];

  if (!_eventEmitter) {
    return;
  }

  std::static_pointer_cast<ScrollViewEventEmitter const>(_eventEmitter)->onScrollEndDrag([self _scrollViewMetrics]);
  [self _updateStateWithContentOffset];
}

- (UIView *)viewForZoomingInScrollView:(__unused UIScrollView *)scrollView
{
  return _containerView;
}

#pragma mark -

- (void)_forceDispatchNextScrollEvent
{
  _lastScrollEventDispatchTime = 0;
}

#pragma mark - Native commands

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTScrollViewHandleCommand(self, commandName, args);
}

- (void)flashScrollIndicators
{
  [_scrollView flashScrollIndicators];
}

- (void)scrollTo:(double)x y:(double)y animated:(BOOL)animated
{
  CGPoint offset = CGPointMake(x, y);
  CGRect maxRect = CGRectMake(
      fmin(-_scrollView.contentInset.left, 0),
      fmin(-_scrollView.contentInset.top, 0),
      fmax(
          _scrollView.contentSize.width - _scrollView.bounds.size.width + _scrollView.contentInset.right +
              fmax(_scrollView.contentInset.left, 0),
          0.01),
      fmax(
          _scrollView.contentSize.height - _scrollView.bounds.size.height + _scrollView.contentInset.bottom +
              fmax(_scrollView.contentInset.top, 0),
          0.01)); // Make width and height greater than 0

  const auto &props = *std::static_pointer_cast<const ScrollViewProps>(_props);
  if (!CGRectContainsPoint(maxRect, offset) && !props.scrollToOverflowEnabled) {
    CGFloat localX = fmax(offset.x, CGRectGetMinX(maxRect));
    localX = fmin(localX, CGRectGetMaxX(maxRect));
    CGFloat localY = fmax(offset.y, CGRectGetMinY(maxRect));
    localY = fmin(localY, CGRectGetMaxY(maxRect));
    offset = CGPointMake(localX, localY);
  }

  [self scrollToOffset:offset animated:animated];
}

- (void)scrollToEnd:(BOOL)animated
{
  BOOL isHorizontal = _scrollView.contentSize.width > self.frame.size.width;
  CGPoint offset;
  if (isHorizontal) {
    CGFloat offsetX = _scrollView.contentSize.width - _scrollView.bounds.size.width + _scrollView.contentInset.right;
    offset = CGPointMake(fmax(offsetX, 0), 0);
  } else {
    CGFloat offsetY = _scrollView.contentSize.height - _scrollView.bounds.size.height + _scrollView.contentInset.bottom;
    offset = CGPointMake(0, fmax(offsetY, 0));
  }

  [self scrollToOffset:offset animated:animated];
}

#pragma mark - Child views mounting

- (void)updateClippedSubviewsWithClipRect:(CGRect)clipRect relativeToView:(UIView *)clipView
{
  // Do nothing. ScrollView manages its subview clipping individually in `_remountChildren`.
}

- (void)_remountChildrenIfNeeded
{
  CGPoint contentOffset = _scrollView.contentOffset;

  if (std::abs(_contentOffsetWhenClipped.x - contentOffset.x) < kClippingLeeway &&
      std::abs(_contentOffsetWhenClipped.y - contentOffset.y) < kClippingLeeway) {
    return;
  }

  _contentOffsetWhenClipped = contentOffset;

  [self _remountChildren];
}

- (void)_remountChildren
{
  [_scrollView updateClippedSubviewsWithClipRect:CGRectInset(_scrollView.bounds, -kClippingLeeway, -kClippingLeeway)
                                  relativeToView:_scrollView];
}

#pragma mark - RCTScrollableProtocol

- (CGSize)contentSize
{
  return _contentSize;
}

- (void)scrollToOffset:(CGPoint)offset
{
  [self scrollToOffset:offset animated:YES];
}

- (void)scrollToOffset:(CGPoint)offset animated:(BOOL)animated
{
  if (CGPointEqualToPoint(_scrollView.contentOffset, offset)) {
    return;
  }

  [self _forceDispatchNextScrollEvent];

  if (_layoutMetrics.layoutDirection == LayoutDirection::RightToLeft) {
    // Adjusting offset.x in right to left layout direction.
    offset.x = self.contentSize.width - _scrollView.frame.size.width - offset.x;
  }

  [_scrollView setContentOffset:offset animated:animated];

  if (!animated) {
    // When not animated, the expected workflow in ``scrollViewDidEndScrollingAnimation`` after scrolling is not going
    // to get triggered. We will need to manually execute here.
    [self _handleFinishedScrolling:_scrollView];
  }
}

- (void)zoomToRect:(CGRect)rect animated:(BOOL)animated
{
  [_scrollView zoomToRect:rect animated:animated];
}

- (void)addScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener
{
  [self.scrollViewDelegateSplitter addDelegate:scrollListener];
}

- (void)removeScrollListener:(NSObject<UIScrollViewDelegate> *)scrollListener
{
  [self.scrollViewDelegateSplitter removeDelegate:scrollListener];
}

@end

Class<RCTComponentViewProtocol> RCTScrollViewCls(void)
{
  return RCTScrollViewComponentView.class;
}
